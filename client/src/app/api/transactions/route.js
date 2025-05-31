import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection string - in production, use environment variables
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/quickpay";
const dbName = "quickpay";
const collectionName = "transactions";

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }
  
  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Find transactions where the user is either sender or recipient
    const transactions = await collection
      .find({
        $or: [
          { 'sender': address.toLowerCase() },
          { 'recipient': address.toLowerCase() }
        ]
      })
      .sort({ timestamp: -1 })
      .toArray();
    
    // Transform MongoDB documents to the format expected by the frontend
    const formattedTransactions = transactions.map(tx => {
      const isSent = tx.sender.toLowerCase() === address.toLowerCase();
      
      return {
        id: tx.txHash,
        type: isSent ? 'sent' : 'received',
        status: 'confirmed',
        to: isSent ? tx.recipient : undefined,
        from: isSent ? undefined : tx.sender,
        toUsername: isSent ? tx.recipientUsername : undefined,
        fromUsername: isSent ? undefined : tx.senderUsername,
        amount: tx.amount,
        currency: tx.currency || 'ETH',
        date: new Date(tx.timestamp).toLocaleDateString(),
        purpose: tx.purpose || '',
        tags: tx.tags || []
      };
    });
    
    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { txHash, sender, recipient, amount, currency, purpose, timestamp } = data;
    
    if (!txHash || !sender || !recipient || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Check if transaction already exists
    const existingTx = await collection.findOne({ txHash });
    if (existingTx) {
      return NextResponse.json({ message: 'Transaction already exists' });
    }
    
    // Extract tags from purpose
    const words = purpose ? purpose.toLowerCase().split(' ') : [];
    const tags = words.length > 0 ? [words[0]] : [];
    
    // Store the transaction
    const result = await collection.insertOne({
      txHash,
      sender: sender.toLowerCase(),
      recipient: recipient.toLowerCase(),
      amount,
      currency: currency || 'ETH',
      purpose: purpose || '',
      timestamp: timestamp || Date.now(),
      tags
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transaction stored successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error storing transaction:', error);
    return NextResponse.json({ error: 'Failed to store transaction' }, { status: 500 });
  }
}
