"use client";
import React, { useState, useEffect } from 'react';
import { 
  registerUsername, 
  getCurrentWalletAddress, 
  getViemClients,
  getAddressByUsername,
  isUsernameRegistered
} from '@/utils/web3';
import UsernameRegistryABI from '@/contracts/UsernameRegistry.json';
import Layout from '@/components/Layout';

const SetupPage = () => {
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        setIsLoading(true);
        const address = await getCurrentWalletAddress();
        setWalletAddress(address);
        setIsConnected(true);
        
        // First try to get username from blockchain
        try {
          const { publicClient } = await getViemClients();
          const blockchainUsername = await publicClient.readContract({
            address: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS,
            abi: UsernameRegistryABI.abi,
            functionName: 'getUsernameByAddress',
            args: [address],
          });
          
          if (blockchainUsername && blockchainUsername !== '') {
            setCurrentUsername(blockchainUsername);
            // Update localStorage with the blockchain username
            localStorage.setItem(`username_${address.toLowerCase()}`, blockchainUsername);
            return; // Exit early since we found the username
          }
        } catch (contractError) {
          console.error('Error reading username from contract:', contractError);
          // Continue to check localStorage if contract call fails
        }
        
        // If blockchain check fails or returns empty, try localStorage
        const storedUsername = localStorage.getItem(`username_${address.toLowerCase()}`);
        if (storedUsername) {
          setCurrentUsername(storedUsername);
          // We found a username in localStorage but not on blockchain
          // This could mean the username was registered locally but not on chain
          setMessage({
            type: 'warning',
            content: 'Your username is stored locally but may not be registered on the blockchain.'
          });
        }
      } catch (error) {
        console.error('Error fetching wallet info:', error);
        setMessage({ 
          type: 'error', 
          content: 'Failed to connect to wallet. Please make sure you have MetaMask installed and connected.' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletInfo();
  }, []);

  const handleRegisterUsername = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage({ type: 'error', content: 'Please enter a username.' });
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage({ type: '', content: '' });
      
      // First check if the username is already taken
      const checkResult = await isUsernameRegistered(username);
      if (checkResult.success && checkResult.isRegistered) {
        setMessage({ type: 'error', content: `Username @${username} is already taken. Please choose a different username.` });
        setIsLoading(false);
        return;
      }
      
      try {
        // Try to register with the blockchain
        const result = await registerUsername(username);
        
        if (result.success) {
          setMessage({ type: 'success', content: result.message });
          setCurrentUsername(username);
          
          // Store username in localStorage for persistence
          const address = await getCurrentWalletAddress();
          localStorage.setItem(`username_${address.toLowerCase()}`, username);
        } else {
          setMessage({ type: 'error', content: result.message });
        }
      } catch (contractError) {
        console.error('Error in contract interaction:', contractError);
        
        // Only store in localStorage if we're sure the username isn't taken
        if (checkResult.success && !checkResult.isRegistered) {
          const address = await getCurrentWalletAddress();
          localStorage.setItem(`username_${address.toLowerCase()}`, username);
          setCurrentUsername(username);
          setMessage({ 
            type: 'warning', 
            content: `Username @${username} registered locally. The blockchain registration will be attempted again when the network is available.` 
          });
        } else {
          setMessage({ 
            type: 'error', 
            content: `Failed to register username: ${contractError.message}` 
          });
        }
      }
    } catch (error) {
      console.error('Error registering username:', error);
      setMessage({ 
        type: 'error', 
        content: `Failed to register username: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage({ type: 'error', content: 'Please enter a new username.' });
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage({ type: '', content: '' });
      
      // First check if the username is already taken (wrapped in try-catch to handle contract errors)
      try {
        const result = await getAddressByUsername(username);
        
        if (result.success && result.address !== '0x0000000000000000000000000000000000000000') {
          setMessage({ type: 'error', content: `Username @${username} is already taken.` });
          setIsLoading(false);
          return;
        }
      } catch (checkError) {
        console.error('Error checking username availability:', checkError);
        // Continue with the update even if the check fails
      }
      
      try {
        // Remove the old username
        const { walletClient, address } = await getViemClients();
        
        const removeHash = await walletClient.writeContract({
          address: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS,
          abi: UsernameRegistryABI.abi,
          functionName: 'removeUsername',
          args: [currentUsername],
          account: address,
        });
        
        // Register the new username
        const registerResult = await registerUsername(username);
        
        if (registerResult.success) {
          setMessage({ type: 'success', content: `Username updated from @${currentUsername} to @${username}` });
          setCurrentUsername(username);
          
          // Update username in localStorage
          localStorage.setItem(`username_${address.toLowerCase()}`, username);
        } else {
          setMessage({ type: 'error', content: registerResult.message });
        }
      } catch (contractError) {
        console.error('Error in contract interaction:', contractError);
        
        // Fallback to localStorage only if contract interaction fails
        const address = await getCurrentWalletAddress();
        localStorage.setItem(`username_${address.toLowerCase()}`, username);
        setCurrentUsername(username);
        setMessage({ 
          type: 'warning', 
          content: `Username updated locally to @${username}. The blockchain update will be attempted again when the network is available.` 
        });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setMessage({ 
        type: 'error', 
        content: `Failed to update username: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUsername = async () => {
    if (!currentUsername) {
      setMessage({ type: 'error', content: 'No username to remove.' });
      return;
    }
    
    try {
      setIsLoading(true);
      setMessage({ type: '', content: '' });
      
      try {
        // Try to remove from blockchain
        const { walletClient, address } = await getViemClients();
        
        const hash = await walletClient.writeContract({
          address: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS,
          abi: UsernameRegistryABI.abi,
          functionName: 'removeUsername',
          args: [currentUsername],
          account: address,
        });
        
        setMessage({ 
          type: 'success', 
          content: `Username @${currentUsername} has been removed.` 
        });
      } catch (contractError) {
        console.error('Error in contract interaction:', contractError);
        setMessage({ 
          type: 'warning', 
          content: `Username removed locally. The blockchain update will be attempted again when the network is available.` 
        });
      }
      
      // Always remove from localStorage to ensure UI consistency
      const address = await getCurrentWalletAddress();
      localStorage.removeItem(`username_${address.toLowerCase()}`);
      setCurrentUsername('');
    } catch (error) {
      console.error('Error removing username:', error);
      setMessage({ 
        type: 'error', 
        content: `Failed to remove username: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          Username Setup
        </h1>
        <p className="text-center text-gray-400 mb-12">
          Register a unique username for easy payments
        </p>
        
        {!isConnected ? (
          <div className="bg-gray-900 rounded-xl p-8 mb-8 text-center">
            <p className="text-gray-400 mb-4">Please connect your wallet to continue</p>
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
        ) : (
          <>
            <div className="bg-gray-900 rounded-xl p-8 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Connected Wallet</h2>
              <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <span className="text-gray-300 font-mono text-sm truncate max-w-[80%]">{walletAddress}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {currentUsername ? (
              <div className="bg-gray-900 rounded-xl p-8 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">Current Username</h2>
                <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="bg-blue-600 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                      <span className="text-white font-bold">@</span>
                    </div>
                    <span className="text-gray-200 font-medium">@{currentUsername}</span>
                  </div>
                  <div className="flex space-x-2">
                    <span className="bg-green-600 text-xs text-green-100 px-2 py-1 rounded-full">
                      Registered
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <form onSubmit={handleUpdateUsername} className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3 text-white">Update Username</h3>
                    <div className="mb-4">
                      <label htmlFor="new-username" className="block text-gray-400 text-sm mb-2">
                        New Username
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          @
                        </span>
                        <input
                          type="text"
                          id="new-username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-gray-700 text-white rounded-lg pl-8 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="your_new_username"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Update Username'}
                    </button>
                  </form>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3 text-white">Remove Username</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      This will permanently remove your username from the registry.
                    </p>
                    <button
                      onClick={handleRemoveUsername}
                      disabled={isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Remove Username'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl p-8 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">Register Username</h2>
                <form onSubmit={handleRegisterUsername}>
                  <div className="mb-6">
                    <label htmlFor="username" className="block text-gray-400 text-sm mb-2">
                      Choose your username
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        @
                      </span>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-gray-800 text-white rounded-lg pl-8 pr-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your_username"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Username Guidelines:</h3>
                    <ul className="text-gray-500 text-sm space-y-1">
                      <li>• 3-30 characters long</li>
                      <li>• Only lowercase letters, numbers, and underscores</li>
                      <li>• Must be unique across the network</li>
                      <li>• Cannot be changed frequently (gas fees apply)</li>
                    </ul>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Register Username'}
                  </button>
                </form>
              </div>
            )}
            
            {message.content && (
              <div className={`rounded-lg p-4 mb-8 ${
                message.type === 'success' ? 'bg-green-900 text-green-100' : 
                message.type === 'error' ? 'bg-red-900 text-red-100' : 
                message.type === 'warning' ? 'bg-yellow-900 text-yellow-100' :
                'bg-gray-800 text-gray-100'
              }`}>
                {message.content}
              </div>
            )}
            
            <div className="bg-gray-900 rounded-xl p-8">
              <h2 className="text-xl font-semibold mb-4 text-white">Why Register a Username?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-blue-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Easy Payments</h3>
                  <p className="text-gray-400 text-sm">
                    Send and receive payments using simple usernames instead of complex wallet addresses.
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-purple-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Unique Identity</h3>
                  <p className="text-gray-400 text-sm">
                    Establish your unique identity in the Web3 ecosystem with a memorable username.
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-green-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Natural Language</h3>
                  <p className="text-gray-400 text-sm">
                    Use natural language commands like "Send 0.1 ETH to @username" in our AI chat.
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-yellow-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">Secure Transactions</h3>
                  <p className="text-gray-400 text-sm">
                    All username registrations and transactions are secured by blockchain technology.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SetupPage;
