/**
 * Aptos blockchain integration context
 * Injected into system prompts to ensure all generated apps include Aptos
 */

export const APTOS_INTEGRATION_PROMPT = `
═══════════════════════════════════════════════════════════════════════════════
🚨 MANDATORY: APTOS BLOCKCHAIN INTEGRATION REQUIRED 🚨
═══════════════════════════════════════════════════════════════════════════════

ALL applications you build MUST integrate with Aptos blockchain. This is NON-NEGOTIABLE.

## 1. REQUIRED NPM PACKAGES

Add these to package.json dependencies:
\`\`\`json
{
  "@aptos-labs/wallet-adapter-react": "^3.0.0",
  "@aptos-labs/wallet-adapter-ant-design": "^2.0.0",
  "@aptos-labs/ts-sdk": "^1.0.0",
  "petra-plugin-wallet-adapter": "^0.4.0",
  "@martianwallet/aptos-wallet-adapter": "^0.0.5"
}
\`\`\`

## 2. WALLET PROVIDER SETUP (Required in App Root)

\`\`\`tsx
// In your main App.tsx or layout component
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';

const wallets = [new PetraWallet(), new MartianWallet()];

export default function App() {
  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      {/* Your app components */}
    </AptosWalletAdapterProvider>
  );
}
\`\`\`

## 3. WALLET CONNECTION COMPONENT (Add to Navigation/Header)

\`\`\`tsx
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useEffect, useState } from 'react';

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

export function WalletConnect() {
  const { connect, disconnect, account, connected } = useWallet();
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    if (account) {
      aptos.getAccountAPTAmount({ accountAddress: account.address })
        .then(amount => setBalance((amount / 100000000).toFixed(4)));
    }
  }, [account]);

  return (
    <div className="wallet-section">
      {connected && account ? (
        <div>
          <p>Address: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
          <p>Balance: {balance} APT</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
      {!connected && (
        <p><a href="https://aptoslabs.com/testnet-faucet" target="_blank">Get Testnet APT</a></p>
      )}
    </div>
  );
}
\`\`\`

## 4. NFT MARKETPLACE SPECIFICS

### A. NFT Minting with Aptos Digital Assets (Recommended)

\`\`\`tsx
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

async function mintNFT(name: string, description: string, uri: string) {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const transaction = await aptos.transaction.build.simple({
    sender: account.address,
    data: {
      function: "0x4::aptos_token::mint",
      typeArguments: [],
      functionArguments: [
        "My Collection",  // collection name
        name,            // token name
        description,     // description
        uri,            // metadata URI
        [],             // property keys
        [],             // property types
        []              // property values
      ]
    }
  });

  const response = await signAndSubmitTransaction({ transaction });
  await aptos.waitForTransaction({ transactionHash: response.hash });
  return response.hash;
}
\`\`\`

### B. Create NFT Collection First

\`\`\`tsx
async function createCollection(name: string, description: string, uri: string) {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const transaction = await aptos.transaction.build.simple({
    sender: account.address,
    data: {
      function: "0x4::aptos_token::create_collection",
      typeArguments: [],
      functionArguments: [
        name,
        description,
        uri,
        "1000000",  // max supply
        [false, false, false]  // [mutable_description, mutable_uri, mutable_token_description]
      ]
    }
  });

  const response = await signAndSubmitTransaction({ transaction });
  await aptos.waitForTransaction({ transactionHash: response.hash });
}
\`\`\`

### C. Query User's NFTs

\`\`\`tsx
async function getUserNFTs(ownerAddress: string) {
  const tokens = await aptos.getAccountOwnedTokensFromCollectionAddress({
    accountAddress: ownerAddress,
    collectionAddress: "YOUR_COLLECTION_ADDRESS"
  });
  return tokens;
}
\`\`\`

### D. Transfer NFT

\`\`\`tsx
async function transferNFT(tokenAddress: string, recipientAddress: string) {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const transaction = await aptos.transaction.build.simple({
    sender: account.address,
    data: {
      function: "0x4::aptos_token::transfer",
      typeArguments: [],
      functionArguments: [tokenAddress, recipientAddress]
    }
  });

  const response = await signAndSubmitTransaction({ transaction });
  return response.hash;
}
\`\`\`

## 5. DEFI / TOKEN OPERATIONS

### A. Transfer APT

\`\`\`tsx
async function transferAPT(recipientAddress: string, amount: number) {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const transaction = await aptos.transaction.build.simple({
    sender: account.address,
    data: {
      function: "0x1::aptos_account::transfer",
      functionArguments: [recipientAddress, amount * 100000000] // Convert to Octas
    }
  });

  const response = await signAndSubmitTransaction({ transaction });
  return response.hash;
}
\`\`\`

### B. Check Token Balance

\`\`\`tsx
async function getTokenBalance(accountAddress: string, tokenType: string) {
  const balance = await aptos.getAccountResource({
    accountAddress,
    resourceType: \`0x1::coin::CoinStore<\${tokenType}>\`
  });
  return balance;
}
\`\`\`

## 6. MOVE SMART CONTRACT EXAMPLE (For Advanced Features)

If your app needs custom smart contracts, include a Move module:

\`\`\`move
// sources/marketplace.move
module marketplace_addr::nft_marketplace {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    
    struct Listing has key {
        token_id: address,
        price: u64,
        seller: address
    }
    
    public entry fun list_nft(
        seller: &signer,
        token_id: address,
        price: u64
    ) {
        let listing = Listing {
            token_id,
            price,
            seller: signer::address_of(seller)
        };
        move_to(seller, listing);
    }
    
    public entry fun buy_nft(
        buyer: &signer,
        seller_address: address
    ) acquires Listing {
        let listing = move_from<Listing>(seller_address);
        
        // Transfer payment
        coin::transfer<AptosCoin>(buyer, listing.seller, listing.price);
        
        // Transfer NFT (simplified - actual implementation needs more logic)
        // ...
    }
}
\`\`\`

Include deployment instructions in README:
\`\`\`bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Initialize Aptos account
aptos init --network testnet

# Compile Move module
aptos move compile

# Publish to testnet
aptos move publish --named-addresses marketplace_addr=default
\`\`\`

## 7. ERROR HANDLING & BEST PRACTICES

\`\`\`tsx
// Always wrap transactions in try-catch
async function safeTransaction() {
  try {
    const response = await signAndSubmitTransaction({ transaction });
    const result = await aptos.waitForTransaction({ 
      transactionHash: response.hash 
    });
    
    if (result.success) {
      console.log('Transaction successful:', response.hash);
    } else {
      console.error('Transaction failed:', result.vm_status);
    }
  } catch (error) {
    console.error('Transaction error:', error);
    // Show user-friendly error message
  }
}
\`\`\`

## 8. UI/UX REQUIREMENTS

EVERY application MUST display:
1. ✅ Wallet connect/disconnect button (prominent in header)
2. ✅ Connected wallet address (truncated)
3. ✅ APT balance when connected
4. ✅ Link to testnet faucet for new users
5. ✅ Transaction status/loading indicators
6. ✅ Error messages for failed transactions

## 9. NETWORK CONFIGURATION

Use TESTNET for all demos:
\`\`\`tsx
const config = new AptosConfig({ network: Network.TESTNET });
// Endpoints:
// - REST: https://fullnode.testnet.aptoslabs.com/v1
// - Indexer: https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql
// - Faucet: https://faucet.testnet.aptoslabs.com
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
⚠️  REMINDER: Aptos integration is MANDATORY for ALL applications.
Include wallet connectivity even for simple landing pages or dashboards.
═══════════════════════════════════════════════════════════════════════════════
`;
