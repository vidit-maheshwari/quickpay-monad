"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { getWalletBalance, getCurrentWalletAddress, getViemClients } from '@/utils/web3';
import { formatEther } from 'viem';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';

// Create a client-only component for wallet display to avoid hydration errors
const WalletDisplay = dynamic(() => Promise.resolve(({ address, balance }) => (
  <div className="flex items-center space-x-2">
    <div className="bg-green-500 rounded-full h-2 w-2"></div>
    <span className="text-sm text-gray-300">
      {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
    </span>
    {balance && (
      <span className="text-sm bg-blue-500 rounded-full px-3 py-1">
        {parseFloat(balance).toFixed(4)} MON
      </span>
    )}
  </div>
)), { ssr: false });

// Create a client-only component for the connect button
const ConnectButton = dynamic(() => Promise.resolve(() => {
  return (
    <Link href="/chat" passHref>
      <span className="inline-block">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors">
          Connect Wallet
        </button>
      </span>
    </Link>
  );
}), { ssr: false });

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All Transactions');
  const [balance, setBalance] = useState(null);
  
  // Use wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  
  // Function to fetch real transaction history from the blockchain and MongoDB
  const fetchTransactionHistory = async () => {
    if (!isConnected || !address) return [];
    
    try {
      console.log('Fetching transactions for address:', address);
      
      // Fetch transactions from MongoDB API
      const response = await fetch('/api/transactions?address=' + address);
      const data = await response.json();
      
      if (response.ok && data.transactions && data.transactions.length > 0) {
        console.log('Transactions from MongoDB:', data.transactions);
        return data.transactions;
      }
      
      console.log('No transactions found in MongoDB, using fallback method');
      
      // If no transactions in MongoDB, try to get from the blockchain directly
      const { publicClient } = await getViemClients();
      
      // Try to get transaction receipts for the user's address
      // Since viem doesn't have a direct getTransactions method, we'll use a different approach
      
      // As a fallback, return some placeholder transactions for testing
      const sentTransactions = [];
      const receivedTransactions = [];
      
      // Use mock data for testing until MongoDB integration is complete
      console.log('Using mock data for testing');
      return [
        {
          id: '0x123456789abcdef',
          type: 'sent',
          status: 'confirmed',
          to: '0x1234567890123456789012345678901234567890',
          amount: '0.5',
          currency: 'ETH',
          date: new Date().toLocaleDateString(),
          purpose: 'For dinner at the new restaurant',
          tags: ['food', 'social']
        },
        {
          id: '0xabcdef123456789',
          type: 'received',
          status: 'confirmed',
          from: '0x0987654321098765432109876543210987654321',
          amount: '1.0',
          currency: 'ETH',
          date: new Date().toLocaleDateString(),
          purpose: 'Rent payment for January',
          tags: ['rent', 'monthly']
        },
        {
          id: '0xfedcba987654321',
          type: 'sent',
          status: 'confirmed',
          to: '0x2468135790246813579024681357902468135790',
          amount: '0.25',
          currency: 'ETH',
          date: new Date(Date.now() - 86400000).toLocaleDateString(), // Yesterday
          purpose: 'Coffee meetup',
          tags: ['food']
        }
      ];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  };
  
  // Update balance when wallet is connected
  useEffect(() => {
    const updateBalance = async () => {
      if (isConnected && address) {
        try {
          const balanceResult = await getWalletBalance();
          if (balanceResult.success) {
            setBalance(balanceResult.balance);
          }
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };
    
    updateBalance();
  }, [isConnected, address]);
  
  // Fetch real transactions from the blockchain
  useEffect(() => {
    const getTransactions = async () => {
      if (!isConnected) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const txHistory = await fetchTransactionHistory();
        setTransactions(txHistory);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getTransactions();
  }, [isConnected, address]);
  
  // Filter transactions based on search query and filter type
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      searchQuery === '' || 
      tx.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      filter === 'All Transactions' || 
      (filter === 'Sent' && tx.type === 'sent') ||
      (filter === 'Received' && tx.type === 'received');
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <Layout>
      <div className="pt-24 px-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400 mb-2">Transaction History</h1>
            <p className="text-gray-400">Track all your QuickPay transactions</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Use client-only components to avoid hydration errors */}
            {isConnected ? (
              <WalletDisplay address={address} balance={balance} />
            ) : (
              <ConnectButton />
            )}
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search by address, message, or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-full px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <div className="absolute left-3 top-3.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full md:w-1/3"
          >
            <option>All Transactions</option>
            <option>Sent</option>
            <option>Received</option>
          </select>
        </div>
          
        {/* Transactions List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-gray-900 rounded-xl p-4 shadow-lg border border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className={`rounded-full p-2 mr-3 ${tx.type === 'sent' ? 'bg-red-900/30' : 'bg-green-900/30'}`}>
                      {tx.type === 'sent' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-semibold capitalize">{tx.type}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${tx.status === 'confirmed' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {tx.type === 'sent' ? (
                          <>
                            To: {tx.toUsername ? (
                              <span className="text-blue-400">@{tx.toUsername}</span>
                            ) : ''} {tx.to && (
                              <span title={tx.to}>
                                {tx.to.startsWith('0x') ? `${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}` : tx.to}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            From: {tx.fromUsername ? (
                              <span className="text-blue-400">@{tx.fromUsername}</span>
                            ) : ''} {tx.from && (
                              <span title={tx.from}>
                                {tx.from.startsWith('0x') ? `${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}` : tx.from}
                              </span>
                            )}
                          </>
                        )} • {tx.date}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'sent' ? '-' : '+'}{tx.amount} {tx.currency}
                  </div>
                </div>
                
                {tx.purpose && (
                  <p className="text-sm text-gray-300 mt-2 mb-2">{tx.purpose}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {tx.tags && tx.tags.length > 0 && tx.tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  <a 
                    href={`https://testnet.monadexplorer.com/tx/${tx.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full hover:bg-blue-800/30 transition-colors"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TransactionsPage;
