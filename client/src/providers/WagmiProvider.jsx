"use client";
import { createConfig, http } from 'wagmi';
import { WagmiProvider as WagmiProviderCore } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { metaMask } from 'wagmi/connectors';
import { defineChain } from 'viem';

// Define Monad Testnet
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com/' },
  },
});

// Create config
const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    metaMask(),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
});

// Create a client for TanStack Query
const queryClient = new QueryClient();

// Wagmi provider component
export function WagmiProvider({ children }) {
  return (
    <WagmiProviderCore config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderCore>
  );
}

export default WagmiProvider;