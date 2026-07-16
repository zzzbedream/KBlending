import { getAddress } from "ethers";
import { vaultContract } from "../chain/provider.js";
import type { EventRepository } from "../store/repository.js";

const WAD = 10n ** 18n;
const HF_MAX_SENTINEL = (1n << 255n); // healthFactor returns type(uint256).max when debt-free

export type PositionView = {
  address: string;
  supplied: string;
  debt: string;
  collateral: string;
  healthFactor: string; // WAD; "max" surfaced as the raw big value
};

export async function getPosition(address: string): Promise<PositionView> {
  const addr = getAddress(address); // checksums + validates
  const vault = vaultContract();
  const [supplied, debt, collateral, hf] = await Promise.all([
    vault.suppliedOf(addr),
    vault.debtOf(addr),
    vault.collateralOf(addr),
    vault.healthFactor(addr),
  ]);
  return {
    address: addr,
    supplied: supplied.toString(),
    debt: debt.toString(),
    collateral: collateral.toString(),
    healthFactor: hf.toString(),
  };
}

export type LiquidatablePosition = { address: string; debt: string; healthFactor: string };

/** Scan known borrowers and return those whose Health Factor has fallen below 1.0 (WAD). */
export async function getLiquidatablePositions(repo: EventRepository): Promise<LiquidatablePosition[]> {
  const vault = vaultContract();
  const borrowers = repo.borrowers();
  const results = await Promise.all(
    borrowers.map(async (addr) => {
      const [debt, hf] = await Promise.all([vault.debtOf(addr), vault.healthFactor(addr)]);
      return { address: getAddress(addr), debt, hf };
    }),
  );
  return results
    .filter((r) => r.debt > 0n && r.hf < WAD && r.hf < HF_MAX_SENTINEL)
    .map((r) => ({ address: r.address, debt: r.debt.toString(), healthFactor: r.hf.toString() }));
}
