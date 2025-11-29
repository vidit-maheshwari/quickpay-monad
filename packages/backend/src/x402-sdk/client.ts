/**
 * x402 Monad SDK - Client Module
 * Provides automatic HTTP 402 payment handling for the Monad blockchain
 */

import { JsonRpcProvider, Signer as EthersSigner } from "ethers";
import {
  Network,
  PaymentRequirements,
  PaymentRequirementsSchema,
  PaymentProof,
  PaymentRequiredError,
  SDKConfig,
  TransactionFailedError,
} from "./x402-types";
import {
  createConnection,
  createPaymentTransaction,
  signAndSendTransaction,
  confirmTransaction,
} from "./monad-utils";

export type Signer = EthersSigner;

/**
 * Client configuration options
 */
export interface X402ClientConfig extends SDKConfig {
  // Wallet/keypair for signing transactions
  signer?: Signer;

  // Auto-retry failed transactions
  autoRetry?: boolean;
  maxRetries?: number;

  // Confirmation depth (blocks)
  confirmations?: number;

  // Custom RPC endpoint
  rpcEndpoint?: string;
}

/**
 * Fetch options extended with x402 payment handling
 */
export interface X402FetchOptions extends RequestInit {
  // Enable automatic payment handling
  autoPayment?: boolean;

  // Signer for this specific request (overrides client signer)
  signer?: Signer;

  // Custom payment handler (advanced use case)
  onPaymentRequired?: (requirements: PaymentRequirements) => Promise<PaymentProof>;
}

/**
 * x402 Client for making payment-enabled HTTP requests
 */
export class X402Client {
  private provider: JsonRpcProvider;
  private config: X402ClientConfig;

  constructor(config: X402ClientConfig) {
    this.config = {
      autoRetry: true,
      maxRetries: 3,
      confirmations: 1,
      ...config,
    };

    this.provider = createConnection(config.network, config.rpcEndpoint);
  }

  /**
   * Make an HTTP request with automatic x402 payment handling
   */
  async fetch(
    url: string,
    options: X402FetchOptions = {}
  ): Promise<Response> {
    const { autoPayment = true, signer, onPaymentRequired, ...fetchOptions } = options;
    const requestSigner = signer || this.config.signer;

    // Make initial request
    const response = await fetch(url, fetchOptions);

    // Check if payment is required
    if (response.status === 402 && autoPayment) {
      if (!requestSigner) {
        throw new PaymentRequiredError(
          await this.parsePaymentRequirements(response),
          "Payment required but no signer provided"
        );
      }

      // Parse payment requirements
      const requirements = await this.parsePaymentRequirements(response);

      // Execute payment
      const paymentProof = onPaymentRequired
        ? await onPaymentRequired(requirements)
        : await this.executePayment(requirements, requestSigner);

      // Retry request with payment proof
      return this.retryWithPayment(url, fetchOptions, paymentProof);
    }

    return response;
  }

  /**
   * Parse payment requirements from 402 response
   */
  private async parsePaymentRequirements(
    response: Response
  ): Promise<PaymentRequirements> {
    try {
      const body = await response.json();
      return PaymentRequirementsSchema.parse(body);
    } catch (error) {
      throw new Error(
        `Failed to parse payment requirements: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Execute payment based on requirements
   */
  private async executePayment(
    requirements: PaymentRequirements,
    signer: Signer
  ): Promise<PaymentProof> {
    try {
      // Create payment transaction
      const fromAddress = await signer.getAddress();
      const transaction = await createPaymentTransaction(
        this.provider,
        fromAddress,
        requirements
      );

      const hash = await signAndSendTransaction(
        signer,
        transaction
      );

      const confirmations = this.config.confirmations || 1;
      const confirmed = await confirmTransaction(
        this.provider,
        hash,
        confirmations
      );

      if (!confirmed) {
        throw new TransactionFailedError(
          `Transaction failed to confirm within ${confirmations} block(s)`
        );
      }

      // Create payment proof
      const proof: PaymentProof = {
        hash,
        network: requirements.network,
        requestId: requirements.requestId,
        timestamp: Date.now(),
      };

      return proof;
    } catch (error) {
      throw new TransactionFailedError(
        `Payment execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  }

  /**
   * Retry request with payment proof in X-Payment header
   */
  private async retryWithPayment(
    url: string,
    options: RequestInit,
    proof: PaymentProof
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set("X-Payment", JSON.stringify(proof));
    headers.set("Content-Type", "application/json");

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * Get current connection
   */
  getConnection(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get current configuration
   */
  getConfig(): X402ClientConfig {
    return { ...this.config };
  }
}

/**
 * Options for x402Fetch wrapper
 */
export interface X402FetchWrapperOptions extends Omit<X402ClientConfig, "network">, Omit<X402FetchOptions, "signer" | "autoPayment"> {
  network: Network;
  autoPayment?: boolean;
}

/**
 * Simple wrapper function for one-line x402 fetch
 * 
 * @example
 * ```typescript
 * const response = await x402Fetch('https://api.example.com/data', {
 *   network: 'devnet',
 *   signer: myKeypair
 * });
 * ```
 */
export async function x402Fetch(
  url: string,
  options: X402FetchWrapperOptions
): Promise<Response> {
  const { network, signer, rpcEndpoint, confirmations, autoRetry, maxRetries, autoPayment, ...fetchOptions } = options;

  const client = new X402Client({
    network,
    signer,
    rpcEndpoint,
    confirmations,
    autoRetry,
    maxRetries,
  });

  return client.fetch(url, { ...fetchOptions, autoPayment });
}

/**
 * Create payment proof manually (for advanced use cases)
 */
export async function createPaymentProof(
  requirements: PaymentRequirements,
  signer: Signer,
  config: SDKConfig
): Promise<PaymentProof> {
  const client = new X402Client({ ...config, signer });

  // Use private method via instance
  return (client as any).executePayment(requirements, signer);
}