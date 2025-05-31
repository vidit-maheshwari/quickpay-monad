import { createPublicClient, createWalletClient, http, custom, parseEther, formatEther } from 'viem';

// Define Monad Testnet chain configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.monad.xyz/'] },
    default: { http: ['https://testnet-rpc.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com/' },
  },
};
import UsernameRegistryABI from '../contracts/UsernameRegistry.json';
import QuickPayABI from '../contracts/QuickPay.json';

// Contract addresses - these would be set after deployment
const REGISTRY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS || '0xAAEaDf29058BCe2F82F1218Ed901d9Da07f0000b'; // Placeholder
const QUICKPAY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_QUICKPAY_CONTRACT_ADDRESS || '0x73161053AA73563F78a5CEEBcA9457451eb3Fc85'; // Placeholder

// Switch to Monad Testnet if needed
const switchToMonadTestnet = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
  }
  
  try {
    // Check current chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId, 16);
    
    // If not on Monad Testnet, try to switch
    if (currentChainId !== monadTestnet.id) {
      try {
        // Try to switch to the Monad Testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${monadTestnet.id.toString(16)}` }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${monadTestnet.id.toString(16)}`,
                chainName: monadTestnet.name,
                nativeCurrency: monadTestnet.nativeCurrency,
                rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
                blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch (error) {
    console.error('Failed to switch to Monad Testnet:', error);
    throw new Error(`Failed to switch to Monad Testnet: ${error.message}`);
  }
};

// Initialize viem clients
export const getViemClients = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
  }
  
  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Ensure we're on the Monad Testnet
    await switchToMonadTestnet();
    
    // Create public client for reading from the blockchain
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(),
    });
    
    // Create wallet client for writing to the blockchain
    const walletClient = createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum),
    });
    
    // Get the connected account
    const [address] = await walletClient.getAddresses();
    
    return { publicClient, walletClient, address };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw new Error('Failed to connect to wallet. Please try again.');
  }
};

// Check if a username is already registered
export const isUsernameRegistered = async (username) => {
  try {
    const { publicClient } = await getViemClients();
    
    // First check if the username is registered using the contract function
    const isRegistered = await publicClient.readContract({
      address: REGISTRY_CONTRACT_ADDRESS,
      abi: UsernameRegistryABI.abi,
      functionName: 'isUsernameRegistered',
      args: [username],
    });
    
    return {
      success: true,
      isRegistered,
      message: isRegistered ? `Username @${username} is already taken.` : `Username @${username} is available.`
    };
  } catch (error) {
    console.error('Error checking username registration:', error);
    
    // If contract call fails, try to check by getting the address
    try {
      const result = await getAddressByUsername(username);
      const isRegistered = result.success && result.address !== '0x0000000000000000000000000000000000000000';
      
      return {
        success: true,
        isRegistered,
        message: isRegistered ? `Username @${username} is already taken.` : `Username @${username} is available.`
      };
    } catch (innerError) {
      console.error('Error in fallback username check:', innerError);
      return {
        success: false,
        isRegistered: false, // Default to false if we can't determine
        message: `Could not verify if username is available: ${error.message}`
      };
    }
  }
};

// Register a username
export const registerUsername = async (username) => {
  try {
    // First check if the username is already taken
    const checkResult = await isUsernameRegistered(username);
    if (checkResult.success && checkResult.isRegistered) {
      return {
        success: false,
        message: `Username @${username} is already taken. Please choose a different username.`
      };
    }
    
    // Also check if the current address already has a username
    const { walletClient, address, publicClient } = await getViemClients();
    
    try {
      const currentUsername = await publicClient.readContract({
        address: REGISTRY_CONTRACT_ADDRESS,
        abi: UsernameRegistryABI.abi,
        functionName: 'getUsernameByAddress',
        args: [address],
      });
      
      if (currentUsername && currentUsername !== '') {
        return {
          success: false,
          message: `Your wallet already has the username @${currentUsername} registered. Please remove it before registering a new one.`
        };
      }
    } catch (checkError) {
      console.error('Error checking current username:', checkError);
      // Continue with registration even if check fails
    }
    
    // Register the username
    const hash = await walletClient.writeContract({
      address: REGISTRY_CONTRACT_ADDRESS,
      abi: UsernameRegistryABI.abi,
      functionName: 'registerUsername',
      args: [username],
      account: address,
    });
    
    return {
      success: true,
      txHash: hash,
      message: `Username @${username} successfully registered.`
    };
  } catch (error) {
    console.error('Error registering username:', error);
    return {
      success: false,
      message: `Failed to register username: ${error.message}`
    };
  }
};

// Get address by username or direct wallet address
export const getAddressByUsername = async (username) => {
  try {
    // Check if the input is already a wallet address
    if (username.startsWith('0x') && username.length === 42) {
      return {
        success: true,
        address: username,
        message: `Using direct wallet address: ${username}`
      };
    }
    
    // Otherwise, look up the username in the registry
    const { publicClient } = await getViemClients();
    
    const address = await publicClient.readContract({
      address: REGISTRY_CONTRACT_ADDRESS,
      abi: UsernameRegistryABI.abi,
      functionName: 'getAddressByUsername',
      args: [username],
    });
    
    if (address === '0x0000000000000000000000000000000000000000') {
      return {
        success: false,
        message: `Username @${username} is not registered.`
      };
    }
    
    return {
      success: true,
      address,
      message: `Found address for @${username}: ${address}`
    };
  } catch (error) {
    console.error('Error getting address by username:', error);
    return {
      success: false,
      message: `Failed to get address: ${error.message}`
    };
  }
};

// Send payment by username
export const sendPaymentByUsername = async (username, amount, currency, purpose) => {
  try {
    // Support both ETH and MON (native currency on Monad Testnet)
    const supportedCurrencies = ['ETH', 'MON'];
    const normalizedCurrency = currency.toUpperCase();
    
    if (!supportedCurrencies.includes(normalizedCurrency)) {
      return {
        success: false,
        message: `Currently only ${supportedCurrencies.join(' and ')} payments are supported.`
      };
    }
    
    const { walletClient, publicClient, address } = await getViemClients();
    
    // Convert amount to wei/native token units
    const amountInWei = parseEther(amount.toString());
    
    // Get recipient address
    const recipientResult = await getAddressByUsername(username);
    if (!recipientResult.success) {
      return recipientResult; // Return the error from address lookup
    }
    
    // Send transaction
    const hash = await walletClient.writeContract({
      address: QUICKPAY_CONTRACT_ADDRESS,
      abi: QuickPayABI.abi,
      functionName: 'sendPaymentByUsername',
      args: [username, purpose || ''],
      account: address,
      value: amountInWei,
    });
    
    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // Store transaction in MongoDB
    try {
      // Get sender username if available
      let senderUsername = '';
      try {
        // This is a simplified approach - in a real app, you'd have a proper lookup
        // You might want to implement a reverse lookup function in your contract
        senderUsername = localStorage.getItem(`username_${address.toLowerCase()}`) || '';
      } catch (e) {
        console.log('Could not retrieve sender username', e);
      }
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          txHash: receipt.transactionHash,
          sender: address,
          recipient: recipientResult.address,
          senderUsername: senderUsername,
          recipientUsername: username, // This is the username parameter from the function
          amount: amount,
          currency: normalizedCurrency,
          purpose: purpose || '',
          timestamp: Date.now()
        }),
      });
      
      const data = await response.json();
      console.log('Transaction stored in MongoDB:', data);
    } catch (dbError) {
      console.error('Error storing transaction in MongoDB:', dbError);
      // Continue even if MongoDB storage fails
    }
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      message: `Successfully sent ${amount} ${normalizedCurrency} to @${username}.`,
      receipt
    };
  } catch (error) {
    console.error('Error sending payment:', error);
    return {
      success: false,
      message: `Failed to send payment: ${error.message}`
    };
  }
};

// Get current wallet address
export const getCurrentWalletAddress = async () => {
  try {
    const { address } = await getViemClients();
    return address;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    throw new Error('Failed to get wallet address.');
  }
};

// Get wallet balance
export const getWalletBalance = async () => {
  try {
    const { publicClient, address } = await getViemClients();
    const balanceInWei = await publicClient.getBalance({ address });
    const balanceInEth = formatEther(balanceInWei);
    
    return {
      success: true,
      balance: balanceInEth,
      message: `Your current balance is ${balanceInEth} ETH.`
    };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return {
      success: false,
      message: `Failed to get wallet balance: ${error.message}`
    };
  }
};
