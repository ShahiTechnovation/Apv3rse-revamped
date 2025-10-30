# Aptos Wallet Connection SDK - Best Setup Guide

## 🚀 Installed Packages (Best-in-Class)

Your project now includes the **official Aptos Wallet Adapter** ecosystem - the industry-standard solution for multi-wallet support:

### Core Packages
```json
{
  "@aptos-labs/wallet-adapter-core": "^7.6.0",      // Essential core library
  "@aptos-labs/wallet-adapter-react": "^3.8.0",     // React hooks & context
  "@aptos-labs/wallet-adapter-ant-design": "^2.6.3", // UI components
  "@aptos-labs/ts-sdk": "^5.1.1"                    // Latest Aptos SDK
}
```

### Supported Wallets
```json
{
  "petra-plugin-wallet-adapter": "^0.4.5",          // Petra Wallet (Most Popular)
  "@martianwallet/aptos-wallet-adapter": "^0.0.5",  // Martian Wallet
  "@pontem/wallet-adapter-plugin": "^0.2.1",        // Pontem Wallet
  "@msafe/aptos-wallet-adapter": "^1.1.8"           // MSafe Multisig Wallet
}
```

---

## 🎯 Why This Setup is Best-in-Class

1. **Official Aptos Foundation SDK** - Maintained by the core Aptos team
2. **Multi-Wallet Support** - Works with Petra, Martian, Pontem, MSafe, and more
3. **Auto-Discovery** - Automatically detects installed wallets
4. **React Optimized** - Built-in hooks and context providers
5. **TypeScript First** - Full type safety and IntelliSense
6. **Network Management** - Mainnet, Testnet, Devnet support
7. **Auto-Reconnect** - Persistent wallet connections
8. **Transaction Signing** - Standardized signing interface

---

## 📦 Quick Start: Provider Setup

### 1. Create Wallet Provider Wrapper

```typescript
// app/components/aptos/WalletProvider.tsx
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { PontemWallet } from '@pontem/wallet-adapter-plugin';
import { MSafeWalletAdapter } from '@msafe/aptos-wallet-adapter';
import { Network } from '@aptos-labs/ts-sdk';

const wallets = [
  new PetraWallet(),
  new MartianWallet(),
  new PontemWallet(),
  new MSafeWalletAdapter()
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      optInWallets={['Petra', 'Martian', 'Pontem', 'MSafe']}
      dappConfig={{
        network: Network.TESTNET, // or MAINNET, DEVNET
        mizuwallet: {
          manifestURL: 'https://your-domain.com/manifest.json' // Optional
        }
      }}
      onError={(error) => {
        console.error('Wallet adapter error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
```

### 2. Wrap Your App

```typescript
// app/root.tsx
import { WalletProvider } from '~/components/aptos/WalletProvider';

export default function App() {
  return (
    <WalletProvider>
      {/* Your app components */}
    </WalletProvider>
  );
}
```

---

## 🎨 Using Wallet Hooks

### Basic Connection

```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

function ConnectButton() {
  const { 
    connected,
    account,
    network,
    wallet,
    connect,
    disconnect,
    signAndSubmitTransaction,
    signMessage
  } = useWallet();

  if (connected) {
    return (
      <div>
        <p>Connected: {account?.address}</p>
        <p>Network: {network?.name}</p>
        <p>Wallet: {wallet?.name}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return <button onClick={connect}>Connect Wallet</button>;
}
```

### Multi-Wallet Selector

```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

function WalletSelector() {
  const { wallets, connect } = useWallet();

  return (
    <div className="wallet-grid">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => connect(wallet.name)}
          disabled={!wallet.readyState}
        >
          <img src={wallet.icon} alt={wallet.name} />
          <span>{wallet.name}</span>
          {!wallet.readyState && <span>(Not Installed)</span>}
        </button>
      ))}
    </div>
  );
}
```

---

## 💳 Transaction Signing Examples

### Simple Transaction

```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

function TransferAPT() {
  const { signAndSubmitTransaction } = useWallet();

  const handleTransfer = async () => {
    try {
      const response = await signAndSubmitTransaction({
        sender: account?.address,
        data: {
          function: '0x1::coin::transfer',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [
            '0x742d35cc6634c0532925a3b844bc9e7bd6db5c3c3b9f8f9f8f5f5f5f5f5f5f5', // recipient
            100000000 // 1 APT (8 decimals)
          ]
        }
      });

      console.log('Transaction hash:', response.hash);
      
      // Wait for transaction confirmation
      const aptosConfig = new AptosConfig({ network: Network.TESTNET });
      const aptos = new Aptos(aptosConfig);
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      console.log('Transaction confirmed!');
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return <button onClick={handleTransfer}>Send 1 APT</button>;
}
```

### Smart Contract Interaction

```typescript
async function mintNFT() {
  const { signAndSubmitTransaction } = useWallet();

  const transaction = await signAndSubmitTransaction({
    sender: account?.address,
    data: {
      function: '0x_YOUR_MODULE_ADDRESS::nft_minting::mint_nft',
      typeArguments: [],
      functionArguments: [
        'My NFT Name',
        'Description of my NFT',
        'ipfs://QmXXXXXXXXXXXXXXXX' // IPFS URI
      ]
    }
  });

  return transaction;
}
```

### Sign Message (Authentication)

```typescript
async function authenticateWithSignature() {
  const { signMessage, account } = useWallet();

  const message = 'Sign this message to authenticate with Apv3rse';
  const nonce = Date.now().toString();

  const response = await signMessage({
    message,
    nonce
  });

  // Send to backend for verification
  await fetch('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({
      address: account?.address,
      signature: response.signature,
      message,
      nonce
    })
  });
}
```

---

## 🎭 UI Components (Ant Design)

The `@aptos-labs/wallet-adapter-ant-design` package provides pre-built components:

```typescript
import { 
  WalletSelector,
  WalletReadyState,
  WalletName
} from '@aptos-labs/wallet-adapter-ant-design';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

function Header() {
  return (
    <header>
      <h1>My dApp</h1>
      <WalletSelector />
    </header>
  );
}
```

---

## 🌐 Network Configuration

```typescript
import { Network, NetworkToNetworkName } from '@aptos-labs/ts-sdk';

const NETWORK_CONFIG = {
  [Network.MAINNET]: {
    name: 'Mainnet',
    chainId: 1,
    url: 'https://fullnode.mainnet.aptoslabs.com/v1'
  },
  [Network.TESTNET]: {
    name: 'Testnet',
    chainId: 2,
    url: 'https://fullnode.testnet.aptoslabs.com/v1'
  },
  [Network.DEVNET]: {
    name: 'Devnet',
    chainId: 34,
    url: 'https://fullnode.devnet.aptoslabs.com/v1'
  }
};

// Switch network in provider
<AptosWalletAdapterProvider
  plugins={wallets}
  dappConfig={{
    network: Network.MAINNET // Change as needed
  }}
>
  {children}
</AptosWalletAdapterProvider>
```

---

## 🔐 Security Best Practices

### 1. Always Validate Transactions

```typescript
const response = await signAndSubmitTransaction({
  sender: account?.address,
  data: {
    function: moduleAddress + '::' + functionName,
    typeArguments: [],
    functionArguments: args
  }
});

// Always wait for confirmation
const aptos = new Aptos(config);
const committedTxn = await aptos.waitForTransaction({
  transactionHash: response.hash
});

if (!committedTxn.success) {
  throw new Error('Transaction failed: ' + committedTxn.vm_status);
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  await signAndSubmitTransaction(payload);
} catch (error: any) {
  if (error.code === 4001) {
    // User rejected transaction
    console.log('Transaction cancelled by user');
  } else if (error.code === -32603) {
    // Internal error
    console.error('Wallet error:', error.message);
  } else {
    // Other errors
    console.error('Unexpected error:', error);
  }
}
```

### 3. Verify Wallet Connection

```typescript
useEffect(() => {
  if (connected && account) {
    // Verify the account address format
    if (!/^0x[a-fA-F0-9]{64}$/.test(account.address)) {
      console.error('Invalid wallet address format');
      disconnect();
    }
  }
}, [connected, account]);
```

---

## 🧪 Testing Your Integration

### Test on Testnet First

```typescript
// Always use testnet for development
const config = new AptosConfig({ 
  network: Network.TESTNET 
});

// Get testnet tokens from faucet
async function fundAccount(address: string) {
  const aptos = new Aptos(config);
  await aptos.fundAccount({
    accountAddress: address,
    amount: 100_000_000 // 1 APT
  });
}
```

### Wallet Detection Test

```typescript
function WalletDebugger() {
  const { wallets } = useWallet();

  return (
    <div>
      <h3>Available Wallets:</h3>
      {wallets.map((wallet) => (
        <div key={wallet.name}>
          <p>Name: {wallet.name}</p>
          <p>Ready: {wallet.readyState}</p>
          <p>URL: {wallet.url}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Feature Comparison

| Feature | Petra | Martian | Pontem | MSafe |
|---------|-------|---------|---------|-------|
| Basic Transactions | ✅ | ✅ | ✅ | ✅ |
| NFT Support | ✅ | ✅ | ✅ | ✅ |
| Token Swaps | ✅ | ✅ | ✅ | ❌ |
| Multisig | ❌ | ❌ | ❌ | ✅ |
| Mobile Support | ✅ | ✅ | ✅ | ✅ |
| Hardware Wallet | ✅ | ❌ | ✅ | ✅ |
| WalletConnect | ✅ | ✅ | ✅ | ✅ |

---

## 🔄 Migration from Old Setup

If you're upgrading from an older wallet integration:

1. **Remove old packages** (if any):
   ```bash
   pnpm remove aptos @aptos-labs/wallet-adapter-plugin-wallets
   ```

2. **Update imports**:
   ```typescript
   // Old
   import { useWallet } from '~/lib/contexts/WalletContext';

   // New
   import { useWallet } from '@aptos-labs/wallet-adapter-react';
   ```

3. **Update transaction signing**:
   ```typescript
   // Old
   const txn = await window.aptos.signAndSubmitTransaction(payload);

   // New
   const txn = await signAndSubmitTransaction({ data: payload });
   ```

---

## 📚 Additional Resources

- **Official Docs**: https://aptos.dev/integration/wallet-adapter-concept
- **GitHub**: https://github.com/aptos-labs/aptos-wallet-adapter
- **Petra Wallet**: https://petra.app/
- **Martian Wallet**: https://martianwallet.xyz/
- **Pontem Wallet**: https://pontem.network/
- **MSafe**: https://msafe.io/

---

## 🆘 Troubleshooting

### Wallet Not Detected
```typescript
// Check if wallet extension is installed
const isPetraInstalled = 'aptos' in window;
console.log('Petra installed:', isPetraInstalled);
```

### Connection Issues
```typescript
// Clear local storage and reconnect
localStorage.removeItem('AptosWalletName');
window.location.reload();
```

### Transaction Failures
```typescript
// Check gas and balance
const aptos = new Aptos(config);
const resources = await aptos.getAccountResources({
  accountAddress: account.address
});
console.log('Account resources:', resources);
```

---

## ✅ Next Steps

1. ✅ Packages installed successfully
2. 🔧 Set up `WalletProvider` in your app
3. 🎨 Add wallet connection UI to header
4. 🧪 Test on Testnet
5. 🚀 Build your dApp features
6. 📱 Test with multiple wallets
7. 🌐 Deploy to production

---

**Congratulations! You now have the best Aptos wallet connection setup available.** 🎉
