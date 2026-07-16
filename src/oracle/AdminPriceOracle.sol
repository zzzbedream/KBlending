// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

/// @title AdminPriceOracle
/// @notice Owner-controlled price oracle used on KUB testnet and for local tests.
/// @dev This is intentionally simple: the owner sets USD prices (18 decimals) per
///      token. In production this contract is swapped for a market oracle
///      (e.g. Pyth or the KUB Oracle) that implements the same {IPriceOracle}
///      interface, so `LendingVault` needs no change to migrate.
contract AdminPriceOracle is IPriceOracle, Ownable {
    /// @notice USD price per token, 18 decimals. Zero means "unset".
    mapping(address token => uint256 priceWad) public prices;

    event PriceSet(address indexed token, uint256 priceWad);

    error PriceIsZero(address token);
    error TokenIsZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Sets the USD price (18 decimals) for `token`.
    /// @dev Only the owner. A zero price is rejected because {getPrice} treats
    ///      zero as unset and would revert on read anyway.
    function setPrice(address token, uint256 priceWad) external onlyOwner {
        if (token == address(0)) revert TokenIsZeroAddress();
        if (priceWad == 0) revert PriceIsZero(token);
        prices[token] = priceWad;
        emit PriceSet(token, priceWad);
    }

    /// @inheritdoc IPriceOracle
    function getPrice(address token) external view returns (uint256 priceWad) {
        priceWad = prices[token];
        if (priceWad == 0) revert PriceIsZero(token);
    }
}
