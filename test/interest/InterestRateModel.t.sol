// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {InterestRateModel} from "../../src/interest/InterestRateModel.sol";

contract InterestRateModelTest is Test {
    uint256 internal constant WAD = 1e18;

    function test_UtilizationZeroWhenNoSupply() public pure {
        assertEq(InterestRateModel.utilization(0, 0), 0);
        assertEq(InterestRateModel.utilization(100e18, 0), 0);
    }

    function test_UtilizationRatio() public pure {
        assertEq(InterestRateModel.utilization(400e18, 1000e18), 0.4e18);
    }

    function test_UtilizationCappedAtOne() public pure {
        // Borrows above supply (should not happen in practice) clamp to 100%.
        assertEq(InterestRateModel.utilization(2000e18, 1000e18), WAD);
    }

    function test_BorrowRateEndpoints() public pure {
        uint256 base = 0.02e18;
        uint256 slope = 0.2e18;
        assertEq(InterestRateModel.borrowRatePerYear(0, base, slope), base);
        assertEq(InterestRateModel.borrowRatePerYear(WAD, base, slope), base + slope);
    }

    function test_BorrowRateLinearMidpoint() public pure {
        assertEq(InterestRateModel.borrowRatePerYear(0.5e18, 0.02e18, 0.2e18), 0.12e18);
    }

    function testFuzz_BorrowRateMonotonic(uint256 u1, uint256 u2) public pure {
        u1 = bound(u1, 0, WAD);
        u2 = bound(u2, u1, WAD);
        uint256 r1 = InterestRateModel.borrowRatePerYear(u1, 0.02e18, 0.2e18);
        uint256 r2 = InterestRateModel.borrowRatePerYear(u2, 0.02e18, 0.2e18);
        assertLe(r1, r2);
    }
}
