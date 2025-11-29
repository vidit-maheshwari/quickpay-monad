// Dynamically import SDK to avoid ESM issues with pnpm workspace
import { createX402Server } from "../x402-sdk";
let x402ServerInstance: any = null;

const SUPPORTED_NETWORKS = ["monad-testnet", "monad-mainnet"] as const;

function normalizeNetwork(raw: string | undefined): "monad-testnet" | "monad-mainnet" {
  if (raw && SUPPORTED_NETWORKS.includes(raw as any)) {
    return raw as any;
  }
  // Backwards-compat: map legacy values like "devnet" to monad-testnet
  console.warn(
    `[x402-config] Unsupported X402_NETWORK="${raw}". Falling back to "monad-testnet".`
  );
  return "monad-testnet";
}

async function initializeX402Server() {
  if (x402ServerInstance) {
    return x402ServerInstance;
  }

  const network = normalizeNetwork(process.env.X402_NETWORK);
  const recipientAddress = process.env.X402_RECIPIENT_ADDRESS;

  if (!recipientAddress) {
    throw new Error(
      "X402_RECIPIENT_ADDRESS environment variable is required for x402 payments"
    );
  }

  // Dynamic import to handle pnpm workspace properly


  x402ServerInstance = createX402Server({
    network: network as any,
    recipientAddress,
  });

  return x402ServerInstance;
}

export { initializeX402Server };

export const x402Config = {
  network: normalizeNetwork(process.env.X402_NETWORK),
  recipientAddress: process.env.X402_RECIPIENT_ADDRESS || "",
};
