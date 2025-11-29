import { x402Config } from "./x402-config";
import { Amounts } from "../types";
import crypto from "crypto";
import { amountToBaseUnits, getChainId } from "../x402-sdk";

/**
 * Creates x402 payment requirements for the checkout flow
 */
export function createPaymentRequirements(
  orderIntentId: string,
  amounts: Amounts,
  expiresAt: Date
) {
  // Convert amount to MON wei (18 decimals)
  const weiAmount = amountToBaseUnits(amounts.total, "MON").toString();

  return [
    {
      scheme: "x402-monad-mon-v1",
      network: x402Config.network,
      asset: "MON",
      amount: weiAmount,
      chainId: getChainId(x402Config.network as any),
      payTo: x402Config.recipientAddress,
      expiresAt: expiresAt.toISOString(),
      metadata: {
        orderIntentId,
        amounts,
      },
    },
  ];
}

/**
 * Deeply sorts object properties to normalize JSON
 * Ensures consistent hashing regardless of property order
 */
export function deepSortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepSortObject);
  } else if (obj !== null && typeof obj === "object") {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = deepSortObject(obj[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Validates that request body matches the saved order intent using body hash
 * Prevents "change cart after quote" attacks
 */
export function validateOrderIntentMatch(
  savedIntent: any,
  currentRequest: any
): boolean {
  // Compute hash of current request (excluding orderIntentId)
  const { orderIntentId: _, ...requestWithoutIntentId } = currentRequest;

  // Normalize both objects by sorting properties deeply
  const normalizedRequest = deepSortObject(requestWithoutIntentId);
  const currentBodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(normalizedRequest))
    .digest("hex");

  // Compare with saved body hash
  return currentBodyHash === savedIntent.body_hash;
}

/**
 * Checks if order intent has expired
 */
export function isOrderIntentExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

/**
 * Parses X-PAYMENT header (plain JSON, not base64)
 */
export function parsePaymentHeader(headerValue: string): any {
  try {
    // Try to parse as plain JSON first
    return JSON.parse(headerValue);
  } catch (e) {
    throw new Error("Invalid X-PAYMENT header format");
  }
}

/**
 * Extracts transaction hash from verification response
 */
export function extractTxHashFromVerification(verificationResponse: any): string {
  return (
    verificationResponse.txHash ||
    verificationResponse.transaction_hash ||
    verificationResponse.tx_hash ||
    ""
  );
}
