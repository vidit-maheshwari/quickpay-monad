"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { parseTransactionCommand, generateResponse, generateAIResponse } from '@/utils/ai';
import { getAddressByUsername, sendPaymentByUsername, getWalletBalance, getCurrentWalletAddress } from '@/utils/web3';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import Layout from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, ArrowPathIcon, BoltIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! I\'m your QuickPay AI assistant. You can ask me to send payments using natural language. For example, try saying "Send 0.1 MON to @alice for lunch".'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(null);
  
  // Payment context to maintain conversation state
  const [paymentContext, setPaymentContext] = useState({
    active: false,
    recipient: null,
    amount: null,
    currency: null,
    purpose: null,
    stage: null // 'confirmation', 'currency_selection', 'amount_confirmation', etc.
  });
  
  const messagesEndRef = useRef(null);
  
  // Use wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
  
  // Add system message when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setMessages(prev => {
        // Check if we already have a wallet connected message
        const hasConnectedMessage = prev.some(
          msg => msg.role === 'system' && msg.content.includes('Wallet connected')
        );
        
        if (!hasConnectedMessage) {
          return [...prev, {
            role: 'system',
            content: `Wallet connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
          }];
        }
        return prev;
      });
    }
  }, [isConnected, address]);
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      // Find MetaMask connector
      const metaMaskConnector = connectors.find(
        (connector) => connector.id === 'metaMask'
      );
      
      if (metaMaskConnector) {
        await connect({ connector: metaMaskConnector });
        
        // Add a message to show connection was successful
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Wallet connected! You will be prompted to switch to Monad Testnet if needed.'
        }]);
      } else {
        // Fallback to first available connector
        if (connectors.length > 0) {
          await connect({ connector: connectors[0] });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Wallet connected! You will be prompted to switch to Monad Testnet if needed.'
          }]);
        } else {
          throw new Error('No connectors available');
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to connect wallet: ${error.message}`
      }]);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    disconnect();
    setBalance(null);
    setMessages(prev => [...prev, {
      role: 'system',
      content: 'Wallet disconnected.'
    }]);
  };
  
  // Help command handler
  const handleHelpCommand = () => {
    const helpMessage = {
      role: 'assistant',
      content: `**Available Commands:**

**Transaction Commands:**
- Send [amount] [currency] to @[username] for [purpose]
  Example: "Send 0.1 ETH to @alice for lunch"

**Utility Commands:**
- /help - Show this help message
- /balance - Check your current wallet balance
- /transactions - View your transaction history

**Questions you can ask:**
- "What's my balance?"
- "How do I register a username?"
- "What cryptocurrencies are supported?"`
    };
    
    setMessages(prev => [...prev, helpMessage]);
  };
  
  // Process payment confirmation responses
  const processPaymentConfirmation = async (userInput) => {
    const lowerInput = userInput.toLowerCase();
    const isConfirmation = ['yes', 'confirm', 'sure', 'ok', 'okay', 'proceed', 'go ahead'].some(word => lowerInput.includes(word));
    
    if (isConfirmation && paymentContext.active) {
      // User confirmed the payment
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Processing payment of ${paymentContext.amount} ${paymentContext.currency} to @${paymentContext.recipient}${paymentContext.purpose ? ` for ${paymentContext.purpose}` : ''}...`
      }]);
      
      try {
        // Execute the payment
        const result = await sendPaymentByUsername(
          paymentContext.recipient,
          paymentContext.amount,
          paymentContext.currency,
          paymentContext.purpose || ''
        );
        
        // Add transaction result message
        if (result.success) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Successfully sent ${paymentContext.amount} ${paymentContext.currency} to @${paymentContext.recipient}${paymentContext.purpose ? ` for ${paymentContext.purpose}` : ''}!`
          }]);
          
          // Add transaction details if available
          if (result.txHash) {
            setMessages(prev => [...prev, {
              role: 'system',
              content: `Transaction hash: ${result.txHash}`
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ Failed to send payment: ${result.message}`
          }]);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Error processing payment: ${error.message}`
        }]);
      }
      
      // Clear payment context
      setPaymentContext({
        active: false,
        recipient: null,
        amount: null,
        currency: null,
        purpose: null,
        stage: null
      });
      
      return true; // Handled as confirmation
    } else if (paymentContext.active && ['no', 'cancel', 'stop', 'abort'].some(word => lowerInput.includes(word))) {
      // User canceled the payment
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Payment canceled. Is there anything else I can help you with?'
      }]);
      
      // Clear payment context
      setPaymentContext({
        active: false,
        recipient: null,
        amount: null,
        currency: null,
        purpose: null,
        stage: null
      });
      
      return true; // Handled as cancellation
    } else if (paymentContext.active && paymentContext.stage === 'currency_selection') {
      // User is specifying the currency
      const currency = lowerInput.includes('eth') ? 'ETH' : 
                      lowerInput.includes('mon') ? 'MON' : 
                      lowerInput.includes('usdc') ? 'USDC' : 
                      lowerInput.includes('dai') ? 'DAI' : 'ETH';
      
      setPaymentContext(prev => ({
        ...prev,
        currency,
        stage: 'confirmation'
      }));
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Great! To confirm, you want to send ${paymentContext.amount} ${currency} to @${paymentContext.recipient}${paymentContext.purpose ? ` for ${paymentContext.purpose}` : ''}. Type 'yes' to confirm or 'no' to cancel.`
      }]);
      
      return true; // Handled currency selection
    }
    
    return false; // Not handled as a confirmation response
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    // Check for special commands
    const trimmedInput = input.trim();
    
    // Handle /help command
    if (trimmedInput.toLowerCase() === '/help') {
      setMessages(prev => [...prev, { role: 'user', content: trimmedInput }]);
      handleHelpCommand();
      setInput('');
      return;
    }
    
    // Handle /balance command
    if (trimmedInput.toLowerCase() === '/balance') {
      setMessages(prev => [...prev, { role: 'user', content: trimmedInput }]);
      
      if (!isConnected) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Please connect your wallet first to check your balance.'
        }]);
        setInput('');
        return;
      }
      
      try {
        const balanceResult = await getWalletBalance();
        if (balanceResult.success) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Your current balance is ${parseFloat(balanceResult.balance).toFixed(4)} MON.`
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: balanceResult.message || 'Failed to get balance.'
          }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error checking balance: ${error.message}`
        }]);
      }
      
      setInput('');
      return;
    }
    
    // Handle /transactions command
    if (trimmedInput.toLowerCase() === '/transactions') {
      setMessages(prev => [...prev, { role: 'user', content: trimmedInput }]);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'You can view your transactions on the [Transactions page](/transactions).'
      }]);
      setInput('');
      return;
    }
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setIsProcessing(true);
    
    // Check if this is a response to an active payment context
    if (await processPaymentConfirmation(input)) {
      setIsProcessing(false);
      setInput('');
      return;
    }
    
    try {
      // First, check if this is a transaction command
      const parsedCommand = await parseTransactionCommand(input);
      
      // Process transaction if it's a valid command
      if (parsedCommand.action === 'send') {
        if (!isConnected) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Please connect your wallet first to send payments.'
          }]);
        } else {
          // Set payment context and ask for confirmation
          setPaymentContext({
            active: true,
            recipient: parsedCommand.recipient,
            amount: parsedCommand.amount,
            currency: parsedCommand.currency,
            purpose: parsedCommand.purpose || '',
            stage: 'confirmation'
          });
          
          // Add confirmation message
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `It looks like you're ready to make a payment! To confirm, you want to send ${parsedCommand.amount} ${parsedCommand.currency} to the recipient @${parsedCommand.recipient}${parsedCommand.purpose ? ` for ${parsedCommand.purpose}` : ''}. Type 'yes' to confirm or 'no' to cancel.`
          }]);
        }
      } else if (parsedCommand.action === 'balance') {
        // Handle balance inquiry
        if (!isConnected) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Please connect your wallet first to check your balance.'
          }]);
        } else {
          try {
            const balanceResult = await getWalletBalance();
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: balanceResult.success 
                ? `Your current balance is ${parseFloat(balanceResult.balance).toFixed(4)} MON.`
                : (balanceResult.message || 'Failed to get balance.')
            }]);
          } catch (error) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `Error checking balance: ${error.message}`
            }]);
          }
        }
      } else {
        // Not a recognized command, use AI to generate a response
        try {
          const aiResponse = await generateAIResponse(input, isConnected);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: aiResponse
          }]);
        } catch (error) {
          console.error('Error generating AI response:', error);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'I encountered an error while processing your request. Please try again.'
          }]);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.'
      }]);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };
  
  return (
    <Layout>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        {/* Header with Wallet Connection Status */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 pt-20 pb-4 flex justify-between items-center border-b border-gray-800/50"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
              QuickPay AI Chat
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-inner border border-gray-700/50"
              >
                <div className="bg-green-500 rounded-full h-2 w-2 animate-pulse"></div>
                <span className="text-sm text-white font-medium">
                  {address.substring(0, 6)}...{address.substring(address.length - 4)}
                </span>
                {balance && (
                  <span className="text-sm bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-full px-3 py-1 font-medium shadow-inner">
                    {parseFloat(balance).toFixed(4)} MON
                  </span>
                )}
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Disconnect</span>
                </button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-full transition-all shadow-lg flex items-center space-x-2"
              >
                <BoltIcon className="h-5 w-5" />
                <span>Connect Wallet</span>
              </motion.button>
            )}
          </div>
        </motion.div>
        
        {/* Chat Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
          <div className="container mx-auto max-w-3xl py-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 > 0.5 ? 0.5 : index * 0.1 }}
                  className="flex w-full mb-4"
                >
                  <div 
                    className={`relative px-4 py-3 rounded-2xl shadow-lg max-w-[85%] ${message.role === 'user' 
                      ? 'ml-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                      : message.role === 'system' 
                      ? 'mx-auto bg-gray-700/70 text-gray-200 text-sm px-4 py-2 rounded-full' 
                      : 'mr-auto bg-gray-800/90 backdrop-blur-sm text-white border border-gray-700/30'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="absolute -left-2 top-2 w-4 h-4 bg-gray-800 transform rotate-45 border-l border-b border-gray-700/30"></div>
                    )}
                    {message.role === 'user' && (
                      <div className="absolute -right-2 top-2 w-4 h-4 bg-blue-600 transform rotate-45"></div>
                    )}
                    <div className="relative z-10">
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-900/80 backdrop-blur-md p-6 border-t border-gray-800/50 shadow-lg"
        >
          <div className="container mx-auto max-w-3xl">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message or transaction command..."
                className="flex-1 bg-gray-800/90 text-white rounded-full px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner border border-gray-700/50 placeholder-gray-500"
                disabled={isProcessing}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full p-3.5 transition-all disabled:opacity-50 shadow-lg"
                disabled={isProcessing || !input.trim()}
              >
                {isProcessing ? (
                  <ArrowPathIcon className="h-6 w-6 animate-spin" />
                ) : (
                  <ArrowUpIcon className="h-6 w-6" />
                )}
              </motion.button>
            </form>
            
            <div className="mt-4 text-sm text-gray-400 text-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 shadow-inner">
              <span className="font-medium text-gray-300">Try:</span> <span className="text-blue-400 font-medium">"Send 0.1 MON to @alice for lunch"</span> or <span className="text-blue-400 font-medium">"What's my balance?"</span>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ChatPage;
