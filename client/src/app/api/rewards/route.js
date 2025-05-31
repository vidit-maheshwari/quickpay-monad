import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection string - in production, use environment variables
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/quickpay";
const dbName = "quickpay";
const rewardsCollection = "rewards";

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

// GET /api/rewards - Get rewards for a specific address
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }
  
  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const collection = db.collection(rewardsCollection);
    
    // Find rewards for the given address
    const rewards = await collection
      .find({ address: address.toLowerCase() })
      .sort({ claimedAt: -1 })
      .toArray();
    
    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}
