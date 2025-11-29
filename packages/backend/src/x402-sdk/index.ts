/**
 * @x402/monad-sdk
 *
 * TypeScript SDK for implementing HTTP 402 payment flows on Monad (EVM)
 *
 * @example Client Usage (Node.js)
 * ```typescript
 * import { x402Fetch } from '@x402/monad-sdk';
 * import { Wallet, JsonRpcProvider } from 'ethers';
 *
 * const provider = new JsonRpcProvider('https://testnet-rpc.monad.xyz');
 * const wallet = new Wallet(yourPrivateKey, provider);
 *
 * const response = await x402Fetch('https://api.example.com/data', {
 *   network: 'monad-testnet',
 *   signer: wallet
 * });
 * ```
 *
 * @example Server Usage (Express)
 * ```typescript
 * import { createX402Server } from '@x402/monad-sdk';
 * import express from 'express';
 *
 * const server = createX402Server({
 *   network: 'monad-testnet',
 *   recipientAddress: '0xyourMonadAddress'
 * });
 *
 * app.get('/premium-data',
 *   server.requirePayment({
 *     amount: '0.001',
 *     token: 'MON'
 *   }),
 *   (req, res) => {
 *     res.json({ data: 'premium content' });
 *   }
 * );
 * ```
 */

// Client exports
export {
    X402Client,
    x402Fetch,
    createPaymentProof,
    type X402ClientConfig,
    type X402FetchOptions,
    type X402FetchWrapperOptions,
    type Signer,
  } from "./client";
  
  // Server exports
  export {
    X402Server,
    createX402Server,
    x402Middleware,
    type X402ServerConfig,
    type PaymentOptions,
  } from "./server";
  
  // Utilities - Monad transaction helpers
  export {
    createConnection,
    getRpcEndpoint,
    createPaymentTransaction,
    signAndSendTransaction,
    confirmTransaction,
    getTransactionStatus,
    verifyPaymentTransaction, // SECURITY CRITICAL: Use for server-side validation
    amountToBaseUnits,
    baseUnitsToAmount,
    getChainId,
  } from "./monad-utils";
  
  // Types
  export {
    type PaymentRequirements,
    type PaymentProof,
    type Network,
    type TokenType,
    type PaymentScheme,
    type TransactionStatus,
    type SDKConfig,
    type X402Response,
    PaymentRequirementsSchema,
    PaymentProofSchema,
    NetworkSchema,
    TokenTypeSchema,
    PaymentSchemeSchema,
    TransactionStatusSchema,
    SDKConfigSchema,
    X402Error,
    PaymentRequiredError,
    TransactionFailedError,
    InvalidPaymentProofError,
  } from "./x402-types";
  
  // Version
  export const VERSION = "1.0.0";