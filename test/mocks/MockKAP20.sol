// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockKAP20
/// @notice Minimal KAP-20-like token for tests and KUB testnet demos.
/// @dev KAP-20 (Bitkub Chain) tokens expose an `adminTransfer` that lets a privileged
///      admin move funds out of any address. This mock reproduces that power so the
///      {LendingVault} deficit defense can be exercised and demonstrated end-to-end.
contract MockKAP20 is ERC20 {
    address public admin;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        admin = msg.sender;
    }

    /// @notice Open faucet mint — testnet/demo convenience only.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Simulates KAP-20 `adminTransfer`: the admin force-moves funds.
    function adminTransfer(address from, address to, uint256 amount) external {
        require(msg.sender == admin, "Not admin");
        _transfer(from, to, amount);
    }
}
