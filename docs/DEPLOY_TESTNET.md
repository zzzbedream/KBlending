# Deploy KBlending to KUB Testnet — step by step

This is the exact runbook to create a testnet wallet, fund it, deploy the contracts, verify them, and wire the addresses into the backend and frontend.

> KUB (Bitkub Chain) testnet params — confirmed, but always cross-check against [Bitkub Chain docs](https://docs.bitkubchain.org):
> - **Network name:** Bitkub Chain Testnet
> - **Chain ID:** `25925`
> - **RPC:** `https://rpc-testnet.bitkubchain.io`
> - **Gas token:** tKUB
> - **Explorer:** `https://testnet.kubscan.com` (also `https://testnet.bkcscan.com`)
> - **Faucet:** `https://faucet.kubchain.com` (≈5 tKUB / 24h)

---

## Step 1 — Create a deployer wallet

You need a wallet with a private key you can put in a `.env`. **Use a dedicated throwaway key for testnet — never your real funds.**

### Option A — Fresh key with Foundry (recommended, no browser)

```bash
cast wallet new
```

It prints an **Address** and a **Private key**. Copy both. That address is your deployer.

### Option B — MetaMask

1. Install MetaMask → create/unlock a wallet.
2. Create a new account dedicated to testnet (Account menu → *Add account*).
3. Add the KUB testnet network → *Add network manually*:
   - Network name: `Bitkub Chain Testnet`
   - RPC URL: `https://rpc-testnet.bitkubchain.io`
   - Chain ID: `25925`
   - Currency symbol: `tKUB`
   - Block explorer: `https://testnet.kubscan.com`
4. Export the private key: Account menu → *Account details* → *Show private key*.

---

## Step 2 — Fund it with test tKUB

1. Go to **https://faucet.kubchain.com**.
2. Connect the wallet (or paste your deployer address).
3. Request tKUB (≈5 tKUB every 24h). That is plenty for the deploy.
4. Confirm the balance:

```bash
cast balance <YOUR_ADDRESS> --rpc-url https://rpc-testnet.bitkubchain.io
```

A non-zero result means you're funded.

---

## Step 3 — Configure the repo `.env`

From the repo root:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
PRIVATE_KEY=0x<your_deployer_private_key>
KUB_TESTNET_RPC_URL=https://rpc-testnet.bitkubchain.io
KUB_MAINNET_RPC_URL=https://rpc.bitkubchain.io
KUBSCAN_API_KEY=
```

`.env` is git-ignored — it will not be committed.

---

## Step 4 — Deploy

> **Prerequisite (already configured):** KUB runs a **pre-Shanghai EVM** and rejects the `PUSH0` opcode (`0x5f`). `foundry.toml` sets `evm_version = "paris"` so Solidity never emits it — without this, every deploy fails on-chain with `invalid opcode: opcode 0x5f not defined` (and burns all gas). If you change compiler settings, keep `evm_version = "paris"`.
>
> Two KUB-specific flags are also **required**:
> - `--legacy` — KUB has no EIP-1559; without it you get `Failed to get EIP-1559 fees; unsupported feature: eip1559`.
> - `--slow` — send one transaction at a time, waiting for each receipt (avoids same-block ordering issues on deploy-then-use steps).

```bash
forge build          # ensure paris bytecode is fresh
forge script script/Deploy.s.sol:DeployScript --rpc-url kub_testnet --broadcast --legacy --slow -vvv
```

The script deploys mock KAP-20 tokens (RealX + KUSDT, both with `adminTransfer`), the `AdminPriceOracle`, the `LendingVault`, and seeds 100,000 KUSDT of borrow liquidity. It **logs every address** at the end, e.g.:

```
RealX (collateral): 0x…
KUSDT (borrow):     0x…
AdminPriceOracle:   0x…
LendingVault:       0x…
```

Copy those four addresses.

---

## Step 5 — Verify on the explorer (Blockscout)

```bash
forge verify-contract <VAULT_ADDRESS> src/LendingVault.sol:LendingVault \
  --chain-id 25925 --verifier blockscout \
  --verifier-url https://testnet.kubscan.com/api
```

Repeat for `AdminPriceOracle` and the two `MockKAP20` tokens if you want them all green.

---

## Step 6 — Wire the addresses into backend + frontend

**Backend** (`backend/.env`):

```bash
RPC_URL=https://rpc-testnet.bitkubchain.io
VAULT_ADDRESS=0x…
COLLATERAL_ADDRESS=0x…      # RealX
BORROW_ADDRESS=0x…          # KUSDT
START_BLOCK=<the deploy block number>
```

**Frontend** (`frontend/.env.local`):

```bash
NEXT_PUBLIC_VAULT_ADDRESS=0x…
NEXT_PUBLIC_REALX_ADDRESS=0x…
NEXT_PUBLIC_KUSDT_ADDRESS=0x…
NEXT_PUBLIC_ORACLE_ADDRESS=0x…
```

Also paste them into the **Deployed addresses** table in [README.md](../README.md).

---

## Step 7 — Smoke-test the deployment

```bash
# market is live?
cast call <VAULT_ADDRESS> "totalSupplied()(uint256)" --rpc-url https://rpc-testnet.bitkubchain.io

# start the apps
cd backend && npm install && npm run dev      # http://localhost:4000/api/market
cd frontend && npm install && npm run dev     # http://localhost:3000/app  → connect wallet
```

In the dashboard: mint yourself RealX (faucet function on the mock), deposit collateral, borrow KUSDT, and repay. To demo the safeguard, call `adminTransfer` on the mock token to drain the vault and watch the **deficit banner** appear.

---

## Step 8 — Deploy the frontend to Vercel (for the grant demo URL)

1. Push is already done (repo is public).
2. On Vercel → *New Project* → import `zzzbedream/KBlending`.
3. Set **Root Directory** to `frontend`.
4. Add the `NEXT_PUBLIC_*` env vars from Step 6.
5. Deploy → copy the URL into `KUB_Grant_Submission.md` (the *Live Demo* field).

That completes everything the submission needs.
