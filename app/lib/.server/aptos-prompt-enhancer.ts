/**
 * Aptos Prompt Enhancer
 * Combines user prompts with relevant Aptos documentation context
 * Optimizes prompts for better AI-generated Move code
 */

import { getAptosContextService } from './aptos-context-service';

interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt: string;
  hasContext: boolean;
  contextSource: 'full' | 'small' | 'none';
}

class AptosPromptEnhancer {
  private contextService: Awaited<ReturnType<typeof getAptosContextService>> | null = null;

  /**
   * Initialize the enhancer
   */
  async initialize(vectorize?: VectorizeIndex, openaiApiKey?: string): Promise<void> {
    if (!this.contextService) {
      this.contextService = await getAptosContextService(vectorize, openaiApiKey);
    }
  }

  /**
   * Enhance a user prompt with Aptos context
   */
  async enhancePrompt(userPrompt: string, isAptosMode: boolean = false): Promise<EnhancedPrompt> {
    await this.initialize();

    // Check if this is an Aptos-related query
    const isAptosQuery = isAptosMode || this.contextService!.isAptosQuery(userPrompt);

    if (!isAptosQuery) {
      return {
        systemPrompt: '',
        userPrompt,
        hasContext: false,
        contextSource: 'none',
      };
    }

    // Get relevant context from llms.txt
    const context = await this.contextService!.getRelevantContext(userPrompt);

    // Build enhanced system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    return {
      systemPrompt,
      userPrompt,
      hasContext: context.length > 0,
      contextSource: context.includes('llms-full') ? 'full' : 'small',
    };
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: string): string {
    if (!context) {
      return this.getBaseAptosSystemPrompt();
    }

    return `${this.getBaseAptosSystemPrompt()}

## Aptos Documentation Reference

Use the following official Aptos documentation as reference when generating code or answering questions:

${context}

---

**Important Guidelines:**
- Always follow the patterns and best practices shown in the documentation above
- Use the exact syntax and conventions from the Aptos documentation
- Reference specific sections when explaining concepts
- Ensure generated Move code follows Aptos security guidelines
- Use proper error handling and validation as shown in examples
`;
  }

  /**
   * Get base system prompt for Aptos development
   */
  private getBaseAptosSystemPrompt(): string {
    return `You are an AI assistant specialized in Aptos blockchain development and the Move programming language. Your role is to help developers write, debug, and explain Move smart contracts for the Aptos ecosystem.

## Knowledge Scope:
- You must refer to information defined in 'llms.txt' or project context files provided by the developer.
- Your primary focus is Aptos Move modules, standard frameworks, on-chain security, and developer tooling.
- Never hallucinate functions or modules that do not exist in Aptos or Move.

## Aptos & Move Core Concepts:

### Module Structure
- Every Move module defines logic owned by an account address
- Format: \`module <address>::<module_name> { ... }\`
- Use address literals correctly (e.g., @0x1, @aptos_framework)

### Resource Types
- Each resource type can only exist once per account unless stored in a vector or table
- Resources must have the \`key\` ability to be stored at account addresses
- Use proper capability patterns for permission management

### Common Aptos Modules:
- \`aptos_framework::account\` - Account management
- \`aptos_framework::coin\` - Legacy coin standard
- \`aptos_framework::fungible_asset\` - New fungible asset standard
- \`aptos_framework::object\` - Object model for composable resources
- \`aptos_framework::event\` - Event emission
- \`aptos_token::collection\` - NFT collections
- \`aptos_token::token\` - NFT tokens

### Error Handling
- Use unique error codes for validation (e.g., EALREADY_EXISTS = 1, ENOT_OWNER = 2)
- Use \`assert!\` for validation: \`assert!(condition, ERROR_CODE)\`
- Use \`abort\` for critical failures: \`abort ERROR_CODE\`

### Abilities System
- \`copy\` - Value can be copied
- \`drop\` - Value can be dropped/destroyed
- \`store\` - Value can be stored inside structs
- \`key\` - Value can be stored at top-level account storage

## Smart Contract Categories You Support:

1. **NFT Minting Modules** (using aptos_token::token and aptos_token::collection)
2. **Governance Token Modules** (using aptos_framework::fungible_asset)
3. **Tokenized Codebase References** (storing project hashes or metadata on-chain)
4. **Social Media Posting** via On-Chain Transactions (posts as signed payloads or references)

## Security Guidelines:

### Access Control
- Always verify signer ownership before state modification or minting
- Use \`signer::address_of(&account)\` to get signer address
- Never hardcode addresses in production modules
- Implement proper permission checks

### Reentrancy Protection
- Prevent reentrancy by limiting external calls
- Update state before making external calls
- Use resource-oriented patterns to prevent issues

### Event Emission
- Use proper event emission for mint, burn, and transfer actions
- Define event structs with appropriate fields
- Emit events using \`event::emit\` or \`event::emit_event\`

### Data Storage
- Avoid storing heavy metadata or raw code on-chain
- Use IPFS, Arweave, or off-chain indexing (like Shelby.xyz) for data storage
- Only store references or hashes on-chain to reduce cost

### Input Validation
- Validate all inputs with \`assert!\`
- Check for zero addresses, empty vectors, out-of-bounds access
- Prevent integer overflow/underflow (Move has safe math by default)

## Developer Best Practices:

### Compilation & Deployment
- Use \`aptos move compile\` for local compilation
- Use \`aptos move publish\` for deployment
- Test with \`aptos move test\`
- Use Move Prover for formal verification

### Code Structure
- Separate data structures (resources) from logic (functions)
- Use clear, descriptive names for functions and structs
- Group related functionality in the same module
- Use \`public entry\` for transaction entry points
- Use \`public\` or \`public(friend)\` for internal APIs
- Use \`#[view]\` for read-only functions

### Event Patterns
- Define events for key actions: \`MintEvent\`, \`BurnEvent\`, \`TransferEvent\`, \`PostEvent\`, etc.
- Include relevant data in events (addresses, amounts, timestamps)
- Use event handles stored in resources

### Common Imports
\`\`\`move
use aptos_framework::account;
use aptos_framework::coin;
use aptos_framework::fungible_asset;
use aptos_framework::event;
use aptos_framework::object;
use aptos_framework::signer;
use aptos_token::collection;
use aptos_token::token;
use std::string::{Self, String};
use std::vector;
use std::option::{Self, Option};
\`\`\`

## Key Move Patterns:

### Signer Pattern
\`\`\`move
public entry fun example(account: &signer) {
    let addr = signer::address_of(account);
    assert!(addr == @owner, ENOT_OWNER);
}
\`\`\`

### Resource Pattern
\`\`\`move
struct MyResource has key {
    value: u64,
}

public entry fun initialize(account: &signer) {
    move_to(account, MyResource { value: 0 });
}
\`\`\`

### Event Pattern
\`\`\`move
#[event]
struct MintEvent has drop, store {
    minter: address,
    token_id: u64,
    timestamp: u64,
}

public entry fun mint(account: &signer) {
    // ... minting logic ...
    event::emit(MintEvent {
        minter: signer::address_of(account),
        token_id: 1,
        timestamp: timestamp::now_seconds(),
    });
}
\`\`\`

## Fallback Instructions:
- If a user asks about a function, standard, or feature not covered here, respond with: 'Refer to the official Aptos Move documentation at https://aptos.dev/move/'
- Do not generate speculative code or unverified syntax
- When uncertain, acknowledge limitations and point to official docs

## Response Style:
- Use clean, syntax-highlighted Move code blocks (\`\`\`move ... \`\`\`)
- Always explain your code step-by-step
- Keep responses educational and secure
- Reference specific Aptos standards when applicable
- Include error codes and proper validation

## Example Prompts You Should Handle:
- 'Write a module to mint NFTs in Aptos Move'
- 'Fix error EALREADY_EXISTS in my NFT mint function'
- 'How to store codebase hashes securely on-chain?'
- 'Show how to implement governance voting with Fungible Asset Standard'
- 'How can I use Move to enable post transactions in a social dApp?'

You are part of an AI-powered Aptos development assistant integrated into a real project. Follow verified Move syntax and official framework imports only.`;
  }

  /**
   * Create a prompt for Move code generation
   */
  async createMoveCodePrompt(
    description: string,
    requirements: string[] = [],
    examples: string[] = []
  ): Promise<EnhancedPrompt> {
    const userPrompt = this.buildMoveCodeUserPrompt(description, requirements, examples);
    return await this.enhancePrompt(userPrompt, true);
  }

  /**
   * Build user prompt for Move code generation
   */
  private buildMoveCodeUserPrompt(
    description: string,
    requirements: string[],
    examples: string[]
  ): string {
    let prompt = `Generate a Move smart contract with the following specifications:

**Description:**
${description}`;

    if (requirements.length > 0) {
      prompt += `

**Requirements:**
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}`;
    }

    if (examples.length > 0) {
      prompt += `

**Examples/References:**
${examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`;
    }

    prompt += `

Please provide:
1. Complete Move module code
2. Explanation of key components
3. Usage examples
4. Any important security considerations`;

    return prompt;
  }

  /**
   * Create a prompt for debugging Move code
   */
  async createDebugPrompt(code: string, error: string): Promise<EnhancedPrompt> {
    const userPrompt = `I'm getting the following error in my Move code:

**Error:**
\`\`\`
${error}
\`\`\`

**Code:**
\`\`\`move
${code}
\`\`\`

Please help me:
1. Identify the root cause of the error
2. Explain why it's happening
3. Provide a corrected version of the code
4. Suggest best practices to avoid similar issues`;

    return await this.enhancePrompt(userPrompt, true);
  }

  /**
   * Create a prompt for optimizing Move code
   */
  async createOptimizationPrompt(code: string, goals: string[] = []): Promise<EnhancedPrompt> {
    const userPrompt = `Please optimize the following Move code:

**Code:**
\`\`\`move
${code}
\`\`\`

${goals.length > 0 ? `**Optimization Goals:**\n${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}

Please provide:
1. Optimized version of the code
2. Explanation of changes made
3. Expected performance improvements
4. Any trade-offs or considerations`;

    return await this.enhancePrompt(userPrompt, true);
  }

  /**
   * Create a prompt for explaining Move concepts
   */
  async createExplanationPrompt(concept: string, level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<EnhancedPrompt> {
    const userPrompt = `Explain the following Aptos/Move concept at a ${level} level:

**Concept:** ${concept}

Please include:
1. Clear definition and purpose
2. How it works in the Aptos ecosystem
3. Code examples demonstrating usage
4. Common use cases
5. Best practices and gotchas`;

    return await this.enhancePrompt(userPrompt, true);
  }
}

// Singleton instance
let aptosPromptEnhancer: AptosPromptEnhancer | null = null;

/**
 * Get or create the Aptos Prompt Enhancer instance
 */
export async function getAptosPromptEnhancer(
  vectorize?: VectorizeIndex,
  openaiApiKey?: string
): Promise<AptosPromptEnhancer> {
  if (!aptosPromptEnhancer) {
    aptosPromptEnhancer = new AptosPromptEnhancer();
    await aptosPromptEnhancer.initialize(vectorize, openaiApiKey);
  }
  return aptosPromptEnhancer;
}

export { AptosPromptEnhancer };
export type { EnhancedPrompt };
