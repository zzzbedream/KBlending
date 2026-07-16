# KBlending — Live Deployment (KUB Testnet)

**Network:** Bitkub Chain Testnet · **chainId** 25925 · **explorer** https://testnet.kubscan.com
**Compiler:** Solidity 0.8.24, `evm_version = "paris"` (KUB rejects the PUSH0 opcode).

## Contract addresses

| Contract | Address | Deploy tx |
|---|---|---|
| LendingVault | [`0xD22A6A0b44fBD34a8a50a502B3E58e7bfCEA7d6b`](https://testnet.kubscan.com/address/0xD22A6A0b44fBD34a8a50a502B3E58e7bfCEA7d6b) | `0x5ba9c96e63506cd686dcefd735150d6a6c2e37b77153e712e220341289169ed1` |
| RealX (KAP-20 collateral) | [`0x282b9c2ca4416bc4e9d040fFADa1D693D0257ac2`](https://testnet.kubscan.com/address/0x282b9c2ca4416bc4e9d040fFADa1D693D0257ac2) | `0xaf110cab9e58ac6c16665e933e397a071cb630972c7907b28cee656be65f6d00` |
| KUSDT (KAP-20 borrow) | [`0x0a9Fbb2DcB37A6Be5d451eB7BB60750dBE2010Bb`](https://testnet.kubscan.com/address/0x0a9Fbb2DcB37A6Be5d451eB7BB60750dBE2010Bb) | `0x8ef60635faa7a323ce01328049140161edf9c295a34819c88a770aa1f0f6b38c` |
| AdminPriceOracle | [`0x488da9E3F64c0088774C2d54e2B4A5cf35F96591`](https://testnet.kubscan.com/address/0x488da9E3F64c0088774C2d54e2B4A5cf35F96591) | `0x01d7177e819a24774cfac793bf488843302126749611b87ec9df7ad1243e8e84` |

Deployed around block **31,804,670**. Prices seeded at $1 each; **100,000 KUSDT** supplied as initial borrow liquidity.

## Verified on-chain state (reads)

| Field | Value |
|---|---|
| paused | false |
| totalSupplied | 100,000 KUSDT |
| borrowCash | 100,000 KUSDT |
| MAX_LTV / liquidation threshold | 40% / 50% |
| borrow APR (at 0% util) | 2% |
| collateralToken / borrowToken | RealX / KUSDT (match) |

## End-to-end test (live testnet)

A full loan lifecycle was executed on-chain and confirmed:

| Step | On-chain result |
|---|---|
| deposit 1,000 RealX | collateralOf = 1,000 |
| borrow 300 KUSDT | debtOf = 300, **Health Factor = 1.67** (`1000×50 / 300×100`) |
| repay (full) | debtOf = 0 |
| withdraw 1,000 RealX | collateralOf = 0, Health Factor = ∞ |

The backend REST API served this state live (`/api/market`, `/api/position/:address`).

> The KAP-20 `adminTransfer` deficit defense is covered by unit tests
> (`test_AdminTransferCollateralTriggersDeficitPause`) and is live-demoable by calling
> `adminTransfer` on a mock token to drain the vault — it is intentionally **not** triggered on
> this live deployment so the demo market stays healthy.

## Reproduce

See [DEPLOY_TESTNET.md](DEPLOY_TESTNET.md). Deploy command:

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url kub_testnet --broadcast --legacy --slow -vvv
```
