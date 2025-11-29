# x402 Shopify Commerce - Agent-Ready Stores in 2 Minutes

Make any Shopify store agent-ready with HTTP 402 Payment Required protocol. Enable AI agents to discover products, place orders, and pay with MON on Monad - all natively integrated with your Shopify dashboard.

## The Problem We Solved

Shopify stores are designed for human customers. AI agents need a different kind of interface. Traditionally, integrating cryptocurrency payments required:
- Complex custom development
- Deep blockchain expertise
- Integration challenges with existing e-commerce systems
- Non-standard payment flows
- Manual API integrations for agent discovery

## Our Solution

We built a **2-minute setup** that transforms any Shopify store into an agent-ready marketplace:

1. **Connect Store** (30 seconds)
   - Paste your Shopify store URL and API token
   - Done - store is registered and discoverable by agents

2. **Select Products** (60 seconds)
   - Browse your Shopify products
   - Select which ones AI agents can purchase
   - Sync to platform

3. **Live Dashboard** (30 seconds)
   - View all agent orders in real-time
   - Orders appear directly in your Shopify admin
   - Monitor payment intents and cryptocurrency transactions

**No custom code. No blockchain knowledge needed. Works with existing Shopify setup.**

## How x402 & MCP Power This

**Model Context Protocol (MCP)** enables AI agent discovery and interaction:
- Stores register via a simple UI
- MCP server automatically exposes tools for agents
- Agents can browse stores, products, and place orders
- All through a standard JSON-RPC 2.0 interface

**HTTP 402 Payment Required** (via x402 specification) enables clean crypto payments:

1. **Agent requests checkout** → Server responds with payment requirements (HTTP 402)
2. **Agent executes payment** → Monad transaction with MON transfer
3. **Server verifies payment** → Creates order in Shopify
4. **Order synced** → Appears in your Shopify dashboard immediately

This standard-based approach means:
- ✅ No payment processing fees (peer-to-peer transfers)
- ✅ Fast, verifiable transactions on the Monad blockchain
- ✅ Native integration with Shopify (orders appear normally)
- ✅ Scalable architecture for agent commerce

## Key Features

- **Agent Discovery**: Your products are automatically discoverable by AI agents
- **Real-Time Orders**: See agent orders in your Shopify dashboard instantly
- **Payment Verification**: Blockchain-verified cryptocurrency payments
- **MCP Integration**: AI agents interact via Model Context Protocol (JSON-RPC 2.0)
- **Dark Mode**: Beautiful UI with light/dark theme support
- **No Setup Complexity**: Just 2 minutes of configuration

## Project Structure

```
x402-shopify-commerce/
├── packages/
│   ├── frontend/          # Next.js store setup & management UI
│   │   ├── app/page.tsx               # Home page
│   │   ├── app/register/page.tsx      # Store registration
│   │   ├── app/products/page.tsx      # Product selection
│   │   └── app/dashboard/page.tsx     # Orders & payment monitoring
│   │
│   └── backend/           # Express.js API & payment server
│       ├── src/api/                   # REST and MCP endpoints
│       │   ├── x402-checkout.ts       # 2-phase checkout (HTTP 402)
│       │   ├── x402-order-details.ts  # Order information
│       │   ├── mcp-handler.ts         # AI agent tools
│       │   └── ...
│       ├── src/utils/                 # Payment helpers
│       │   ├── x402-payment-helpers.ts    # HTTP 402 utilities
│       │   ├── x402-config.ts             # Payment configuration
│       │   └── ...
│       └── payment-service.ts         # Monad payment utilities (optional)
│
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm/pnpm
- Shopify store with API access
- Monad testnet wallet (MetaMask or ethers-compatible signer)

### Frontend Setup (No Environment Variables Required)

```bash
cd packages/frontend
pnpm install
pnpm dev
```

Frontend runs on **http://localhost:3000**

### Backend Setup

1. Create `.env` file in `packages/backend/`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://account.supabase.co
SUPABASE_KEY=ey....

# Shopify Configuration
SHOPIFY_API_VERSION=2025-10

# x402 Payment Configuration
X402_NETWORK=monad-testnet
X402_RECIPIENT_ADDRESS=0xyourRecipient
X402_RPC_ENDPOINT=https://testnet-rpc.monad.xyz

# Monad Wallet (Private Key)
WALLET_PRIVATE_KEY=0xyourPrivateKey
```

2. Install and run:

```bash
cd packages/backend
pnpm install
pnpm dev:all
```

This starts:
- **Main server** on **http://localhost:3001** (REST API + MCP)
- **Optional payment service** on **http://localhost:3002** (additional automation hooks)

## Accessing the Application

### Store Owner Flow
1. Open **http://localhost:3000** (Frontend)
2. Click "Get Started"
3. Connect your Shopify store
4. Select products for agents to purchase
5. View orders in real-time dashboard

### AI Agent Access (via MCP)

The backend exposes an MCP server that AI agents can interact with:

**Endpoint**: `http://localhost:3001/mcp` (JSON-RPC 2.0)

**Available Tools**:
- `list_stores` - Browse available stores
- `get_store_products` - View store products
- `initiate_checkout` - Start order (Phase 1: HTTP 402)
- `finalize_checkout` - Complete order (Phase 2: with payment proof)
- `get_order_details` - Track order status

### Expose to Internet (for LLM Integration)

Use **ngrok** to expose servers for AI agent access:

```bash
# Terminal 1: Expose main server
ngrok http 3001

# Terminal 2: Expose payment server
ngrok http 3002
```

Update your LLM chat client to use the ngrok URLs:
- Main API: `https://xxxx-ngrok.io/mcp`
- Payment API: `https://yyyy-ngrok.io/mcp`

## API Documentation

- **Backend API**: See `packages/backend/README.md` for detailed endpoint documentation
- **Frontend Pages**: See `packages/frontend/README.md` for UI documentation

## Technology Stack

### Frontend
- Next.js 14 (TypeScript)
- Tailwind CSS
- React Hooks
- Lucide Icons

### Backend
- Express.js (Node.js)
- TypeScript
- Supabase (PostgreSQL)
- Ethers.js + Monad RPC
- Model Context Protocol (MCP)

### Blockchain
- Monad (testnet / future mainnet)
- Native MON token
- x402 Payment Protocol

## Checkout Flow (HTTP 402)

```
Agent calls initiate_checkout (no payment)
         ↓
Server returns HTTP 402 with payment requirements
- Amount in MON wei (18 decimals)
- Recipient wallet address
- Expiration time
         ↓
Agent creates Monad transaction
Agent executes transfer to recipient
Agent gets transaction hash
         ↓
Agent calls finalize_checkout (with X-PAYMENT header containing hash)
         ↓
Server verifies payment on blockchain
         ↓
Server creates order in Shopify
Order appears in Shopify admin
         ↓
Return HTTP 200 with order confirmation
```

## Database Schema

- **stores**: Shopify store configurations
- **store_products**: Product catalog from Shopify
- **order_intents**: Pending payment intents (15-min expiry)
- **orders**: Confirmed orders linked to Shopify

See `packages/backend/README.md` for detailed schema.

## Security Features

- ✅ Blockchain-verified payments
- ✅ Request body hashing prevents cart tampering
- ✅ Order intent expiration (15 minutes)
- ✅ Payment verification before order creation
- ✅ No sensitive data in frontend storage
- ✅ Environment variables for all secrets

## Troubleshooting

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check CORS settings
- Clear browser cache

### Products not loading
- Verify Shopify API token is valid
- Check Shopify API permissions
- Ensure products exist in store

### Payment verification fails
- Confirm Monad transaction was successful
- Check X-PAYMENT header format
- Verify amount matches payment requirements

### Orders not appearing in Shopify
- Confirm backend has valid Shopify admin token
- Check Shopify API endpoint version
- Review backend logs for errors

## Next Steps

1. **Configure Environment**: Add your secrets to `.env`
2. **Start Services**: Run `pnpm dev:all`
3. **Test Flow**: Use frontend to connect store
4. **Integrate Agents**: Expose via ngrok for LLM agents

## File Locations for Reference

- Backend REST API: `packages/backend/src/api/x402-checkout.ts`
- MCP Server: `packages/backend/src/api/mcp-handler.ts`
- Frontend Store Connection: `packages/frontend/app/register/page.tsx`
- Dashboard: `packages/frontend/app/dashboard/page.tsx`

## Learning Resources

- [HTTP 402 Payment Required Spec](https://tools.ietf.org/html/draft-fallon-http-payment-required-02)
- [x402 Payment Protocol](https://x402.org)
- [Monad Documentation](https://docs.monad.xyz/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io)

## License

MIT

## Support

For detailed API documentation:
- **Backend**: See `packages/backend/README.md`
- **Frontend**: See `packages/frontend/README.md`

---

**Built to showcase the power of HTTP 402 payments for agent commerce.**
