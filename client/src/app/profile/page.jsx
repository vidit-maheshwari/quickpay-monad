"use client";
import React, { useState, useEffect } from 'react';
import { getCurrentWalletAddress, getViemClients } from '@/utils/web3';
import { calculateCredibilityScore, getUserAchievements, getTransactionStats } from '@/utils/credibility';
import UsernameRegistryABI from '@/contracts/UsernameRegistry.json';
import Layout from '@/components/Layout';
import Link from 'next/link';

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [credibilityScore, setCredibilityScore] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [transactionStats, setTransactionStats] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Get wallet address
        const address = await getCurrentWalletAddress();
        setWalletAddress(address);
        setIsConnected(true);
        
        // Get username from blockchain
        try {
          const { publicClient } = await getViemClients();
          const blockchainUsername = await publicClient.readContract({
            address: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS,
            abi: UsernameRegistryABI.abi,
            functionName: 'getUsernameByAddress',
            args: [address],
          });
          
          if (blockchainUsername && blockchainUsername !== '') {
            setUsername(blockchainUsername);
            localStorage.setItem(`username_${address.toLowerCase()}`, blockchainUsername);
          } else {
            // If not found on blockchain, try localStorage
            const storedUsername = localStorage.getItem(`username_${address.toLowerCase()}`);
            if (storedUsername) {
              setUsername(storedUsername);
            }
          }
        } catch (contractError) {
          console.error('Error reading username from contract:', contractError);
          // If contract call fails, try localStorage
          const storedUsername = localStorage.getItem(`username_${address.toLowerCase()}`);
          if (storedUsername) {
            setUsername(storedUsername);
          }
        }
        
        // Fetch transaction data
        const transactionData = await fetchTransactionData(address);
        setUserData(transactionData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please make sure your wallet is connected.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Calculate derived data when userData changes
  useEffect(() => {
    if (userData) {
      const score = calculateCredibilityScore(userData);
      setCredibilityScore(score);
      
      const userAchievements = getUserAchievements(userData);
      setAchievements(userAchievements);
      
      const stats = getTransactionStats(userData);
      setTransactionStats(stats);
    }
  }, [userData]);

  // Fetch real transaction data from the blockchain and API
  const fetchTransactionData = async (address) => {
    try {
      // Try to fetch from API first
      const response = await fetch(`/api/transactions?address=${address}`);
      const data = await response.json();
      
      if (data.success && data.transactions && data.transactions.length > 0) {
        return {
          transactions: data.transactions,
          accountCreationDate: data.accountCreationDate || new Date().toISOString(),
          verificationLevel: data.verificationLevel || 1,
          successfulTransactions: data.transactions.filter(tx => tx.status === 'completed').length
        };
      }
      
      // If API doesn't return data, try to get transactions from blockchain
      try {
        const { publicClient } = await getViemClients();
        
        // Get account creation date (approximation based on first transaction)
        // In a real app, you'd have this stored in your database
        const blockNumber = await publicClient.getBlockNumber();
        const creationDate = new Date();
        creationDate.setDate(creationDate.getDate() - 30); // Default to 30 days ago
        
        // For demonstration, we'll return a simplified dataset
        // In a real app, you'd query transaction events from your contracts
        return {
          transactions: [],
          accountCreationDate: creationDate.toISOString(),
          verificationLevel: 1,
          successfulTransactions: 0
        };
      } catch (blockchainError) {
        console.error('Error fetching blockchain data:', blockchainError);
        throw blockchainError;
      }
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      
      // Generate mock data for demo purposes if all else fails
      const mockTransactions = [];
      const numTransactions = Math.floor(Math.random() * 20) + 5; // 5-25 transactions
      
      // Generate random transactions
      for (let i = 0; i < numTransactions; i++) {
        const amount = (Math.random() * 2 + 0.01).toFixed(4); // 0.01-2.01 ETH
        const status = Math.random() > 0.1 ? 'completed' : 'failed'; // 90% success rate
        
        // Generate a random recipient address
        const recipient = `0x${Array.from({length: 40}, () => 
          '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
        
        // Random date in the past year
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
        
        mockTransactions.push({
          txHash: `0x${Array.from({length: 64}, () => 
            '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
          sender: address,
          recipient,
          amount,
          currency: 'ETH',
          purpose: ['Payment', 'Donation', 'Purchase', 'Transfer'][Math.floor(Math.random() * 4)],
          status,
          timestamp: date.toISOString()
        });
      }
      
      // Sort transactions by date (newest first)
      mockTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Random account creation date (1-90 days ago)
      const creationDate = new Date();
      creationDate.setDate(creationDate.getDate() - Math.floor(Math.random() * 90) - 1);
      
      return {
        transactions: mockTransactions,
        accountCreationDate: creationDate.toISOString(),
        verificationLevel: Math.floor(Math.random() * 3), // 0-2
        successfulTransactions: mockTransactions.filter(tx => tx.status === 'completed').length
      };
    }
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          Your Profile
        </h1>
        <p className="text-center text-gray-400 mb-12">
          View your account details, transaction history, and credibility score and achievements
        </p>
        
        {!isConnected ? (
          <div className="bg-gray-900 rounded-xl p-8 mb-8 text-center">
            <p className="text-gray-400 mb-4">Please connect your wallet to view your profile</p>
            <button 
              onClick={async () => {
                try {
                  await getCurrentWalletAddress();
                  window.location.reload();
                } catch (error) {
                  console.error('Error connecting wallet:', error);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 text-red-200 p-6 rounded-xl text-center">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-gray-900 rounded-xl p-6 flex flex-col items-center">
              <div className="bg-blue-600 rounded-full h-24 w-24 flex items-center justify-center mb-4">
                <span className="text-white text-3xl font-bold">
                  {username ? username.charAt(0).toUpperCase() : walletAddress.charAt(2).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-1">
                {username ? `@${username}` : 'Anonymous User'}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Member since {new Date(userData?.accountCreationDate).toLocaleDateString()}
              </p>
              <div className="bg-gray-800 rounded-lg p-3 w-full mb-4">
                <p className="text-gray-400 text-xs mb-1">Wallet Address</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-mono text-sm truncate max-w-[80%]">
                    {walletAddress}
                  </span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(walletAddress)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">Total Transactions</p>
                  <p className="text-xl font-bold">{transactionStats.totalTransactions || 0}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">Total Volume</p>
                  <p className="text-xl font-bold">{transactionStats.totalVolume?.toFixed(2) || 0} ETH</p>
                </div>
              </div>
            </div>
            
            {/* Credibility Score Card */}
            <div className="bg-gray-900 rounded-xl p-6 lg:col-span-2">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold text-white ">Credibility Score</h2>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="text-center mb-4 md:mb-0">
                  <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text">
                    {credibilityScore?.totalScore || 300}
                  </div>
                  <p className="text-white mt-1">out of 850</p>
                  <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium inline-block
                    ${credibilityScore?.level === 'Excellent' ? 'bg-green-900/50 text-green-300' :
                      credibilityScore?.level === 'Good' ? 'bg-blue-900/50 text-blue-300' :
                      credibilityScore?.level === 'Fair' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'}`}>
                    {credibilityScore?.level || 'Poor'}
                  </div>
                </div>
                
                <div className="w-full md:w-3/5">
                  {/* Payment History */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">Payment History</span>
                      <span>{credibilityScore?.components.paymentHistory || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${credibilityScore?.components.paymentHistory || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Transaction Volume */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">Transaction Volume</span>
                      <span>{credibilityScore?.components.transactionVolume || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${credibilityScore?.components.transactionVolume || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Network Activity */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">Network Activity</span>
                      <span>{credibilityScore?.components.networkActivity || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${credibilityScore?.components.networkActivity || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium mb-3 text-white">What This Score Means</h3>
                <p className="text-white text-sm">
                  Your QuickPay Credibility Score is similar to a credit score in traditional finance. It reflects your reliability and trustworthiness in the Web3 ecosystem. A higher score can lead to benefits like lower fees, higher transaction limits, and access to exclusive features.
                </p>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-red-900/30 text-red-200 p-2 rounded text-center text-xs">
                    <div className="font-bold mb-1">Poor</div>
                    <div>300-599</div>
                  </div>
                  <div className="bg-yellow-900/30 text-yellow-200 p-2 rounded text-center text-xs">
                    <div className="font-bold mb-1">Fair</div>
                    <div>600-699</div>
                  </div>
                  <div className="bg-blue-900/30 text-blue-200 p-2 rounded text-center text-xs">
                    <div className="font-bold mb-1">Good</div>
                    <div>700-749</div>
                  </div>
                  <div className="bg-green-900/30 text-green-200 p-2 rounded text-center text-xs">
                    <div className="font-bold mb-1">Excellent</div>
                    <div>750-850</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Achievements */}
            <div className="bg-gray-900 rounded-xl p-6 lg:col-span-3">
              <div className="flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Achievements</h2>
              </div>
              
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-white">
                  <p>No achievements yet. Start making transactions to earn achievements!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map(achievement => (
                    <div key={achievement.id} className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h3 className="text-lg font-medium mb-1 text-white">{achievement.title}</h3>
                      <p className="text-white text-sm text-center mb-2">{achievement.description}</p>
                      <div className="text-xs text-white">
                        {new Date(achievement.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recent Transactions */}
            <div className="bg-gray-900 rounded-xl p-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                </div>
                <Link href="/transactions" className="text-blue-500 hover:text-blue-400 text-sm">
                  View All
                </Link>
              </div>
              
              {!userData?.transactions || userData.transactions.length === 0 ? (
                <div className="text-center py-8 text-white">
                  <p>No transactions yet. Start using QuickPay to send and receive payments!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-white text-sm">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Recipient</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.transactions.slice(0, 5).map((tx, index) => (
                        <tr key={tx.txHash || index} className="border-t border-gray-800">
                          <td className="py-3 text-sm">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-sm">
                            {tx.recipientUsername ? `@${tx.recipientUsername}` : 
                              `${tx.recipient.substring(0, 6)}...${tx.recipient.substring(tx.recipient.length - 4)}`}
                          </td>
                          <td className="py-3 text-sm">
                            {tx.amount} {tx.currency}
                          </td>
                          <td className="py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs
                              ${tx.status === 'completed' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                              {tx.status === 'completed' ? 'Completed' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Improvement Tips */}
            <div className="bg-gray-900 rounded-xl p-6 lg:col-span-3">
              <div className="flex items-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold text-white">How to Improve Your Score</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-blue-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Consistent Activity</h3>
                  <p className="text-white text-sm">
                    Make regular transactions to show consistent activity on the network. Even small transactions help build your history.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-purple-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Complete Transactions</h3>
                  <p className="text-white text-sm">
                    Ensure your transactions complete successfully. Failed transactions can negatively impact your payment history score.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-green-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Expand Your Network</h3>
                  <p className="text-white text-sm">
                    Transact with different addresses to increase your network activity score. This shows you're an active participant in the ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
