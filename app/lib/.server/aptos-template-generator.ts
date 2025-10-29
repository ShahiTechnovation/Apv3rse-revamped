/**
 * Aptos Template Generator
 * Generates complete Aptos dApp projects using create-aptos-dapp patterns
 * Uses llms.txt context to create production-ready templates
 */

import { getAptosContextService } from './aptos-context-service';
import { getAptosPromptEnhancer } from './aptos-prompt-enhancer';

export interface ProjectTemplate {
  name: string;
  description: string;
  files: FileTemplate[];
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  moveModules?: MoveModule[];
}

export interface FileTemplate {
  path: string;
  content: string;
  type: 'move' | 'typescript' | 'json' | 'markdown' | 'config';
}

export interface MoveModule {
  name: string;
  path: string;
  content: string;
  dependencies: string[];
  deploymentInfo?: {
    network: 'devnet' | 'testnet' | 'mainnet';
    namedAddresses?: Record<string, string>;
  };
}

export interface GenerationRequest {
  prompt: string;
  projectType: 'nft' | 'token' | 'defi' | 'game' | 'custom';
  includeUI?: boolean;
  includeDeploy?: boolean;
  network?: 'devnet' | 'testnet' | 'mainnet';
}

export interface GenerationResult {
  success: boolean;
  template?: ProjectTemplate;
  error?: string;
  contextUsed?: string;
  deploymentReady?: boolean;
}

/**
 * Templates based on create-aptos-dapp patterns
 */
const BASE_TEMPLATES: Record<string, { moveTemplate: string; frontendTemplate: string }> = {
  nft: {
    moveTemplate: `
module {{address}}::{{module_name}} {
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use aptos_std::smart_table::{Self, SmartTable};
    
    struct NFTCollection has key {
        collection: Object<collection::Collection>,
        minted: u64,
        max_supply: u64,
        base_uri: String,
        minters: SmartTable<address, bool>,
    }
    
    struct NFTMetadata has key, store {
        name: String,
        description: String,
        uri: String,
        attributes: vector<Attribute>,
    }
    
    struct Attribute has store, drop, copy {
        trait_type: String,
        value: String,
    }
    
    // Initialize collection
    public entry fun init_collection(
        creator: &signer,
        name: String,
        description: String,
        uri: String,
        max_supply: u64,
    ) {
        // Collection creation logic
    }
    
    // Mint NFT
    public entry fun mint_nft(
        minter: &signer,
        to: address,
        name: String,
        description: String,
        uri: String,
    ) {
        // Minting logic
    }
}`,
    frontendTemplate: `
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.{{network}} });
const aptos = new Aptos(config);

export function NFTMinter() {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const mintNFT = async () => {
    if (!account) return;
    
    const transaction = {
      data: {
        function: "{{address}}::{{module_name}}::mint_nft",
        functionArguments: [
          account.address,
          "NFT Name",
          "NFT Description",
          "ipfs://..."
        ],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      console.log("NFT minted:", response);
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };
  
  return (
    <button onClick={mintNFT}>Mint NFT</button>
  );
}`,
  },
  
  token: {
    moveTemplate: `
module {{address}}::{{module_name}} {
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use std::string::String;
    use std::signer;
    
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }
    
    const ASSET_SYMBOL: vector<u8> = b"{{symbol}}";
    
    // Initialize the token
    public entry fun init_module(admin: &signer) {
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
        
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            {{max_supply}},
            {{name}},
            {{symbol}},
            {{decimals}},
            {{icon_uri}},
            {{project_uri}},
        );
        
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        
        move_to(admin, ManagedFungibleAsset { mint_ref, transfer_ref, burn_ref });
    }
    
    // Mint tokens
    public entry fun mint(admin: &signer, to: address, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let managed_fungible_asset = borrow_global<ManagedFungibleAsset>(signer::address_of(admin));
        let to_wallet = primary_fungible_store::ensure_primary_store_exists(to, asset);
        fungible_asset::mint(&managed_fungible_asset.mint_ref, amount, to_wallet);
    }
    
    // Transfer tokens
    public entry fun transfer(from: &signer, to: address, amount: u64) {
        let asset = get_metadata();
        primary_fungible_store::transfer(from, asset, to, amount);
    }
    
    // Burn tokens
    public entry fun burn(from: &signer, amount: u64) acquires ManagedFungibleAsset {
        let asset = get_metadata();
        let burn_ref = &borrow_global<ManagedFungibleAsset>(@{{address}}).burn_ref;
        primary_fungible_store::burn(burn_ref, from, amount);
    }
    
    inline fun get_metadata(): Object<Metadata> {
        object::address_to_object(@{{address}})
    }
}`,
    frontendTemplate: `
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useState } from "react";

const config = new AptosConfig({ network: Network.{{network}} });
const aptos = new Aptos(config);

export function TokenManager() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  
  const mintTokens = async () => {
    if (!account) return;
    
    const transaction = {
      data: {
        function: "{{address}}::{{module_name}}::mint",
        functionArguments: [recipient, amount],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      console.log("Tokens minted:", response);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  };
  
  const transferTokens = async () => {
    if (!account) return;
    
    const transaction = {
      data: {
        function: "{{address}}::{{module_name}}::transfer",
        functionArguments: [recipient, amount],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      console.log("Tokens transferred:", response);
    } catch (error) {
      console.error("Error transferring tokens:", error);
    }
  };
  
  return (
    <div>
      <input 
        type="text" 
        placeholder="Recipient Address" 
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input 
        type="number" 
        placeholder="Amount" 
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={mintTokens}>Mint</button>
      <button onClick={transferTokens}>Transfer</button>
    </div>
  );
}`,
  },
  
  defi: {
    moveTemplate: `
module {{address}}::{{module_name}} {
    use aptos_framework::fungible_asset::{Self, FungibleAsset};
    use aptos_framework::object::{Self, Object};
    use std::signer;
    
    struct LiquidityPool has key {
        token_a: Object<FungibleAsset>,
        token_b: Object<FungibleAsset>,
        reserve_a: u64,
        reserve_b: u64,
        total_shares: u64,
    }
    
    public entry fun create_pool(
        creator: &signer,
        token_a: Object<FungibleAsset>,
        token_b: Object<FungibleAsset>,
    ) {
        // Pool creation logic
    }
    
    public entry fun add_liquidity(
        provider: &signer,
        amount_a: u64,
        amount_b: u64,
    ) {
        // Add liquidity logic
    }
    
    public entry fun swap(
        trader: &signer,
        token_in: Object<FungibleAsset>,
        amount_in: u64,
        min_amount_out: u64,
    ) {
        // Swap logic
    }
}`,
    frontendTemplate: `
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.{{network}} });
const aptos = new Aptos(config);

export function DeFiSwap() {
  const { account, signAndSubmitTransaction } = useWallet();
  
  const swap = async (tokenIn: string, amountIn: number, minAmountOut: number) => {
    if (!account) return;
    
    const transaction = {
      data: {
        function: "{{address}}::{{module_name}}::swap",
        functionArguments: [tokenIn, amountIn, minAmountOut],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      console.log("Swap executed:", response);
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };
  
  return (
    <div>
      <h2>DeFi Swap</h2>
      <button onClick={() => swap("0x1::token_a", 100, 95)}>
        Swap Tokens
      </button>
    </div>
  );
}`,
  },
  
  game: {
    moveTemplate: `
module {{address}}::{{module_name}} {
    use std::string::{Self, String};
    use std::signer;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    
    struct GameState has key {
        players: Table<address, Player>,
        total_players: u64,
        high_score: u64,
    }
    
    struct Player has store {
        name: String,
        score: u64,
        level: u64,
        last_played: u64,
    }
    
    public entry fun register_player(
        player: &signer,
        name: String,
    ) {
        // Player registration logic
    }
    
    public entry fun update_score(
        player: &signer,
        new_score: u64,
    ) {
        // Score update logic
    }
    
    public entry fun level_up(
        player: &signer,
    ) {
        // Level up logic
    }
}`,
    frontendTemplate: `
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useState } from "react";

const config = new AptosConfig({ network: Network.{{network}} });
const aptos = new Aptos(config);

export function GameInterface() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [playerName, setPlayerName] = useState("");
  const [score, setScore] = useState(0);
  
  const registerPlayer = async () => {
    if (!account || !playerName) return;
    
    const transaction = {
      data: {
        function: "{{address}}::{{module_name}}::register_player",
        functionArguments: [playerName],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      console.log("Player registered:", response);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };
  
  const updateScore = async (newScore: number) => {
    if (!account) return;
    
    const transaction = {
      data: {
        function: "{{address}}::{{module_name}}::update_score",
        functionArguments: [newScore],
      },
    };
    
    try {
      const response = await signAndSubmitTransaction(transaction);
      console.log("Score updated:", response);
      setScore(newScore);
    } catch (error) {
      console.error("Score update failed:", error);
    }
  };
  
  return (
    <div>
      <h2>Game Interface</h2>
      <input 
        type="text" 
        placeholder="Player Name" 
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button onClick={registerPlayer}>Register</button>
      <div>Score: {score}</div>
      <button onClick={() => updateScore(score + 10)}>+10 Points</button>
    </div>
  );
}`,
  },
};

class AptosTemplateGenerator {
  private contextService: Awaited<ReturnType<typeof getAptosContextService>> | null = null;
  private promptEnhancer: Awaited<ReturnType<typeof getAptosPromptEnhancer>> | null = null;

  async initialize(): Promise<void> {
    this.contextService = await getAptosContextService();
    this.promptEnhancer = await getAptosPromptEnhancer();
  }

  /**
   * Generate a complete Aptos project from a prompt
   */
  async generateProject(request: GenerationRequest): Promise<GenerationResult> {
    try {
      await this.initialize();

      // Get relevant context from llms.txt
      const context = await this.contextService!.getRelevantContext(request.prompt);
      
      // Enhance the prompt with Aptos context
      const enhanced = await this.promptEnhancer!.enhancePrompt(request.prompt, true);

      // Generate project based on type
      const template = await this.createProjectTemplate(request, context);

      return {
        success: true,
        template,
        contextUsed: enhanced.contextSource,
        deploymentReady: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a complete project template
   */
  private async createProjectTemplate(
    request: GenerationRequest,
    context: string
  ): Promise<ProjectTemplate> {
    const projectName = this.extractProjectName(request.prompt);
    const moduleName = this.sanitizeModuleName(projectName);
    const address = '0x1'; // Default to 0x1, will be replaced during deployment

    // Select base template
    const baseTemplate = BASE_TEMPLATES[request.projectType === 'custom' ? 'nft' : request.projectType];

    // Generate Move module
    const moveContent = this.processTemplate(baseTemplate.moveTemplate, {
      address,
      module_name: moduleName,
      network: request.network || 'devnet',
      symbol: moduleName.toUpperCase(),
      name: `"${projectName}"`,
      decimals: '8',
      max_supply: 'option::some(1000000000)',
      icon_uri: `"https://raw.githubusercontent.com/aptos-labs/aptos-core/main/ecosystem/typescript/sdk/src/tests/unit/test_data/nft.png"`,
      project_uri: `"https://aptos.dev"`,
    });

    // Generate frontend if requested
    const frontendContent = request.includeUI
      ? this.processTemplate(baseTemplate.frontendTemplate, {
          address,
          module_name: moduleName,
          network: request.network || 'devnet',
        })
      : '';

    const files: FileTemplate[] = [
      {
        path: `move/sources/${moduleName}.move`,
        content: moveContent,
        type: 'move',
      },
      {
        path: 'Move.toml',
        content: this.generateMoveToml(projectName, address),
        type: 'config',
      },
      {
        path: '.aptos/config.yaml',
        content: this.generateAptosConfig(request.network || 'devnet'),
        type: 'config',
      },
    ];

    if (request.includeUI) {
      files.push(
        {
          path: `frontend/src/components/${moduleName}.tsx`,
          content: frontendContent,
          type: 'typescript',
        },
        {
          path: 'frontend/package.json',
          content: this.generatePackageJson(projectName),
          type: 'json',
        },
        {
          path: 'frontend/src/App.tsx',
          content: this.generateAppTsx(moduleName),
          type: 'typescript',
        }
      );
    }

    // Add deployment script
    if (request.includeDeploy) {
      files.push({
        path: 'scripts/deploy.ts',
        content: this.generateDeployScript(moduleName, request.network || 'devnet'),
        type: 'typescript',
      });
    }

    // Add README
    files.push({
      path: 'README.md',
      content: this.generateReadme(projectName, moduleName, request),
      type: 'markdown',
    });

    return {
      name: projectName,
      description: `Aptos ${request.projectType} project generated from: ${request.prompt}`,
      files,
      dependencies: {
        '@aptos-labs/ts-sdk': '^1.18.1',
        '@aptos-labs/wallet-adapter-react': '^2.3.3',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'typescript': '^5.0.0',
      },
      scripts: {
        'build:move': 'aptos move compile',
        'test:move': 'aptos move test',
        'deploy': 'tsx scripts/deploy.ts',
        'dev': 'vite',
        'build': 'vite build',
      },
      moveModules: [
        {
          name: moduleName,
          path: `move/sources/${moduleName}.move`,
          content: moveContent,
          dependencies: [],
          deploymentInfo: {
            network: request.network || 'devnet',
            namedAddresses: {
              [projectName]: address,
            },
          },
        },
      ],
    };
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processed.trim();
  }

  /**
   * Generate Move.toml configuration
   */
  private generateMoveToml(projectName: string, address: string): string {
    return `[package]
name = "${projectName}"
version = "1.0.0"
authors = []

[addresses]
${projectName} = "${address}"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "mainnet" }
AptosStdlib = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-stdlib", rev = "mainnet" }
AptosTokenObjects = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-token-objects", rev = "mainnet" }`;
  }

  /**
   * Generate Aptos configuration
   */
  private generateAptosConfig(network: string): string {
    return `---
profiles:
  default:
    network: ${network}
    rest_url: "https://fullnode.${network}.aptoslabs.com"
    faucet_url: "https://faucet.${network}.aptoslabs.com"`;
  }

  /**
   * Generate package.json for frontend
   */
  private generatePackageJson(projectName: string): string {
    return JSON.stringify(
      {
        name: `${projectName}-frontend`,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          '@aptos-labs/ts-sdk': '^1.18.1',
          '@aptos-labs/wallet-adapter-react': '^2.3.3',
          '@aptos-labs/wallet-adapter-ant-design': '^2.1.2',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0',
          'typescript': '^5.0.0',
          'vite': '^4.3.0',
        },
      },
      null,
      2
    );
  }

  /**
   * Generate App.tsx
   */
  private generateAppTsx(moduleName: string): string {
    return `import { WalletProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { ${moduleName} } from "./components/${moduleName}";

const wallets = [new PetraWallet()];

function App() {
  return (
    <WalletProvider wallets={wallets} autoConnect={true}>
      <div className="App">
        <h1>${moduleName} dApp</h1>
        <${moduleName} />
      </div>
    </WalletProvider>
  );
}

export default App;`;
  }

  /**
   * Generate deployment script
   */
  private generateDeployScript(moduleName: string, network: string): string {
    return `import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import * as fs from "fs";
import * as path from "path";

const config = new AptosConfig({ network: Network.${network.toUpperCase()} });
const aptos = new Aptos(config);

async function deployContract() {
  try {
    // Load private key from environment or generate new account
    const privateKey = process.env.APTOS_PRIVATE_KEY 
      ? new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY)
      : Ed25519PrivateKey.generate();
    
    const account = Account.fromPrivateKey({ privateKey });
    
    console.log("Deploying from account:", account.accountAddress.toString());
    
    // Fund account if on devnet
    if ("${network}" === "devnet") {
      await aptos.fundAccount({
        accountAddress: account.accountAddress,
        amount: 100_000_000, // 1 APT
      });
      console.log("Account funded");
    }
    
    // Read compiled module
    const modulePath = path.join(__dirname, "../move/build/${moduleName}/bytecode_modules/${moduleName}.mv");
    const moduleHex = fs.readFileSync(modulePath).toString("hex");
    
    // Deploy module
    const transaction = await aptos.publishPackageTransaction({
      account: account.accountAddress,
      metadataBytes: "0x",
      moduleBytecode: [moduleHex],
    });
    
    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });
    
    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });
    
    console.log("Module deployed successfully!");
    console.log("Transaction hash:", response.hash);
    console.log("Module address:", account.accountAddress.toString());
    
    // Save deployment info
    const deploymentInfo = {
      network: "${network}",
      moduleAddress: account.accountAddress.toString(),
      transactionHash: response.hash,
      timestamp: new Date().toISOString(),
    };
    
    fs.writeFileSync(
      path.join(__dirname, "../deployment.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("Deployment info saved to deployment.json");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

deployContract();`;
  }

  /**
   * Generate README
   */
  private generateReadme(projectName: string, moduleName: string, request: GenerationRequest): string {
    return `# ${projectName}

## Description
${request.prompt}

## Project Type
${request.projectType.toUpperCase()} - Aptos ${request.projectType} implementation

## Network
${request.network || 'devnet'}

## Quick Start

### Prerequisites
- Node.js >= 18
- Aptos CLI
- Petra Wallet (for frontend interaction)

### Installation

\`\`\`bash
# Install dependencies
npm install

# Compile Move module
npm run build:move

# Run tests
npm run test:move
\`\`\`

### Deployment

\`\`\`bash
# Set your private key (optional, will generate new account if not set)
export APTOS_PRIVATE_KEY=your_private_key_here

# Deploy to ${request.network || 'devnet'}
npm run deploy
\`\`\`

### Frontend (if included)

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Module Structure

### Main Module: ${moduleName}

Key functions:
- \`init_module\` - Initialize the module
- Additional functions based on project type

## Testing

\`\`\`bash
aptos move test
\`\`\`

## Security Considerations

- Always audit smart contracts before mainnet deployment
- Test thoroughly on devnet/testnet first
- Keep private keys secure

## License

MIT`;
  }

  /**
   * Extract project name from prompt
   */
  private extractProjectName(prompt: string): string {
    // Try to extract a name from the prompt
    const nameMatch = prompt.match(/(?:called|named|project|create)\s+["']?(\w+)["']?/i);
    if (nameMatch) {
      return nameMatch[1];
    }
    
    // Generate a name based on the prompt
    const words = prompt.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => w.length > 3 && !['create', 'build', 'make', 'deploy'].includes(w));
    return keywords.slice(0, 2).join('_') || 'aptos_project';
  }

  /**
   * Sanitize module name for Move
   */
  private sanitizeModuleName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .substring(0, 30);
  }
}

// Singleton instance
let templateGenerator: AptosTemplateGenerator | null = null;

export async function getAptosTemplateGenerator(): Promise<AptosTemplateGenerator> {
  if (!templateGenerator) {
    templateGenerator = new AptosTemplateGenerator();
    await templateGenerator.initialize();
  }
  return templateGenerator;
}

export { AptosTemplateGenerator };
