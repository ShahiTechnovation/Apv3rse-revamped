import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { updateWalletState, resetWalletState } from '../stores/wallet';

interface WalletContextType {
  account: string | null;
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  network: string | null;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);

  // Check for wallet on mount and listen for account changes
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.aptos) {
        try {
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            const network = await window.aptos.network();
            
            setAccount(account.address);
            setPublicKey(account.publicKey);
            setIsConnected(true);
            setNetwork(network);
            setWalletName('Petra');
            
            updateWalletState({
              account: account.address,
              publicKey: account.publicKey,
              isConnected: true,
              network: network,
            });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && window.aptos) {
      const handleAccountChange = async () => {
        try {
          if (!window.aptos) return;
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            const network = await window.aptos.network();
            
            setAccount(account.address);
            setPublicKey(account.publicKey);
            setNetwork(network);
            
            updateWalletState({
              account: account.address,
              publicKey: account.publicKey,
              network: network,
            });
            
            toast.info('Account changed');
          } else {
            // Wallet disconnected
            setAccount(null);
            setPublicKey(null);
            setIsConnected(false);
            setNetwork(null);
            setWalletName(null);
            resetWalletState();
          }
        } catch (error) {
          console.error('Error handling account change:', error);
        }
      };

      if (window.aptos?.onAccountChange) {
        window.aptos.onAccountChange(handleAccountChange);
      }
      if (window.aptos?.onNetworkChange) {
        window.aptos.onNetworkChange(handleAccountChange);
      }

      return () => {
        // Cleanup listeners if possible
        // Note: Petra doesn't provide removeListener methods yet
      };
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    console.log('Starting wallet connection...');
    
    try {
      // Check if Petra wallet is installed
      if (typeof window === 'undefined' || !window.aptos) {
        console.error('Petra wallet not found in window object');
        toast.error('Petra wallet not found! Please install it from https://petra.app/');
        window.open('https://petra.app/', '_blank');
        return;
      }

      console.log('Petra wallet detected, attempting to connect...');
      // Connect to Petra wallet
      const response = await window.aptos.connect();
      console.log('Connect response:', response);
      const account = await window.aptos.account();
      console.log('Account:', account);
      const network = await window.aptos.network();
      console.log('Network:', network);

      setAccount(account.address);
      setPublicKey(account.publicKey);
      setIsConnected(true);
      setNetwork(network);
      setWalletName('Petra');

      updateWalletState({
        account: account.address,
        publicKey: account.publicKey,
        isConnected: true,
        network: network,
      });

      toast.success('Connected to Petra wallet!');
    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      
      if (error.code === 4001) {
        toast.error('Connection request rejected');
      } else if (error.message?.includes('User rejected')) {
        toast.error('Connection request rejected by user');
      } else {
        toast.error(`Failed to connect: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      console.log('Attempting to disconnect wallet...');
      
      // Try to disconnect from Petra wallet
      if (window.aptos && typeof window.aptos.disconnect === 'function') {
        try {
          await window.aptos.disconnect();
          console.log('Called window.aptos.disconnect()');
        } catch (disconnectError) {
          // Some versions of Petra might throw an error or not support disconnect
          console.warn('Petra disconnect method failed:', disconnectError);
          // Continue with local state cleanup anyway
        }
      } else {
        console.warn('window.aptos.disconnect() not available');
      }
      
      // Always clear local state regardless of wallet's disconnect method
      setAccount(null);
      setPublicKey(null);
      setIsConnected(false);
      setNetwork(null);
      setWalletName(null);
      
      resetWalletState();
      
      console.log('Successfully disconnected - local state cleared');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      
      // Still try to clear local state even if there was an error
      setAccount(null);
      setPublicKey(null);
      setIsConnected(false);
      setNetwork(null);
      setWalletName(null);
      resetWalletState();
      
      throw error; // Re-throw to let the component handle the error
    }
  };

  const value: WalletContextType = {
    account,
    publicKey,
    isConnected,
    isConnecting,
    network,
    walletName,
    connect,
    disconnect,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Type declarations for window.aptos
declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string; publicKey: string }>;
      disconnect: () => Promise<void>;
      account: () => Promise<{ address: string; publicKey: string }>;
      isConnected: () => Promise<boolean>;
      network: () => Promise<string>;
      signAndSubmitTransaction: (transaction: any) => Promise<any>;
      signTransaction: (transaction: any) => Promise<any>;
      signMessage: (message: { message: string; nonce: string }) => Promise<any>;
      onAccountChange: (callback: () => void) => void;
      onNetworkChange: (callback: () => void) => void;
      name?: string;
    };
    martian?: any;
    pontem?: any;
  }
}
