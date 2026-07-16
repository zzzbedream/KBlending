// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPriceOracle
/// @notice Minimal price feed interface consumed by LendingVault.
/// @dev Prices are denominated in USD with 18 decimals (WAD). Implementations
///      must revert if a price for `token` is unknown/stale so the vault never
///      values collateral or debt with a zero price.
interface IPriceOracle {
    /// @notice Returns the USD price of one whole `token` scaled by 1e18.
    /// @param token The asset to price (collateral or borrow token).
    /// @return priceWad USD price per token, 18 decimals.
    function getPrice(address token) external view returns (uint256 priceWad);
}
