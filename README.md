# QuickPay: Blockchain-Based Payment Platform

![QuickPay](https://github.com/monad-developers/monad-blitz-bangalore/assets/banner.png)

## Overview

QuickPay is a modern, user-friendly blockchain-based payment platform built on the Monad blockchain. It simplifies cryptocurrency transactions by allowing users to send and receive payments using usernames instead of complex wallet addresses. The platform features an intuitive interface, AI-powered chat assistant, transaction analytics, rewards system, and more.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Frontend Components](#frontend-components)
- [Rewards System](#rewards-system)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Features
- **Username-Based Transactions**: Send MON (Monad) cryptocurrency using simple usernames
- **Wallet Integration**: Seamless connection with Web3 wallets
- **Transaction History**: View and track all your past transactions
- **AI-Powered Chat**: Natural language interface for sending payments and checking balances
- **3D Globe Visualization**: Interactive visualization of global transactions
- **Rewards System**: Earn cryptocurrency rewards through various mechanisms

### User Experience
- **Modern UI**: Clean, responsive design with animations and transitions
- **Wallet Dashboard**: View balance and transaction stats at a glance
- **Mobile-Friendly**: Optimized for all device sizes
- **Real-Time Updates**: Instant transaction confirmations and balance updates

## Tech Stack

### Frontend
- **Framework**: Next.js 15.1.8
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS
- **State Management**: React Hooks, Context API
- **Animations**: Framer Motion
- **3D Visualization**: Three.js, React Three Fiber
- **Data Visualization**: Recharts
- **Blockchain Integration**: wagmi, viem
- **AI Integration**: LangChain, Groq

### Backend
- **API Routes**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT

### Blockchain
- **Development Framework**: Hardhat
- **Smart Contracts**: Solidity 0.8.20
- **Network**: Monad Blockchain
- **Testing**: Hardhat Test Suite

## Project Structure

```
quickpay/
├── client/                 # Frontend application
│   ├── public/             # Static assets
│   └── src/
│       ├── app/            # Next.js app router pages
│       │   ├── api/        # API routes
│       │   ├── chat/       # AI chat interface
│       │   ├── pay/        # Payment page
│       │   ├── profile/    # User profile
│       │   ├── rewards/    # Rewards system
│       │   ├── setup/      # Initial setup
│       │   └── transactions/# Transaction history
│       ├── components/     # Reusable UI components
│       ├── config/         # Configuration files
│       ├── contracts/      # Contract ABIs
│       ├── data/           # Static data
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility libraries
│       ├── providers/      # Context providers
│       └── utils/          # Helper functions
└── hardhat/                # Smart contract development
    ├── contracts/          # Solidity smart contracts
    ├── scripts/            # Deployment scripts
    └── test/               # Contract tests
```

## Smart Contracts

### UsernameRegistry.sol
The UsernameRegistry contract manages the mapping between usernames and Ethereum addresses. It allows users to:
- Register a new username
- Update their username
- Look up addresses by username and vice versa
- Transfer username ownership

### QuickPay.sol
The QuickPay contract handles the core payment functionality:
- Send payments using usernames
- Process transactions with optional messages
- Emit events for payment tracking
- Handle transaction failures gracefully

### Rewards System Contracts
The rewards system includes several smart contracts:
- **QuickPayWithRewards.sol**: Extended version of QuickPay with reward functionality
- **RewardsDistributor.sol**: Handles the distribution of token rewards
- **RewardsToken.sol**: ERC20 tokens used for rewards (DAK, MOYAKI, CHOG, TRUMP, GMON)

## Frontend Components

### Key Pages

#### Home Page
The landing page features a 3D interactive globe visualization showing global transactions and the main value proposition of QuickPay.

#### Chat Interface
AI-powered natural language interface for:
- Sending payments using conversational commands
- Checking balances
- Getting transaction history
- Answering questions about the platform

#### Transactions Page
Displays transaction history with:
- Filtering and sorting options
- Transaction details
- Status indicators
- Receipt generation

#### Rewards Page
Showcases the dual rewards system:
- Scratch card rewards with random crypto prizes
- Smart contract token rewards based on transaction amounts

#### Setup Page
Guides new users through:
- Wallet connection
- Username registration
- Initial account setup

### Core Components

- **EnhancedGlobe**: 3D visualization of global transactions
- **Navbar**: Navigation and wallet connection status
- **WalletConnect**: Wallet connection interface
- **TransactionCard**: Displays transaction information
- **RewardsCard**: Interactive rewards interface
- **Marquee**: Animated text banner for announcements

## Rewards System

QuickPay features a dual rewards system:

### 1. Scratch Card Rewards
- Interactive scratch cards reveal random crypto rewards
- Possible rewards include BTC, ETH, USDT, DOGE, SHIB
- Implemented with MongoDB for storage and tracking
- Frontend integration with animated scratch card UI

### 2. Smart Contract Token Rewards
- On-chain rewards with tiered token distribution
- Five custom ERC20 tokens: DAK, MOYAKI, CHOG, TRUMP, GMON
- Reward tiers based on transaction amounts (0.01 ETH to 5+ ETH)
- Fully integrated with the blockchain for transparency

## API Endpoints


### Transactions
- `POST /api/transactions/send`: Send a payment
- `GET /api/transactions/history`: Get transaction history

### Username Management
- `POST /api/username/register`: Register a username
- `GET /api/username/lookup`: Look up address by username

### AI Analysis
- `POST /api/ai-analysis`: Get AI-generated insights on transaction data

### Rewards
- `POST /api/rewards/claim`: Claim a scratch card reward
- `GET /api/rewards/history`: View reward history

## Installation & Setup

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- MongoDB account
- Groq API key for AI features
- Ethereum wallet (MetaMask recommended)

### Environment Variables
Create a `.env` file in the client directory with the following variables:
```
NEXT_PUBLIC_GROQ_API_KEY="your_groq_api_key"
MONGODB_URI="your_mongodb_connection_string"
NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS="deployed_registry_contract_address"
NEXT_PUBLIC_QUICKPAY_CONTRACT_ADDRESS="deployed_quickpay_contract_address"
```

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/monad-developers/monad-blitz-bangalore.git
cd monad-blitz-bangalore
```

2. Install frontend dependencies:
```bash
cd client
npm install
```

3. Install smart contract dependencies:
```bash
cd ../hardhat
npm install
```

## Development

### Running the Frontend
```bash
cd client
npm run dev
```
The application will be available at http://localhost:3000

### Compiling Smart Contracts
```bash
cd hardhat
npx hardhat compile
```

### Testing Smart Contracts
```bash
cd hardhat
npx hardhat test
```

### Deploying Smart Contracts
```bash
cd hardhat
npx hardhat run scripts/deploy.js --network monad
```

## Deployment

### Frontend Deployment
The Next.js frontend can be deployed to Vercel:
```bash
cd client
npm run build
```

### Smart Contract Deployment
1. Deploy the UsernameRegistry contract first
2. Use the registry address to deploy the QuickPay contract
3. For the rewards system, run the deploy-rewards-system.js script
4. Update the contract addresses in the frontend configuration

## Contributing

We welcome contributions to QuickPay! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by the Monad Blitz Bangalore Team
