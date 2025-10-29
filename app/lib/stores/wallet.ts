import { atom, map } from 'nanostores';
import { logStore } from './logs';

export interface WalletState {
  account: string | null;
  publicKey: string | null;
  isConnected: boolean;
  network: string | null;
  balance: string | null;
  lastConnectionTime: number | null;
}

// Create a persistent store for wallet state
export const walletStore = map<WalletState>({
  account: null,
  publicKey: null,
  isConnected: false,
  network: null,
  balance: null,
  lastConnectionTime: null,
});

// Helper atoms for specific wallet properties
export const isWalletConnected = atom<boolean>(false);
export const walletAddress = atom<string | null>(null);
export const walletNetwork = atom<string | null>(null);

// Subscribe to wallet store changes and update atoms
walletStore.subscribe((state) => {
  isWalletConnected.set(state.isConnected);
  walletAddress.set(state.account);
  walletNetwork.set(state.network);
  
  // Log wallet state changes
  if (state.isConnected) {
    logStore.logSystem('Wallet connected', {
      address: state.account,
      network: state.network,
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper functions for wallet operations
export const updateWalletState = (updates: Partial<WalletState>) => {
  const currentState = walletStore.get();
  walletStore.set({ ...currentState, ...updates });
};

export const resetWalletState = () => {
  walletStore.set({
    account: null,
    publicKey: null,
    isConnected: false,
    network: null,
    balance: null,
    lastConnectionTime: null,
  });
  
  logStore.logSystem('Wallet disconnected', {
    timestamp: new Date().toISOString(),
  });
};

export const setWalletConnection = (
  account: string,
  publicKey: string,
  network: string
) => {
  updateWalletState({
    account,
    publicKey,
    network,
    isConnected: true,
    lastConnectionTime: Date.now(),
  });
};

// Function to check if wallet is on the correct network
export const isCorrectNetwork = (expectedNetwork: 'mainnet' | 'testnet' | 'devnet' = 'testnet'): boolean => {
  const state = walletStore.get();
  if (!state.network) return false;
  return state.network.toLowerCase().includes(expectedNetwork);
};

// Function to get shortened wallet address
export const getShortAddress = (address?: string | null): string => {
  if (!address) {
    const state = walletStore.get();
    address = state.account;
  }
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
