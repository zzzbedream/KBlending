// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InterestRateModel
/// @notice Linear (single-slope) utilization-based interest rate curve.
/// @dev Stateless pure math extracted from {LendingVault} so the curve can be
///      reasoned about and unit-tested in isolation. All rates are per-year,
///      expressed as a WAD fraction (1e18 == 100%). The vault converts the
///      per-year rate into an accrual factor over the elapsed time.
library InterestRateModel {
    uint256 internal constant WAD = 1e18;

    /// @notice Utilization = borrows / supplied, capped at 100% (WAD).
    /// @param totalBorrows Outstanding borrows (actual, borrow-token units).
    /// @param totalSupplied Total supplied liquidity (actual, borrow-token units).
    /// @return utilizationWad Utilization ratio in WAD, in [0, WAD].
    function utilization(uint256 totalBorrows, uint256 totalSupplied) internal pure returns (uint256 utilizationWad) {
        if (totalSupplied == 0) return 0;
        utilizationWad = (totalBorrows * WAD) / totalSupplied;
        if (utilizationWad > WAD) utilizationWad = WAD;
    }

    /// @notice Per-year borrow rate for a given utilization.
    /// @dev rate = base + utilization * slope. Linear model keeps the audit
    ///      surface small for the MVP; a kinked curve can replace it later
    ///      without touching the vault's accrual logic.
    /// @param utilizationWad Utilization in WAD (see {utilization}).
    /// @param baseRatePerYearWad Rate at 0% utilization (WAD/year).
    /// @param slopePerYearWad Additional rate at 100% utilization (WAD/year).
    /// @return ratePerYearWad Borrow rate per year in WAD.
    function borrowRatePerYear(uint256 utilizationWad, uint256 baseRatePerYearWad, uint256 slopePerYearWad)
        internal
        pure
        returns (uint256 ratePerYearWad)
    {
        ratePerYearWad = baseRatePerYearWad + (utilizationWad * slopePerYearWad) / WAD;
    }
}
