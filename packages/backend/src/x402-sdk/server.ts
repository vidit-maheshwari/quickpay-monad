/**
 * x402 Monad SDK - Server Module
 * Provides middleware for accepting and verifying x402 payments
 */

import { Request, Response, NextFunction } from "express";
import { JsonRpcProvider } from "ethers";
import {
  Network,
  PaymentRequirements,
  PaymentProof,
  PaymentProofSchema,
  TokenType,
  InvalidPaymentProofError,
} from "./x402-types";
import {
  createConnection,
  verifyPaymentTransaction,
  getTransactionStatus,
  amountToBaseUnits,
  getChainId,
} from "./monad-utils";

/**
 * Server configuration
 */
export interface X402ServerConfig {
  network: Network;
  recipientAddress: string;
  rpcEndpoint?: string;
  
  // Cached payment verification (optional)
  enableCache?: boolean;
  cacheTTL?: number; // seconds
}

/**
 * Payment requirement builder options
 */
export interface PaymentOptions {
  amount: string; // Human-readable (e.g., "0.001" MON)
  token: TokenType;
  memo?: string;
  deadline?: number; // Unix timestamp
  requestId?: string;
}

/**
 * Extend Express Request with payment info
 */
declare global {
  namespace Express {
    interface Request {
      payment?: {
        proof: PaymentProof;
        verified: boolean;
        amount: string;
        token: TokenType;
      };
    }
  }
}

/**
 * Simple in-memory cache for verified payments
 */
class PaymentCache {
  private cache = new Map<string, { verified: boolean; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 300) {
    this.ttl = ttl * 1000; // Convert to milliseconds
  }

  set(hash: string, verified: boolean): void {
    this.cache.set(hash, { verified, timestamp: Date.now() });
  }

  get(hash: string): boolean | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hash);
      return null;
    }

    return entry.verified;
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * x402 Server for accepting and verifying payments
 */
export class X402Server {
  private connection: JsonRpcProvider;
  private config: X402ServerConfig;
  private cache?: PaymentCache;

  constructor(config: X402ServerConfig) {
    this.config = config;
    this.connection = createConnection(config.network, config.rpcEndpoint);
    
    if (config.enableCache) {
      this.cache = new PaymentCache(config.cacheTTL);
    }
  }

  /**
   * Create payment requirements for a resource
   */
  createPaymentRequirements(options: PaymentOptions): PaymentRequirements {
    const baseUnits = amountToBaseUnits(options.amount, options.token).toString();
    const chainId = getChainId(this.config.network);
    return {
      scheme: "exact",
      network: this.config.network,
      amount: baseUnits,
      token: options.token,
      recipient: this.config.recipientAddress,
      chainId,
      memo: options.memo,
      deadline: options.deadline,
      requestId: options.requestId || this.generateRequestId(),
    };
  }

  /**
   * Verify payment proof from X-Payment header
   */
  async verifyPayment(
    proof: PaymentProof,
    requirements: PaymentRequirements
  ): Promise<boolean> {
    try {
      // Check cache first
      if (this.cache) {
        const cached = this.cache.get(proof.hash);
        if (cached !== null) {
          return cached;
        }
      }

      // Verify network matches
      if (proof.network !== requirements.network) {
        return false;
      }

      // Check deadline if provided
      if (requirements.deadline && proof.timestamp > requirements.deadline) {
        return false;
      }

      // Verify transaction on blockchain
      const verified = await verifyPaymentTransaction(
        this.connection,
        proof.hash,
        requirements
      );

      // Cache result
      if (this.cache) {
        this.cache.set(proof.hash, verified);
      }

      return verified;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  }

  /**
   * Express middleware for requiring payment
   */
  requirePayment(options: PaymentOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check for X-Payment header
        const paymentHeader = req.headers["x-payment"];
        
        if (!paymentHeader) {
          // No payment provided, return 402 with requirements
          const requirements = this.createPaymentRequirements(options);
          return res.status(402).json(requirements);
        }

        // Parse payment proof
        let proof: PaymentProof;
        try {
          const parsed = typeof paymentHeader === "string" 
            ? JSON.parse(paymentHeader)
            : paymentHeader;
          proof = PaymentProofSchema.parse(parsed);
        } catch (error) {
          throw new InvalidPaymentProofError(
            "Invalid payment proof format",
            error
          );
        }

        // Verify payment
        const requirements = this.createPaymentRequirements(options);
        const verified = await this.verifyPayment(proof, requirements);

        if (!verified) {
          return res.status(402).json({
            error: "Payment verification failed",
            requirements,
          });
        }

        // Attach payment info to request
        req.payment = {
          proof,
          verified: true,
          amount: options.amount,
          token: options.token,
        };

        next();
      } catch (error) {
        console.error("Payment middleware error:", error);
        res.status(500).json({
          error: "Payment processing error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string) {
    return getTransactionStatus(this.connection, signature);
  }

  /**
   * Get connection
   */
  getConnection(): JsonRpcProvider {
    return this.connection;
  }
}

/**
 * Helper function to create x402 server instance
 */
export function createX402Server(config: X402ServerConfig): X402Server {
  return new X402Server(config);
}

/**
 * Express middleware factory for simple use cases
 */
export function x402Middleware(
  config: X402ServerConfig,
  paymentOptions: PaymentOptions
) {
  const server = new X402Server(config);
  return server.requirePayment(paymentOptions);
}