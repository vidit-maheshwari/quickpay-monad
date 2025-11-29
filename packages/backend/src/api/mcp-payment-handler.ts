/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { Wallet } from "ethers";
import {
  createConnection,
  createPaymentTransaction,
  signAndSendTransaction,
  confirmTransaction,
  getChainId,
} from "../x402-sdk";
import { z } from "zod";

/**
 * MCP Payment Handler for x402 Monad Payments
 * Provides a tool to make MON payments and return payment proof for checkout finalization
 */

let mcpPaymentInstance: any = null;

/**
 * Initialize MCP Payment Server with tools
 */
async function initializeMCPPaymentServer(): Promise<any> {
  if (mcpPaymentInstance) {
    return mcpPaymentInstance;
  }

  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");

  const server = new McpServer({
    name: "x402-payment-agent",
    version: "1.0.0",
  });

  // Register make_mon_payment tool
  server.tool(
    "make_mon_payment",
    "Create a MON payment transaction on Monad and return payment proof",
    {
      recipientAddress: z
        .string()
        .describe("EVM wallet address to send MON to"),
      amountWei: z
        .string()
        .describe("Amount in wei (1 MON = 1e18 wei)"),
      network: z
        .string()
        .default("monad-testnet")
        .describe("Monad network identifier"),
      memo: z
        .string()
        .optional()
        .describe("Optional memo to include in transaction"),
    },
    async (args) => {
      return await handleMakeMonPayment(args as any);
    }
  );

  mcpPaymentInstance = server;
  return server;
}

/**
 * Handle MCP requests via HTTP using JSON-RPC 2.0 protocol
 */
export async function handleMCPPaymentRequest(req: Request, res: Response) {
  const requestId = `mcp_payment_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;
  const startTime = Date.now();

  console.log(`\n${"=".repeat(80)}`);
  console.log(`[${requestId}] 💳 MCP Payment Request Received (JSON-RPC 2.0)`);
  console.log(`[${requestId}] Method: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  console.log(`${"=".repeat(80)}`);

  try {
    const body = req.body;
    console.log(`[${requestId}] 📨 Request body:`, JSON.stringify(body, null, 2));

    // Initialize MCP server
    console.log(`[${requestId}] 📌 Initializing MCP payment server...`);
    const server = await initializeMCPPaymentServer();
    console.log(`[${requestId}] ✓ MCP payment server ready`);

    // Handle JSON-RPC 2.0 request
    console.log(`[${requestId}] ⚙️  Processing JSON-RPC request...`);
    const jsonRpcRequest = body;
    const method = jsonRpcRequest.method;
    const params = jsonRpcRequest.params || {};
    const id = jsonRpcRequest.id;

    console.log(`[${requestId}] 🔧 Method: ${method}`);
    console.log(`[${requestId}] 📝 Params:`, JSON.stringify(params, null, 2));

    let jsonRpcResponse: any;

    // Handle different JSON-RPC methods
    if (method === "initialize") {
      console.log(`[${requestId}] 🔌 Handling initialize request...`);
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: {
            tools: {},
            resources: { subscribe: false },
            prompts: {},
          },
          serverInfo: {
            name: "x402-payment-agent",
            version: "1.0.0",
          },
        },
      };
      console.log(`[${requestId}] ✅ Initialize response prepared`);
    } else if (method === "tools/list") {
      console.log(`[${requestId}] 🔧 Handling tools/list request...`);
      const tools = [
        {
          name: "make_mon_payment",
          description:
            "Create a MON payment transaction on Monad and return payment proof",
          inputSchema: {
            type: "object",
            properties: {
              recipientAddress: {
                type: "string",
                description: "EVM wallet address to send MON to",
              },
              amountWei: {
                type: "string",
                description: "Amount in wei (1 MON = 1e18 wei)",
              },
              network: {
                type: "string",
                description: "Monad network identifier",
                default: "monad-testnet",
              },
              memo: {
                type: "string",
                description: "Optional memo to include in transaction",
              },
            },
            required: ["recipientAddress", "amountWei"],
          },
        },
      ];

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: { tools },
      };
      console.log(`[${requestId}] ✅ Tools list prepared (${tools.length} tools)`);
    } else if (method === "tools/call") {
      console.log(`[${requestId}] 🔨 Handling tools/call request...`);
      const toolName = params.name;
      const toolArgs = params.arguments || {};

      console.log(`[${requestId}] 📝 Tool name: ${toolName}`);
      console.log(`[${requestId}] 📋 Tool arguments:`, JSON.stringify(toolArgs, null, 2));

      let toolResult;
      switch (toolName) {
        case "make_mon_payment":
          console.log(`[${requestId}] → Calling handleMakeMonPayment...`);
          toolResult = await handleMakeMonPayment(toolArgs);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      console.log(`[${requestId}] ✅ Tool execution completed`);
      console.log(`[${requestId}] 📊 Tool result:`, JSON.stringify(toolResult, null, 2));

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(toolResult, null, 2),
            },
          ],
        },
      };

      console.log(`[${requestId}] 📨 JSON-RPC Response:`, JSON.stringify(jsonRpcResponse, null, 2));
    } else {
      console.error(`[${requestId}] ❌ Unknown JSON-RPC method: ${method}`);
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] 📤 Sending JSON-RPC response...`);
    console.log(`[${requestId}] ⏱️  Request completed in ${duration}ms`);
    console.log(`[${requestId}] ${"=".repeat(76)}\n`);

    return res.status(200).json(jsonRpcResponse);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Request processing failed`);
    console.error(`[${requestId}] Error type:`, error?.constructor?.name);
    console.error(`[${requestId}] Error message:`, error?.message);
    console.error(`[${requestId}] Stack:`, error?.stack);
    console.log(`[${requestId}] ⏱️  Request failed after ${duration}ms`);
    console.log(`[${requestId}] ${"=".repeat(76)}\n`);

    return res.status(200).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal server error",
        data: error.message,
      },
    });
  }
}

/**
 * Handler: Make MON Payment
 */
async function handleMakeMonPayment(args: any): Promise<any> {
  const requestId = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${requestId}] 💳 MCP Payment: Make MON Payment`);
  console.log(`[${requestId}] 📋 Payment Request:`);
  console.log(`[${requestId}]   - Recipient: ${args.recipientAddress}`);
  console.log(`[${requestId}]   - Amount (wei): ${args.amountWei}`);
  console.log(`[${requestId}]   - Network: ${args.network || "monad-testnet"}`);
  console.log(`${'='.repeat(80)}`);

  const { recipientAddress, amountWei, network = "monad-testnet" } = args;

  if (!recipientAddress) {
    console.error(`[${requestId}] ❌ Missing required parameter: recipientAddress`);
    throw new Error("Missing required parameter: recipientAddress");
  }
  if (!amountWei) {
    console.error(`[${requestId}] ❌ Missing required parameter: amountWei`);
    throw new Error("Missing required parameter: amountWei");
  }

  try {
    // Get wallet from environment
    console.log(`[${requestId}] 🔑 Checking wallet configuration...`);
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
    if (!walletPrivateKey) {
      console.error(`[${requestId}] ❌ WALLET_PRIVATE_KEY not configured`);
      console.log(`[${requestId}] ${'='.repeat(80)}\n`);
      return {
        success: false,
        error: "WALLET_PRIVATE_KEY environment variable not set",
        details: {
          message: "Payment wallet is not configured. Please set WALLET_PRIVATE_KEY in your .env file.",
          instructions: [
            "1. Get a private key from a Monad testnet wallet (e.g., MetaMask)",
            "2. Add WALLET_PRIVATE_KEY=0x... to packages/backend/.env",
            "3. Ensure the wallet has MON tokens on monad-testnet for gas and payments",
            "4. Restart the payment server (port 3002)"
          ]
        }
      };
    }

    console.log(`[${requestId}] 🔑 Loading wallet from private key...`);
    const provider = createConnection(network as any);
    const wallet = new Wallet(walletPrivateKey, provider);
    const walletAddress = await wallet.getAddress();
    console.log(`[${requestId}] ✓ Wallet loaded: ${walletAddress}`);
    
    // Check balance
    const balance = await provider.getBalance(walletAddress);
    console.log(`[${requestId}] 💰 Wallet balance: ${balance.toString()} wei (${(Number(balance) / 1e18).toFixed(6)} MON)`);

    const chainId = getChainId(network as any);

    // Create payment transaction
    console.log(`[${requestId}] 📝 Creating payment transaction...`);
    console.log(`[${requestId}]   - From: ${walletAddress}`);
    console.log(`[${requestId}]   - To: ${recipientAddress}`);
    console.log(`[${requestId}]   - Amount (wei): ${amountWei}`);
    console.log(`[${requestId}]   - Amount (MON): ${(Number(amountWei) / 1e18).toFixed(6)}`);
    console.log(`[${requestId}]   - Chain ID: ${chainId}`);

    const paymentReq = {
      scheme: "x402-monad-mon-v1",
      network: network as any,
      amount: amountWei,
      token: "MON",
      recipient: recipientAddress,
      chainId,
      memo: `x402-payment-${Date.now()}`,
      requestId: `payment_${Date.now()}`,
    };

    const transaction = await createPaymentTransaction(
      provider,
      await wallet.getAddress(),
      paymentReq as any
    );
    console.log(`[${requestId}] ✓ Transaction created`);

    // Sign and send transaction
    console.log(`[${requestId}] 🔐 Signing and sending transaction...`);
    const hash = await signAndSendTransaction(wallet, transaction);
    console.log(`[${requestId}] ✅ Transaction sent!`);
    console.log(`[${requestId}]   - TX Hash: ${hash}`);
    console.log(`[${requestId}]   - Explorer: https://testnet.monad.xyz/tx/${hash} (if available)`);

    // Confirm transaction
    console.log(`[${requestId}] ⏳ Waiting for confirmation (1 block)...`);
    const confirmed = await confirmTransaction(provider, hash, 1);

    if (!confirmed) {
      console.error(`[${requestId}] ❌ Transaction failed to confirm`);
      throw new Error("Transaction failed to confirm");
    }
    console.log(`[${requestId}] ✅ Transaction confirmed on-chain`);

    // Create payment proof for checkout finalization
    const paymentProof = {
      hash,
      network,
      timestamp: Date.now(),
    };

    const response = {
      success: true,
      paymentProof,
      details: {
        transactionHash: hash,
        recipientAddress,
        amountWei,
        network,
        confirmedAt: new Date().toISOString(),
        message: `Payment of ${amountWei} wei sent to ${recipientAddress}. Use the paymentProof to finalize checkout.`,
      },
    };

    console.log(`[${requestId}] 📤 Returning payment proof:`);
    console.log(`[${requestId}]   ${JSON.stringify(response, null, 2)}`);
    console.log(`[${requestId}] ${'='.repeat(80)}\n`);
    return response;
  } catch (err: any) {
    console.error(`[${requestId}] ❌ Payment failed:`, err.message);
    console.error(`[${requestId}] Stack:`, err.stack);
    console.log(`[${requestId}] ${'='.repeat(80)}\n`);
    return {
      success: false,
      error: err.message,
      details: {
        message: "Payment failed. Make sure wallet has sufficient MON balance.",
      },
    };
  }
}
