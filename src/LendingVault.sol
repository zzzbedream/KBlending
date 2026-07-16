// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IPriceOracle} from "./interfaces/IPriceOracle.sol";
import {InterestRateModel} from "./interest/InterestRateModel.sol";

/// @title LendingVault
/// @notice Two-sided, over-collateralized money market for a single asset pair on KUB Chain.
/// @dev Suppliers deposit `borrowToken` (e.g. KUSDT) and earn interest; borrowers post
///      `collateralToken` (e.g. a KAP-20 RWA such as RealX) and borrow `borrowToken` against
///      it. Interest accrues via a utilization-based rate ({InterestRateModel}) and is tracked
///      with scaled balances and per-side indices, Aave/Compound style.
///
///      KUB-specific defense: KAP-20 tokens expose `adminTransfer`, letting a token admin move
///      funds out of any address — including this vault — without its consent. The vault mirrors
///      the token balances it *should* hold (`totalCollateral` and `borrowCash`) and the
///      {checkDeficit} modifier halts all user actions the moment the real on-chain balance drops
///      below that, protecting depositors from silent admin exfiltration.
///
///      Assumptions (MVP): both tokens use 18 decimals and the oracle returns USD prices in WAD
///      (18 decimals). Production deployments with non-18-decimal tokens require decimal
///      normalization before wiring a market oracle.
contract LendingVault is ReentrancyGuard, Pausable, Ownable2Step {
    using SafeERC20 for IERC20;
    using InterestRateModel for uint256;

    // --- Immutable market configuration ---
    IERC20 public immutable collateralToken; // e.g. RealX (KAP-20)
    IERC20 public immutable borrowToken; // e.g. KUSDT (KAP-20)

    // --- Risk parameters (percent, PRECISION-based) ---
    uint256 public constant MAX_LTV = 40; // max borrow value = 40% of collateral value
    uint256 public constant LIQUIDATION_THRESHOLD = 50; // liquidatable once borrow > 50% of collateral value
    uint256 public constant CLOSE_FACTOR = 50; // at most 50% of a debt may be repaid per liquidation
    uint256 public constant LIQUIDATION_BONUS = 8; // liquidator seizes collateral at an 8% discount
    uint256 public constant PRECISION = 100;

    // --- Fixed-point / time constants ---
    uint256 private constant WAD = 1e18;
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    // --- Interest rate parameters (WAD per year), owner-tunable ---
    uint256 public baseRatePerYearWad = 0.02e18; // 2% at 0% utilization
    uint256 public slopePerYearWad = 0.2e18; // +20% at 100% utilization
    uint256 public reserveFactorWad = 0.1e18; // 10% of borrow interest to reserves

    // --- Price oracle (swappable: AdminPriceOracle on testnet, market oracle in prod) ---
    IPriceOracle public oracle;

    // --- Interest accounting ---
    uint256 public borrowIndex = WAD; // grows as borrowers accrue interest
    uint256 public supplyIndex = WAD; // grows as suppliers earn interest
    uint256 public lastAccrualTimestamp;
    uint256 public totalSupplyScaled; // sum of supplyScaled; actual = *supplyIndex/WAD
    uint256 public totalBorrowScaled; // sum of borrowScaled; actual = *borrowIndex/WAD
    uint256 public totalReserves; // protocol reserves (borrow-token units), part of borrowCash

    // --- Balances mirrored for the KAP-20 adminTransfer defense ---
    uint256 public totalCollateral; // collateral units the vault should hold
    uint256 public borrowCash; // borrow-token units the vault should hold (idle liquidity + reserves)

    // --- Per-user positions ---
    mapping(address user => uint256 scaled) public supplyScaled;
    mapping(address user => uint256 scaled) public borrowScaled;
    mapping(address user => uint256 amount) public collateralOf;

    // --- Events ---
    event Supplied(address indexed user, uint256 amount);
    event SupplyWithdrawn(address indexed user, uint256 amount);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed payer, address indexed borrower, uint256 amount);
    event Liquidated(
        address indexed liquidator, address indexed borrower, uint256 repaidAmount, uint256 seizedCollateral
    );
    event InterestAccrued(uint256 interest, uint256 borrowIndex, uint256 supplyIndex);
    event OracleUpdated(address indexed oracle);
    event InterestParamsUpdated(uint256 baseRatePerYearWad, uint256 slopePerYearWad, uint256 reserveFactorWad);
    event ReservesWithdrawn(address indexed to, uint256 amount);

    // --- Errors ---
    error ZeroAmount();
    error ZeroAddress();
    error IdenticalTokens();
    error InvalidReserveFactor();
    error InsufficientCollateral();
    error InsufficientLiquidity();
    error Undercollateralized();
    error NotLiquidatable();
    error DeficitDetected();

    /// @dev Halts user actions if the vault's real token balance has fallen below what it should
    ///      hold — the signature KUB-Chain protection against KAP-20 `adminTransfer` drains.
    modifier checkDeficit() {
        if (collateralToken.balanceOf(address(this)) < totalCollateral) revert DeficitDetected();
        if (borrowToken.balanceOf(address(this)) < borrowCash) revert DeficitDetected();
        _;
    }

    constructor(address _collateralToken, address _borrowToken, address _oracle, address initialOwner)
        Ownable(initialOwner)
    {
        if (_collateralToken == address(0) || _borrowToken == address(0) || _oracle == address(0)) {
            revert ZeroAddress();
        }
        if (_collateralToken == _borrowToken) revert IdenticalTokens();
        collateralToken = IERC20(_collateralToken);
        borrowToken = IERC20(_borrowToken);
        oracle = IPriceOracle(_oracle);
        lastAccrualTimestamp = block.timestamp;
    }

    // =========================================================================
    //                            Supply side (lenders)
    // =========================================================================

    /// @notice Supply `amount` of borrowToken to earn interest.
    function supply(uint256 amount) external nonReentrant whenNotPaused checkDeficit {
        if (amount == 0) revert ZeroAmount();
        accrueInterest();

        uint256 scaled = Math.mulDiv(amount, WAD, supplyIndex);
        supplyScaled[msg.sender] += scaled;
        totalSupplyScaled += scaled;
        borrowCash += amount;

        borrowToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Supplied(msg.sender, amount);
    }

    /// @notice Withdraw supplied liquidity plus accrued interest.
    /// @param amount Borrow-token amount to withdraw, or `type(uint256).max` for the full balance.
    function withdrawSupply(uint256 amount) external nonReentrant whenNotPaused checkDeficit {
        accrueInterest();

        uint256 supplied = _suppliedOf(msg.sender);
        if (amount == type(uint256).max || amount > supplied) amount = supplied;
        if (amount == 0) revert ZeroAmount();
        if (borrowCash < amount) revert InsufficientLiquidity();

        uint256 scaled = (amount == supplied) ? supplyScaled[msg.sender] : Math.mulDiv(amount, WAD, supplyIndex);
        supplyScaled[msg.sender] -= scaled;
        totalSupplyScaled -= scaled;
        borrowCash -= amount;

        borrowToken.safeTransfer(msg.sender, amount);
        emit SupplyWithdrawn(msg.sender, amount);
    }

    // =========================================================================
    //                        Borrow side (collateral)
    // =========================================================================

    /// @notice Deposit collateral to back future borrows.
    function deposit(uint256 amount) external nonReentrant whenNotPaused checkDeficit {
        if (amount == 0) revert ZeroAmount();

        collateralOf[msg.sender] += amount;
        totalCollateral += amount;

        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        emit CollateralDeposited(msg.sender, amount);
    }

    /// @notice Withdraw collateral, provided the position stays within {MAX_LTV}.
    function withdraw(uint256 amount) external nonReentrant whenNotPaused checkDeficit {
        if (amount == 0) revert ZeroAmount();
        if (collateralOf[msg.sender] < amount) revert InsufficientCollateral();
        accrueInterest();

        collateralOf[msg.sender] -= amount;
        totalCollateral -= amount;
        if (_borrowValue(msg.sender) * PRECISION > _collateralValue(msg.sender) * MAX_LTV) {
            revert Undercollateralized();
        }

        collateralToken.safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, amount);
    }

    /// @notice Borrow `amount` of borrowToken against deposited collateral.
    function borrow(uint256 amount) external nonReentrant whenNotPaused checkDeficit {
        if (amount == 0) revert ZeroAmount();
        accrueInterest();
        if (borrowCash < amount) revert InsufficientLiquidity();

        uint256 scaled = Math.mulDiv(amount, WAD, borrowIndex);
        borrowScaled[msg.sender] += scaled;
        totalBorrowScaled += scaled;
        if (_borrowValue(msg.sender) * PRECISION > _collateralValue(msg.sender) * MAX_LTV) {
            revert Undercollateralized();
        }
        borrowCash -= amount;

        borrowToken.safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    /// @notice Repay `amount` of a borrower's debt.
    /// @param borrower The debt holder (usually `msg.sender`; anyone may repay on their behalf).
    /// @param amount Borrow-token amount, or `type(uint256).max` to repay the full debt.
    function repay(address borrower, uint256 amount) external nonReentrant whenNotPaused checkDeficit {
        if (borrower == address(0)) revert ZeroAddress();
        accrueInterest();

        uint256 debt = _debtOf(borrower);
        if (debt == 0) revert ZeroAmount();
        if (amount == type(uint256).max || amount > debt) amount = debt;

        uint256 scaled = (amount == debt) ? borrowScaled[borrower] : Math.mulDiv(amount, WAD, borrowIndex);
        borrowScaled[borrower] -= scaled;
        totalBorrowScaled -= scaled;
        borrowCash += amount;

        borrowToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Repaid(msg.sender, borrower, amount);
    }

    /// @notice Liquidate an unhealthy position: repay part of the debt and seize collateral
    ///         at a {LIQUIDATION_BONUS} discount.
    /// @param borrower The position to liquidate.
    /// @param repayAmount Requested debt repayment; capped at {CLOSE_FACTOR} of the debt.
    function liquidate(address borrower, uint256 repayAmount) external nonReentrant whenNotPaused checkDeficit {
        accrueInterest();

        uint256 debt = _debtOf(borrower);
        if (debt == 0) revert ZeroAmount();
        // Liquidatable once borrow value exceeds the liquidation threshold of collateral value.
        if (_borrowValue(borrower) * PRECISION <= _collateralValue(borrower) * LIQUIDATION_THRESHOLD) {
            revert NotLiquidatable();
        }

        uint256 maxRepay = Math.mulDiv(debt, CLOSE_FACTOR, PRECISION);
        if (repayAmount > maxRepay) repayAmount = maxRepay;
        if (repayAmount == 0) revert ZeroAmount();

        // Collateral seized = repay value * (1 + bonus), converted to collateral units.
        uint256 pBorrow = _price(address(borrowToken));
        uint256 pCollateral = _price(address(collateralToken));
        uint256 repayValue = Math.mulDiv(repayAmount, pBorrow, WAD);
        uint256 seizeValue = Math.mulDiv(repayValue, PRECISION + LIQUIDATION_BONUS, PRECISION);
        uint256 seize = Math.mulDiv(seizeValue, WAD, pCollateral);
        if (seize > collateralOf[borrower]) seize = collateralOf[borrower];

        uint256 scaled = Math.mulDiv(repayAmount, WAD, borrowIndex);
        if (scaled > borrowScaled[borrower]) scaled = borrowScaled[borrower];
        borrowScaled[borrower] -= scaled;
        totalBorrowScaled -= scaled;
        collateralOf[borrower] -= seize;
        totalCollateral -= seize;
        borrowCash += repayAmount;

        borrowToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        collateralToken.safeTransfer(msg.sender, seize);
        emit Liquidated(msg.sender, borrower, repayAmount, seize);
    }

    // =========================================================================
    //                              Interest accrual
    // =========================================================================

    /// @notice Accrue borrow and supply interest since the last interaction.
    /// @dev Uses simple (non-compounding) interest over the elapsed interval, which is the
    ///      standard per-block approximation. Safe to call by anyone at any time.
    function accrueInterest() public {
        uint256 dt = block.timestamp - lastAccrualTimestamp;
        if (dt == 0) return;
        lastAccrualTimestamp = block.timestamp;

        uint256 borrowsPrior = _totalBorrows();
        if (borrowsPrior == 0) return;

        uint256 suppliedPrior = _totalSupplied();
        uint256 util = InterestRateModel.utilization(borrowsPrior, suppliedPrior);
        uint256 ratePerYear = util.borrowRatePerYear(baseRatePerYearWad, slopePerYearWad);
        uint256 interestFactor = Math.mulDiv(ratePerYear, dt, SECONDS_PER_YEAR);
        uint256 interest = Math.mulDiv(borrowsPrior, interestFactor, WAD);
        if (interest == 0) return;

        borrowIndex += Math.mulDiv(borrowIndex, interestFactor, WAD);

        uint256 toReserves = Math.mulDiv(interest, reserveFactorWad, WAD);
        uint256 toSuppliers = interest - toReserves;
        totalReserves += toReserves;
        if (suppliedPrior > 0 && toSuppliers > 0) {
            supplyIndex += Math.mulDiv(supplyIndex, toSuppliers, suppliedPrior);
        }
        emit InterestAccrued(interest, borrowIndex, supplyIndex);
    }

    // =========================================================================
    //                              Admin controls
    // =========================================================================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = IPriceOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    function setInterestParams(uint256 _baseRatePerYearWad, uint256 _slopePerYearWad, uint256 _reserveFactorWad)
        external
        onlyOwner
    {
        if (_reserveFactorWad > WAD) revert InvalidReserveFactor();
        accrueInterest();
        baseRatePerYearWad = _baseRatePerYearWad;
        slopePerYearWad = _slopePerYearWad;
        reserveFactorWad = _reserveFactorWad;
        emit InterestParamsUpdated(_baseRatePerYearWad, _slopePerYearWad, _reserveFactorWad);
    }

    /// @notice Withdraw accumulated protocol reserves.
    function withdrawReserves(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > totalReserves || amount > borrowCash) revert InsufficientLiquidity();
        totalReserves -= amount;
        borrowCash -= amount;
        borrowToken.safeTransfer(to, amount);
        emit ReservesWithdrawn(to, amount);
    }

    // =========================================================================
    //                              Views / helpers
    // =========================================================================

    /// @notice Current supplied balance of `user` including accrued interest.
    function suppliedOf(address user) external view returns (uint256) {
        return _suppliedOf(user);
    }

    /// @notice Current debt of `user` including accrued interest.
    function debtOf(address user) external view returns (uint256) {
        return _debtOf(user);
    }

    /// @notice Health factor in WAD (1e18 == 1.0). Below 1e18 the position is liquidatable.
    /// @dev Returns `type(uint256).max` for positions with no debt.
    function healthFactor(address user) external view returns (uint256) {
        uint256 borrowValue = _borrowValue(user);
        if (borrowValue == 0) return type(uint256).max;
        return Math.mulDiv(_collateralValue(user) * LIQUIDATION_THRESHOLD, WAD, borrowValue * PRECISION);
    }

    /// @notice Total supplied liquidity including accrued interest.
    function totalSupplied() external view returns (uint256) {
        return _totalSupplied();
    }

    /// @notice Total outstanding borrows including accrued interest.
    function totalBorrows() external view returns (uint256) {
        return _totalBorrows();
    }

    /// @notice Current utilization ratio in WAD.
    function utilization() external view returns (uint256) {
        return InterestRateModel.utilization(_totalBorrows(), _totalSupplied());
    }

    function _suppliedOf(address user) internal view returns (uint256) {
        return Math.mulDiv(supplyScaled[user], supplyIndex, WAD);
    }

    function _debtOf(address user) internal view returns (uint256) {
        return Math.mulDiv(borrowScaled[user], borrowIndex, WAD);
    }

    function _totalSupplied() internal view returns (uint256) {
        return Math.mulDiv(totalSupplyScaled, supplyIndex, WAD);
    }

    function _totalBorrows() internal view returns (uint256) {
        return Math.mulDiv(totalBorrowScaled, borrowIndex, WAD);
    }

    function _collateralValue(address user) internal view returns (uint256) {
        return Math.mulDiv(collateralOf[user], _price(address(collateralToken)), WAD);
    }

    function _borrowValue(address user) internal view returns (uint256) {
        return Math.mulDiv(_debtOf(user), _price(address(borrowToken)), WAD);
    }

    function _price(address token) internal view returns (uint256) {
        return oracle.getPrice(token);
    }
}
