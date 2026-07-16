// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {LendingVault} from "../src/LendingVault.sol";
import {AdminPriceOracle} from "../src/oracle/AdminPriceOracle.sol";
import {MockKAP20} from "./mocks/MockKAP20.sol";

contract LendingVaultTest is Test {
    LendingVault internal vault;
    MockKAP20 internal collateralToken; // RealX (KAP-20)
    MockKAP20 internal borrowToken; // KUSDT (KAP-20)
    AdminPriceOracle internal oracle;

    address internal owner = address(this);
    address internal alice = makeAddr("alice"); // supplier / lender
    address internal user1 = makeAddr("user1"); // borrower
    address internal bob = makeAddr("bob"); // liquidator

    uint256 internal constant WAD = 1e18;

    function setUp() public {
        collateralToken = new MockKAP20("RealX", "REALX");
        borrowToken = new MockKAP20("KUB Tether", "KUSDT");

        oracle = new AdminPriceOracle(owner);
        oracle.setPrice(address(collateralToken), 1e18); // $1
        oracle.setPrice(address(borrowToken), 1e18); // $1

        vault = new LendingVault(address(collateralToken), address(borrowToken), address(oracle), owner);

        // Fund actors.
        borrowToken.mint(alice, 1_000_000e18);
        borrowToken.mint(bob, 1_000_000e18);
        borrowToken.mint(user1, 1_000_000e18);
        collateralToken.mint(user1, 1_000_000e18);

        // Blanket approvals for convenience.
        vm.prank(alice);
        borrowToken.approve(address(vault), type(uint256).max);
        vm.startPrank(user1);
        collateralToken.approve(address(vault), type(uint256).max);
        borrowToken.approve(address(vault), type(uint256).max);
        vm.stopPrank();
        vm.prank(bob);
        borrowToken.approve(address(vault), type(uint256).max);
    }

    // --- Helpers ---

    function _supply(address who, uint256 amount) internal {
        vm.prank(who);
        vault.supply(amount);
    }

    function _deposit(address who, uint256 amount) internal {
        vm.prank(who);
        vault.deposit(amount);
    }

    function _borrow(address who, uint256 amount) internal {
        vm.prank(who);
        vault.borrow(amount);
    }

    // =========================================================================
    //                              Supply side
    // =========================================================================

    function test_SupplyAndWithdrawSupply() public {
        _supply(alice, 1000e18);
        assertEq(vault.suppliedOf(alice), 1000e18);
        assertEq(vault.totalSupplied(), 1000e18);
        assertEq(vault.borrowCash(), 1000e18);
        assertEq(borrowToken.balanceOf(address(vault)), 1000e18);

        vm.prank(alice);
        vault.withdrawSupply(400e18);
        assertEq(vault.suppliedOf(alice), 600e18);
        assertEq(vault.borrowCash(), 600e18);
    }

    function test_WithdrawSupplyMaxReturnsFullBalance() public {
        _supply(alice, 1000e18);
        uint256 before = borrowToken.balanceOf(alice);
        vm.prank(alice);
        vault.withdrawSupply(type(uint256).max);
        assertEq(vault.suppliedOf(alice), 0);
        assertEq(borrowToken.balanceOf(alice), before + 1000e18);
    }

    function test_WithdrawSupplyRevertsWhenLiquidityBorrowed() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);
        _borrow(user1, 400e18); // 600 idle liquidity left
        vm.prank(alice);
        vm.expectRevert(LendingVault.InsufficientLiquidity.selector);
        vault.withdrawSupply(700e18);
    }

    // =========================================================================
    //                              Borrow side
    // =========================================================================

    function test_DepositAndWithdrawCollateral() public {
        _deposit(user1, 1000e18);
        assertEq(vault.collateralOf(user1), 1000e18);
        assertEq(vault.totalCollateral(), 1000e18);

        vm.prank(user1);
        vault.withdraw(400e18);
        assertEq(vault.collateralOf(user1), 600e18);
    }

    function test_BorrowUpToLtvAndRepay() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);

        _borrow(user1, 400e18); // exactly 40% LTV at equal prices
        assertEq(vault.debtOf(user1), 400e18);
        assertEq(borrowToken.balanceOf(user1), 1_000_000e18 + 400e18);

        vm.prank(user1);
        vm.expectRevert(LendingVault.Undercollateralized.selector);
        vault.borrow(1);

        vm.prank(user1);
        vault.repay(user1, type(uint256).max);
        assertEq(vault.debtOf(user1), 0);
    }

    function test_BorrowRevertsWithoutLiquidity() public {
        _deposit(user1, 1000e18);
        vm.prank(user1);
        vm.expectRevert(LendingVault.InsufficientLiquidity.selector);
        vault.borrow(100e18);
    }

    function test_WithdrawCollateralRevertsIfItBreaksLtv() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);
        _borrow(user1, 400e18);

        // Removing 700 collateral would leave 300 backing a 400 debt -> undercollateralized.
        vm.prank(user1);
        vm.expectRevert(LendingVault.Undercollateralized.selector);
        vault.withdraw(700e18);
    }

    // =========================================================================
    //                            Interest accrual
    // =========================================================================

    function test_InterestAccruesToBorrowerAndSupplier() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);
        _borrow(user1, 400e18); // util 40% -> rate 10%/yr

        vm.warp(block.timestamp + 365 days);
        vault.accrueInterest();

        // 10% of 400 = 40 interest; 90% to suppliers, 10% to reserves.
        assertApproxEqAbs(vault.debtOf(user1), 440e18, 1e6);
        assertApproxEqAbs(vault.suppliedOf(alice), 1036e18, 1e6);
        assertApproxEqAbs(vault.totalReserves(), 4e18, 1e6);
    }

    function test_NoInterestWithoutBorrows() public {
        _supply(alice, 1000e18);
        vm.warp(block.timestamp + 365 days);
        vault.accrueInterest();
        assertEq(vault.suppliedOf(alice), 1000e18);
        assertEq(vault.borrowIndex(), WAD);
        assertEq(vault.supplyIndex(), WAD);
    }

    // =========================================================================
    //                              Liquidation
    // =========================================================================

    function test_LiquidateUnhealthyPositionAfterPriceDrop() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);
        _borrow(user1, 400e18);

        // Collateral price drops to $0.70 -> collateral value 700, debt 400 -> HF < 1.
        oracle.setPrice(address(collateralToken), 0.7e18);
        assertLt(vault.healthFactor(user1), WAD);

        uint256 bobCollateralBefore = collateralToken.balanceOf(bob);
        vm.prank(bob);
        vault.liquidate(user1, type(uint256).max);

        // Repay capped at close factor (50% of 400 = 200).
        assertEq(vault.debtOf(user1), 200e18);

        // Seize = repayValue(200) * (1 + 8%) / collateralPrice(0.7), mirroring the vault's mulDiv steps.
        uint256 expectedSeize = Math.mulDiv(Math.mulDiv(200e18, 100 + 8, 100), WAD, 0.7e18);
        assertApproxEqAbs(collateralToken.balanceOf(bob) - bobCollateralBefore, expectedSeize, 1e6);
        assertEq(vault.collateralOf(user1), 1000e18 - expectedSeize);
        assertEq(vault.borrowCash(), 600e18 + 200e18);
    }

    function test_LiquidateRevertsWhenHealthy() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);
        _borrow(user1, 400e18);

        vm.prank(bob);
        vm.expectRevert(LendingVault.NotLiquidatable.selector);
        vault.liquidate(user1, 100e18);
    }

    // =========================================================================
    //                     KAP-20 adminTransfer deficit defense
    // =========================================================================

    function test_AdminTransferCollateralTriggersDeficitPause() public {
        _deposit(user1, 1000e18);
        assertEq(collateralToken.balanceOf(address(vault)), 1000e18);

        // A KAP-20 admin drains collateral out of the vault.
        collateralToken.adminTransfer(address(vault), address(0x99), 500e18);

        vm.prank(user1);
        vm.expectRevert(LendingVault.DeficitDetected.selector);
        vault.withdraw(100e18);
    }

    function test_AdminTransferBorrowCashTriggersDeficitPause() public {
        _supply(alice, 1000e18);

        // A KAP-20 admin drains supplied liquidity out of the vault.
        borrowToken.adminTransfer(address(vault), address(0x99), 500e18);

        vm.prank(alice);
        vm.expectRevert(LendingVault.DeficitDetected.selector);
        vault.withdrawSupply(100e18);
    }

    // =========================================================================
    //                          Admin / access control
    // =========================================================================

    function test_PauseBlocksUserActionsThenUnpause() public {
        vault.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vault.supply(100e18);

        vault.unpause();
        _supply(alice, 100e18);
        assertEq(vault.suppliedOf(alice), 100e18);
    }

    function test_OnlyOwnerCanAdminister() public {
        vm.startPrank(alice);
        bytes4 sel = Ownable.OwnableUnauthorizedAccount.selector;

        vm.expectRevert(abi.encodeWithSelector(sel, alice));
        vault.pause();
        vm.expectRevert(abi.encodeWithSelector(sel, alice));
        vault.setOracle(address(0x1234));
        vm.expectRevert(abi.encodeWithSelector(sel, alice));
        vault.setInterestParams(0, 0, 0);
        vm.expectRevert(abi.encodeWithSelector(sel, alice));
        vault.withdrawReserves(alice, 1);
        vm.stopPrank();
    }

    function test_WithdrawReserves() public {
        _supply(alice, 1000e18);
        _deposit(user1, 1000e18);
        _borrow(user1, 400e18);
        vm.warp(block.timestamp + 365 days);
        vault.accrueInterest();

        uint256 reserves = vault.totalReserves();
        assertGt(reserves, 0);
        vault.withdrawReserves(owner, reserves);
        assertEq(vault.totalReserves(), 0);
        assertEq(borrowToken.balanceOf(owner), reserves);
    }

    function test_SetInterestParamsRejectsHugeReserveFactor() public {
        vm.expectRevert(LendingVault.InvalidReserveFactor.selector);
        vault.setInterestParams(0.02e18, 0.2e18, 1e18 + 1);
    }

    // =========================================================================
    //                                 Fuzz
    // =========================================================================

    function testFuzz_SupplyWithdrawRoundTrip(uint256 amount) public {
        amount = bound(amount, 1, 1e30);
        borrowToken.mint(alice, amount);
        uint256 before = borrowToken.balanceOf(alice);

        _supply(alice, amount);
        vm.prank(alice);
        vault.withdrawSupply(type(uint256).max);

        assertEq(borrowToken.balanceOf(alice), before);
        assertEq(vault.suppliedOf(alice), 0);
    }

    function testFuzz_BorrowWithinLtvSucceeds(uint256 collateral, uint256 borrowAmount) public {
        collateral = bound(collateral, 1e18, 1e27);
        uint256 maxBorrow = (collateral * vault.MAX_LTV()) / vault.PRECISION();
        borrowAmount = bound(borrowAmount, 1, maxBorrow);

        borrowToken.mint(alice, borrowAmount);
        _supply(alice, borrowAmount); // exactly enough liquidity to cover the borrow
        collateralToken.mint(user1, collateral);
        _deposit(user1, collateral);
        _borrow(user1, borrowAmount);

        assertEq(vault.debtOf(user1), borrowAmount);
        assertLe(vault.debtOf(user1) * vault.PRECISION(), collateral * vault.MAX_LTV());
    }
}
