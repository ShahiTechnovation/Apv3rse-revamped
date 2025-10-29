import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { setWalletConnection, resetWalletState, updateWalletState } from '~/lib/stores/wallet';

// Petra wallet types
interface AptosWindow extends Window {
  aptos?: {
    connect: () => Promise<{ address: string; publicKey: string }>;
    disconnect: () => Promise<void>;
    account: () => Promise<{ address: string; publicKey: string }>;
    isConnected: () => Promise<boolean>;
    network: () => Promise<string>;
    signAndSubmitTransaction: (transaction: any) => Promise<any>;
    signMessage: (message: { message: string; nonce: string }) => Promise<any>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
  };
}

interface WalletContextType {
  account: string | null;
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  network: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<void>;
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

  const getAptosWallet = () => {
    if (typeof window !== 'undefined') {
      return (window as AptosWindow).aptos;
    }
    return undefined;
  };

  const checkConnection = async () => {
    try {
      const wallet = getAptosWallet();
      if (!wallet) {
        return;
      }

      const connected = await wallet.isConnected();
      if (connected) {
        const accountData = await wallet.account();
        const networkData = await wallet.network();
        
        setAccount(accountData.address);
        setPublicKey(accountData.publicKey);
        setIsConnected(true);
        setNetwork(networkData);
        
        // Update wallet store
        updateWalletState({
          account: accountData.address,
          publicKey: accountData.publicKey,
          isConnected: true,
          network: networkData,
        });
      } else {
        setAccount(null);
        setPublicKey(null);
        setIsConnected(false);
        setNetwork(null);
        
        // Reset wallet store
        resetWalletState();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setIsConnected(false);
    }
  };

  const connect = async () => {
    try {
      setIsConnecting(true);
      const wallet = getAptosWallet();
      
      if (!wallet) {
        toast.error('Petra wallet not found! Please install Petra wallet extension.');
        window.open('https://petra.app/', '_blank');
        return;
      }

      const response = await wallet.connect();
      const networkData = await wallet.network();
      
      setAccount(response.address);
      setPublicKey(response.publicKey);
      setIsConnected(true);
      setNetwork(networkData);
      
      // Update wallet store
      setWalletConnection(response.address, response.publicKey, networkData);
      
      toast.success(`Connected to Petra wallet!`);
      
      // Store connection state
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletConnected', 'true');
      }
    } catch (error: any) {
      console.error('Error connecting to Petra wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection request rejected');
      } else {
        toast.error('Failed to connect to Petra wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const wallet = getAptosWallet();
      if (wallet) {
        await wallet.disconnect();
      }
      
      setAccount(null);
      setPublicKey(null);
      setIsConnected(false);
      setNetwork(null);
      
      // Reset wallet store
      resetWalletState();
      
      toast.info('Disconnected from wallet');
      
      // Clear connection state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletConnected');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  // Set up event listeners for account changes
  useEffect(() => {
    const wallet = getAptosWallet();
    if (!wallet) return;

    const handleAccountChange = async () => {
      await checkConnection();
    };

    const handleNetworkChange = async () => {
      await checkConnection();
    };

    const handleDisconnect = () => {
      setAccount(null);
      setPublicKey(null);
      setIsConnected(false);
      setNetwork(null);
    };

    // Add event listeners
    wallet.on('accountChange', handleAccountChange);
    wallet.on('networkChange', handleNetworkChange);
    wallet.on('disconnect', handleDisconnect);

    // Check initial connection
    checkConnection();

    // Auto-reconnect if previously connected
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true') {
      checkConnection();
    }

    // Cleanup
    return () => {
      wallet.off('accountChange', handleAccountChange);
      wallet.off('networkChange', handleNetworkChange);
      wallet.off('disconnect', handleDisconnect);
    };
  }, []);

  const value: WalletContextType = {
    account,
    publicKey,
    isConnected,
    isConnecting,
    network,
    connect,
    disconnect,
    checkConnection,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
