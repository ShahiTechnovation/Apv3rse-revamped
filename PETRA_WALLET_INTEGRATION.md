# Petra Wallet Integration for Apv3rse

## Overview
Apv3rse now includes Petra wallet integration for seamless Web3 authentication on the Aptos blockchain. Users can connect their Petra wallet to interact with Aptos dApps and smart contracts built using the platform.

## Features

### 🔐 Wallet Connection
- **One-click connection** to Petra wallet
- **Auto-reconnect** on page refresh if previously connected
- **Network detection** (Mainnet, Testnet, Devnet)
- **Account switching** detection

### 🎨 UI Components
- **Wallet button** in the header with gradient styling
- **Connection status** indicator with network badge
- **Dropdown menu** with wallet options:
  - Copy address
  - View on Aptos Explorer
  - Disconnect

### 📊 State Management
- **React Context** for wallet state across the app
- **Nanostores** for persistent state management
- **Local storage** for connection persistence

## Installation Requirements

### For Users:
1. **Install Petra Wallet Extension**
   - Chrome: [Petra Wallet on Chrome Web Store](https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci)
   - Firefox: [Petra Wallet on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/petra-aptos-wallet/)
   - Edge: Available on Microsoft Edge Add-ons

2. **Create or Import Wallet**
   - Follow Petra's setup process
   - Secure your seed phrase
   - Set up password

### For Developers:
The following packages are already installed:
```json
{
  "@aptos-labs/ts-sdk": "^1.18.1",
  "@aptos-labs/wallet-adapter-react": "^2.3.3",
  "@aptos-labs/wallet-adapter-ant-design": "^2.1.2",
  "petra-plugin-wallet-adapter": "^0.4.5"
}
```

## Usage

### Connecting to Petra Wallet

1. **Click "Connect Petra"** button in the header
2. **Approve connection** in Petra popup
3. **Select network** if prompted

### Using Wallet Context in Components

```typescript
import { useWallet } from '~/lib/contexts/WalletContext';

function MyComponent() {
  const { 
    account,        // Wallet address
    isConnected,    // Connection status
    network,        // Current network
    connect,        // Connect function
    disconnect      // Disconnect function
  } = useWallet();

  // Use wallet data in your component
  if (isConnected) {
    console.log(`Connected to ${network} with address: ${account}`);
  }
}
```

### Using Wallet Store

```typescript
import { walletStore, isWalletConnected, getShortAddress } from '~/lib/stores/wallet';
import { useStore } from '@nanostores/react';

function MyComponent() {
  const walletState = useStore(walletStore);
  const connected = useStore(isWalletConnected);
  
  if (connected) {
    const shortAddress = getShortAddress(walletState.account);
    console.log(`Connected: ${shortAddress}`);
  }
}
```

## Network Configuration

The wallet automatically detects the network from Petra:
- **Mainnet**: Production network
- **Testnet**: Testing network (recommended for development)
- **Devnet**: Development network

Network is indicated by a colored badge:
- 🟢 Green: Mainnet
- 🟡 Yellow: Testnet
- 🔵 Blue: Devnet

## Security Considerations

1. **Never share your seed phrase**
2. **Verify transaction details** before signing
3. **Use testnet** for development and testing
4. **Check network** before deploying contracts
5. **Disconnect wallet** when not in use

## Troubleshooting

### Wallet Not Detected
- Ensure Petra extension is installed and enabled
- Refresh the page after installation
- Check browser permissions for the extension

### Connection Failed
- Check if Petra is unlocked
- Try disconnecting and reconnecting
- Clear browser cache and cookies
- Check network connectivity

### Network Mismatch
- Switch network in Petra wallet settings
- Ensure you're on the correct network for your dApp

## Future Enhancements

- [ ] Multi-wallet support (Martian, Pontem, etc.)
- [ ] Transaction signing interface
- [ ] Balance display
- [ ] NFT gallery integration
- [ ] Token management
- [ ] Hardware wallet support

## Support

For issues or questions:
- Petra Wallet: [https://petra.app/](https://petra.app/)
- Aptos Documentation: [https://aptos.dev/](https://aptos.dev/)
- Apv3rse Support: Open an issue in the project repository

## License

This integration is part of the Apv3rse project and follows the same MIT license.
