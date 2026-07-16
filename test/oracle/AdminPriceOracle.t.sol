// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AdminPriceOracle} from "../../src/oracle/AdminPriceOracle.sol";

contract AdminPriceOracleTest is Test {
    AdminPriceOracle internal oracle;
    address internal owner = address(this);
    address internal stranger = makeAddr("stranger");
    address internal token = makeAddr("token");

    function setUp() public {
        oracle = new AdminPriceOracle(owner);
    }

    function test_SetAndGetPrice() public {
        oracle.setPrice(token, 1.5e18);
        assertEq(oracle.getPrice(token), 1.5e18);
    }

    function test_GetPriceRevertsWhenUnset() public {
        vm.expectRevert(abi.encodeWithSelector(AdminPriceOracle.PriceIsZero.selector, token));
        oracle.getPrice(token);
    }

    function test_SetPriceRejectsZeroPrice() public {
        vm.expectRevert(abi.encodeWithSelector(AdminPriceOracle.PriceIsZero.selector, token));
        oracle.setPrice(token, 0);
    }

    function test_SetPriceRejectsZeroToken() public {
        vm.expectRevert(AdminPriceOracle.TokenIsZeroAddress.selector);
        oracle.setPrice(address(0), 1e18);
    }

    function test_OnlyOwnerCanSetPrice() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        oracle.setPrice(token, 1e18);
    }
}
