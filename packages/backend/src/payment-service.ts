import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import { handleMCPPaymentRequest } from "./api/mcp-payment-handler";

// Load environment variables
configDotenv();

// Validate required environment variables
const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
if (!walletPrivateKey) {
  console.warn(`\n${"=".repeat(80)}`);
  console.warn(`⚠️  WARNING: WALLET_PRIVATE_KEY is not set in .env`);
  console.warn(`⚠️  The make_mon_payment tool will not work until this is configured.`);
  console.warn(`⚠️  Add WALLET_PRIVATE_KEY=0x... to packages/backend/.env`);
  console.warn(`⚠️  Make sure the wallet has MON tokens on monad-testnet`);
  console.warn(`${"=".repeat(80)}\n`);
} else {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`✅ Payment wallet configured (address will be shown on first payment)`);
  console.log(`${"=".repeat(80)}\n`);
}

const app = express();
const PORT = process.env.PAYMENT_SERVER_PORT || 3002;

// CORS Configuration
const corsOptions = {
    origin: [
    "*",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  
  // Middleware
  app.use(cors(corsOptions as any));
  app.use(express.json());
  
  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "x402-payment-server" });
  });
  
  // MCP Payment Server
  app.post("/mcp", handleMCPPaymentRequest);
  
  // Start server
  app.listen(PORT, () => {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🚀 x402 Payment Server running on port ${PORT}`);
    console.log(`📍 Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - MCP: http://localhost:${PORT}/mcp`);
    console.log(`${"=".repeat(80)}\n`);
  });