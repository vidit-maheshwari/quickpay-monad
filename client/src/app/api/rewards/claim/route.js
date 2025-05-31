import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';

// MongoDB connection string - in production, use environment variables
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/quickpay";
const dbName = "quickpay";
const rewardsCollection = "rewards";
const transactionsCollection = "transactions";

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

// Available token rewards with their probabilities and ranges
const tokenRewards = [
  { currency: 'TRUMP', probability: 0.20, minAmount: 0.5, maxAmount: 2.5 },
  { currency: 'DAK', probability: 0.20, minAmount: 1, maxAmount: 5 },
  { currency: 'CHOG', probability: 0.20, minAmount: 0.75, maxAmount: 3 },
  { currency: 'MOYAKI', probability: 0.20, minAmount: 1.5, maxAmount: 4 },
  { currency: 'GMON', probability: 0.20, minAmount: 0.5, maxAmount: 2 }
];

// Function to generate a random reward
function generateRandomReward() {
  // Random number between 0 and 1
  const rand = Math.random();
  
  // Determine which token to award based on probability
  let cumulativeProbability = 0;
  let selectedToken = null;
  
  for (const token of tokenRewards) {
    cumulativeProbability += token.probability;
    if (rand <= cumulativeProbability) {
      selectedToken = token;
      break;
    }
  }
  
  // If somehow no token was selected, use the last one
  if (!selectedToken) {
    selectedToken = tokenRewards[tokenRewards.length - 1];
  }
  
  // Generate random amount within range
  const amount = selectedToken.minAmount + 
    (Math.random() * (selectedToken.maxAmount - selectedToken.minAmount));
  
  // Format amount to 2 decimal places for all tokens
  const formattedAmount = amount.toFixed(2);
  
  return {
    currency: selectedToken.currency,
    amount: formattedAmount
  };
}

// POST /api/rewards/claim - Claim a reward for a transaction
export async function POST(request) {
  try {
    const data = await request.json();
    const { address, transactionId } = data;
    
    if (!address || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const rewardsCol = db.collection(rewardsCollection);
    const transactionsCol = db.collection(transactionsCollection);
    
    // Check if transaction exists
    const transaction = await transactionsCol.findOne({ 
      txHash: transactionId 
    });
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    // Check if reward already claimed for this transaction
    const existingReward = await rewardsCol.findOne({ 
      transactionId,
      address: address.toLowerCase()
    });
    
    if (existingReward) {
      return NextResponse.json({ 
        message: 'Reward already claimed for this transaction',
        reward: existingReward
      });
    }
    
    // Generate a random reward
    const reward = generateRandomReward();
    
    // Create reward document
    const rewardDoc = {
      id: new ObjectId().toString(),
      address: address.toLowerCase(),
      transactionId,
      amount: reward.amount,
      currency: reward.currency,
      claimedAt: new Date().toISOString(),
      status: 'claimed'
    };
    
    // Store the reward
    await rewardsCol.insertOne(rewardDoc);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reward claimed successfully',
      reward: rewardDoc
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}
