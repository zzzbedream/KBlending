// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {LendingVault} from "../src/LendingVault.sol";
import {AdminPriceOracle} from "../src/oracle/AdminPriceOracle.sol";
import {MockKAP20} from "../test/mocks/MockKAP20.sol";

/// @notice Deploys the full KBlending stack to KUB testnet using mock KAP-20 tokens
///         (with `adminTransfer`, so the deficit defense is demonstrable end-to-end).
/// @dev Requires env var `PRIVATE_KEY`. Prices are seeded at $1 each; the deployer
///      supplies initial borrow liquidity so borrowing works immediately in the demo.
contract DeployScript is Script {
    uint256 internal constant FAUCET_MINT = 10_000_000e18;
    uint256 internal constant SEED_LIQUIDITY = 100_000e18;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // 1. Mock KAP-20 tokens (RealX collateral, KUSDT borrow asset).
        MockKAP20 realX = new MockKAP20("RealX Mock", "REALX");
        MockKAP20 kusdt = new MockKAP20("KUSDT Mock", "KUSDT");

        // 2. Oracle (owner-settable prices for the demo).
        AdminPriceOracle oracle = new AdminPriceOracle(deployer);
        oracle.setPrice(address(realX), 1e18); // $1
        oracle.setPrice(address(kusdt), 1e18); // $1

        // 3. Lending vault.
        LendingVault vault = new LendingVault(address(realX), address(kusdt), address(oracle), deployer);

        // 4. Faucet balances for the deployer + seed borrow liquidity via supply().
        realX.mint(deployer, FAUCET_MINT);
        kusdt.mint(deployer, FAUCET_MINT);
        kusdt.approve(address(vault), SEED_LIQUIDITY);
        vault.supply(SEED_LIQUIDITY);

        vm.stopBroadcast();

        console.log("RealX (collateral):", address(realX));
        console.log("KUSDT (borrow):    ", address(kusdt));
        console.log("AdminPriceOracle:  ", address(oracle));
        console.log("LendingVault:      ", address(vault));
        console.log("Seeded liquidity:  ", SEED_LIQUIDITY);
    }
}
