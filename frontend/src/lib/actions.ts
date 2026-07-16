import { MaxUint256, type Signer } from "ethers";
import { ADDRESSES } from "./config";
import { erc20With, vaultWith } from "./contracts";

async function send(tx: Promise<{ wait: () => Promise<unknown> }>): Promise<void> {
  const sent = await tx;
  await sent.wait();
}

export async function ensureAllowance(signer: Signer, token: string, needed: bigint, current: bigint): Promise<void> {
  if (current >= needed) return;
  await send(erc20With(token, signer).approve(ADDRESSES.vault, MaxUint256));
}

export async function supply(signer: Signer, amount: bigint): Promise<void> {
  await send(vaultWith(signer).supply(amount));
}

export async function withdrawSupply(signer: Signer, amount: bigint): Promise<void> {
  await send(vaultWith(signer).withdrawSupply(amount));
}

export async function depositCollateral(signer: Signer, amount: bigint): Promise<void> {
  await send(vaultWith(signer).deposit(amount));
}

export async function withdrawCollateral(signer: Signer, amount: bigint): Promise<void> {
  await send(vaultWith(signer).withdraw(amount));
}

export async function borrow(signer: Signer, amount: bigint): Promise<void> {
  await send(vaultWith(signer).borrow(amount));
}

export async function repay(signer: Signer, borrower: string, amount: bigint): Promise<void> {
  await send(vaultWith(signer).repay(borrower, amount));
}

/** MockKAP20 faucet: mint test tokens to `to`. Testnet only. */
export async function faucetMint(signer: Signer, token: string, to: string, amount: bigint): Promise<void> {
  await send(erc20With(token, signer).mint(to, amount));
}
