"use client";
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Layout from '@/components/Layout';
import ScratchCard from '@/components/ScratchCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Award, Sparkles, Gift } from "lucide-react";
import { motion } from "framer-motion";

// Token color mappings for visual styling
const tokenColors = {
  'TRUMP': { primary: '#FF6B6B', secondary: '#FF8E8E', icon: '🦅' },
  'DAK': { primary: '#4ECDC4', secondary: '#7BE0D6', icon: '🌟' },
  'CHOG': { primary: '#F9C80E', secondary: '#FBDA6C', icon: '🔮' },
  'MOYAKI': { primary: '#9D4EDD', secondary: '#B77FE8', icon: '🔥' },
  'GMON': { primary: '#06D6A0', secondary: '#5EEBC5', icon: '🌈' },
};

const RewardsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReward, setActiveReward] = useState(null);
  
  // Use wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  
  // Fetch transactions and rewards when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch transactions
        const txResponse = await fetch(`/api/transactions?address=${address}`);
        const txData = await txResponse.json();
        
        if (txResponse.ok && txData.transactions) {
          setTransactions(txData.transactions);
        }
        
        // Fetch rewards
        const rewardsResponse = await fetch(`/api/rewards?address=${address}`);
        const rewardsData = await rewardsResponse.json();
        
        if (rewardsResponse.ok && rewardsData.rewards) {
          setRewards(rewardsData.rewards);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isConnected, address]);
  
  // Function to handle claiming a reward
  const handleClaimReward = async (transactionId) => {
    if (!isConnected || !address) return;
    
    try {
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          transactionId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.reward) {
        setActiveReward(data.reward);
        
        // Update rewards list
        setRewards(prevRewards => [...prevRewards, data.reward]);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };
  
  // Filter transactions that don't have rewards yet
  const eligibleTransactions = transactions.filter(tx => 
    !rewards.some(reward => reward.transactionId === tx.id)
  );
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Layout>
      <div className="pt-24 px-4 max-w-5xl mx-auto">
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Token Rewards</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Earn exclusive tokens for your transactions on QuickPay</p>
        </motion.div>
        
        {!isConnected ? (
          <motion.div 
            className="text-center py-12 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <Gift className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Connect your wallet to view rewards</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">Unlock exclusive token rewards by connecting your wallet and making transactions</p>
            <motion.a 
              href="/chat" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5" />
              Connect Wallet
            </motion.a>
          </motion.div>
        ) : isLoading ? (
          <div className="flex flex-col justify-center items-center py-24 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-800">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-gradient-to-r from-amber-400 to-yellow-300 opacity-20 animate-pulse"></div>
              <Loader2 className="h-12 w-12 animate-spin text-amber-400 relative z-10" />
            </div>
            <span className="mt-4 text-xl font-medium text-gray-300">Loading your rewards...</span>
          </div>
        ) : (
          <Tabs defaultValue="eligible" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="p-1 bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-700 shadow-lg">
                <TabsTrigger value="eligible" className="px-6 py-2 rounded-full text-sm font-medium">Eligible Transactions</TabsTrigger>
                <TabsTrigger value="claimed" className="px-6 py-2 rounded-full text-sm font-medium">Claimed Rewards</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="eligible">
              {eligibleTransactions.length === 0 ? (
                <motion.div 
                  className="text-center py-16 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6 inline-block p-4 bg-gray-700/50 rounded-full">
                    <Gift className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-medium mb-3 text-white">No Eligible Transactions</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">You don't have any transactions eligible for rewards yet. Make a transaction to earn tokens!</p>
                  <motion.a 
                    href="/chat" 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="h-5 w-5" />
                    Make a Transaction
                  </motion.a>
                </motion.div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {eligibleTransactions.map((tx) => (
                    <motion.div key={tx.id} variants={itemVariants}>
                      <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-yellow-500"></div>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {tx.type === 'sent' ? 'Sent to' : 'Received from'}
                              </CardTitle>
                              <CardDescription>
                                {tx.type === 'sent' 
                                  ? tx.toUsername || tx.to?.substring(0, 6) + '...' + tx.to?.substring(tx.to.length - 4)
                                  : tx.fromUsername || tx.from?.substring(0, 6) + '...' + tx.from?.substring(tx.from.length - 4)
                                }
                              </CardDescription>
                            </div>
                            <div className="p-2 bg-gray-700/50 rounded-full">
                              <Gift className="h-5 w-5 text-amber-400" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-5">
                            <div className="flex items-baseline gap-2 mb-1">
                              <p className="text-xl font-bold">{tx.amount} {tx.currency}</p>
                              <div className="px-2 py-0.5 bg-gray-700/50 rounded-full text-xs text-gray-300">Eligible</div>
                            </div>
                            <p className="text-sm text-gray-400">{tx.date}</p>
                            {tx.purpose && <p className="text-sm mt-2 italic bg-gray-800/50 p-2 rounded-md">"{tx.purpose}"</p>}
                          </div>
                          <motion.button
                            onClick={() => handleClaimReward(tx.id)}
                            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white py-3 rounded-lg transition-all shadow-md group-hover:shadow-lg flex items-center justify-center gap-2 font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Sparkles className="h-4 w-4" />
                            Claim Token Reward
                          </motion.button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="claimed">
              {rewards.length === 0 ? (
                <motion.div 
                  className="text-center py-16 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-800 shadow-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6 inline-block p-4 bg-gray-700/50 rounded-full">
                    <Award className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-medium mb-3">No Rewards Claimed</h3>
                  <p className="text-gray-400 max-w-md mx-auto">You haven't claimed any rewards yet. Complete a transaction to earn token rewards!</p>
                </motion.div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {rewards.map((reward) => {
                    const tokenStyle = tokenColors[reward.currency] || { primary: '#6366F1', secondary: '#818CF8', icon: '🪙' };
                    
                    return (
                      <motion.div key={reward.id} variants={itemVariants}>
                        <Card className="overflow-hidden shadow-lg border-gray-700 group">
                          <div 
                            className="h-3"
                            style={{ background: `linear-gradient(to right, ${tokenStyle.primary}, ${tokenStyle.secondary})` }}
                          ></div>
                          <CardHeader 
                            className="relative pb-2"
                            style={{ 
                              background: `linear-gradient(to bottom, ${tokenStyle.primary}20, transparent)` 
                            }}
                          >
                            <div className="absolute top-3 right-4 text-4xl">{tokenStyle.icon}</div>
                            <CardTitle className="text-xl font-bold">
                              {reward.amount} {reward.currency}
                            </CardTitle>
                            <CardDescription>
                              Claimed on {new Date(reward.claimedAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tokenStyle.primary }}></div>
                                <p className="text-sm font-medium" style={{ color: tokenStyle.secondary }}>Token Reward</p>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-400 mb-1">Transaction ID:</p>
                                <p className="text-xs font-mono bg-gray-900 p-2 rounded-md overflow-x-auto">
                                  {reward.transactionId}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {/* Scratch Card Modal */}
        {activeReward && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-800"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="text-center mb-6">
                <div className="inline-block p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full mb-4">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-transparent bg-clip-text mb-1">
                  Scratch to Reveal Your Token!
                </h2>
                <p className="text-gray-400 text-sm">Scratch the card below to reveal your reward</p>
              </div>
              <ScratchCard reward={activeReward} onClose={() => setActiveReward(null)} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default RewardsPage;
