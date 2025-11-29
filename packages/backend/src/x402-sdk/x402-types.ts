import { z } from "zod";

/**
 * x402 Protocol Type Definitions
 * Based on Coinbase x402 specification for HTTP 402 Payment Required
 */

// Payment scheme types
export const PaymentSchemeSchema = z.enum(["exact", "upto"]);
export type PaymentScheme = z.infer<typeof PaymentSchemeSchema>;

// Supported blockchain networks (Monad testnet for now)
export const NetworkSchema = z.enum(["monad-testnet"]);
export type Network = z.infer<typeof NetworkSchema>;

// Token types supported on Monad
export const TokenTypeSchema = z.enum(["MON"]);
export type TokenType = z.infer<typeof TokenTypeSchema>;

/**
 * Payment Requirements
 * Sent by server in HTTP 402 response body
 */
export const PaymentRequirementsSchema = z.object({
  // Payment scheme: "exact" = exact amount, "upto" = usage-based billing
  scheme: PaymentSchemeSchema,

  // Blockchain network (monad-mainnet / monad-testnet)
  network: NetworkSchema,
  chainId: z.number().int().positive(),

  // Payment details
  amount: z.string(), // Amount in wei (18 decimals)
  token: TokenTypeSchema,
  recipient: z.string(), // EVM address (0x...)

  // Optional metadata
  memo: z.string().optional(), // Transaction memo
  deadline: z.number().optional(), // Unix timestamp for payment deadline
  requestId: z.string().optional(), // Unique request identifier
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

/**
 * Payment Proof
 * Sent by client in X-Payment header after payment
 */
export const PaymentProofSchema = z.object({
  // Transaction hash on Monad
  hash: z.string(),

  // Network where transaction was executed
  network: NetworkSchema,

  // Optional: Request ID for correlation
  requestId: z.string().optional(),

  // Timestamp when payment was made
  timestamp: z.number(),
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

/**
 * x402 Response
 * Full structure of HTTP 402 response
 */
export interface X402Response {
  status: 402;
  headers: {
    "content-type": "application/json";
    "www-authenticate"?: string;
  };
  body: PaymentRequirements;
}

/**
 * Transaction Status
 */
export const TransactionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "finalized",
  "failed"
]);

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

/**
 * SDK Configuration
 */
export const SDKConfigSchema = z.object({
  network: NetworkSchema,
  rpcEndpoint: z.string().url().optional(),
  confirmations: z.number().int().positive().max(64).optional(),
});

export type SDKConfig = z.infer<typeof SDKConfigSchema>;

/**
 * Error types
 */
export class X402Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "X402Error";
  }
}

export class PaymentRequiredError extends X402Error {
  constructor(
    public paymentRequirements: PaymentRequirements,
    message = "Payment required to access this resource"
  ) {
    super(message, "PAYMENT_REQUIRED", paymentRequirements);
    this.name = "PaymentRequiredError";
  }
}

export class TransactionFailedError extends X402Error {
  constructor(message: string, details?: unknown) {
    super(message, "TRANSACTION_FAILED", details);
    this.name = "TransactionFailedError";
  }
}

export class InvalidPaymentProofError extends X402Error {
  constructor(message: string, details?: unknown) {
    super(message, "INVALID_PAYMENT_PROOF", details);
    this.name = "InvalidPaymentProofError";
  }
}