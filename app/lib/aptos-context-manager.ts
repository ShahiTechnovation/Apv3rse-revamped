/**
 * Aptos Context Manager for handling large Move contract contexts
 * Implements chunking, summarization, and incremental building strategies
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AptosContextManager');

interface MoveContractContext {
  modules: ModuleContext[];
  dependencies: string[];
  structs: StructDefinition[];
  functions: FunctionSignature[];
  constants: ConstantDefinition[];
}

interface ModuleContext {
  name: string;
  address: string;
  summary: string;
  fullCode?: string;
}

interface StructDefinition {
  name: string;
  fields: string[];
  abilities: string[];
}

interface FunctionSignature {
  name: string;
  visibility: string;
  parameters: string[];
  returnType?: string;
  isEntry: boolean;
  isView: boolean;
}

interface ConstantDefinition {
  name: string;
  type: string;
  value: string;
}

export class AptosContextManager {
  private static instance: AptosContextManager;
  private contextCache: Map<string, MoveContractContext> = new Map();
  
  // Token limits for different operations
  private readonly MAX_CONTEXT_SIZE = 100000; // ~400KB
  private readonly CHUNK_SIZE = 20000; // ~80KB per chunk
  private readonly SUMMARY_RATIO = 0.2; // Summarize to 20% of original
  
  private constructor() {}
  
  static getInstance(): AptosContextManager {
    if (!AptosContextManager.instance) {
      AptosContextManager.instance = new AptosContextManager();
    }
    return AptosContextManager.instance;
  }
  
  /**
   * Process large Move contract context into manageable chunks
   */
  async processLargeContext(
    fullContext: string,
    options: {
      projectType: 'nft' | 'defi' | 'gaming' | 'social' | 'general';
      priorityModules?: string[];
      includeTests?: boolean;
    }
  ): Promise<string> {
    const contextSize = this.estimateTokens(fullContext);
    logger.info(`Processing context of size: ${contextSize} tokens`);
    
    if (contextSize <= this.MAX_CONTEXT_SIZE) {
      return this.optimizeContext(fullContext, options);
    }
    
    // Split into chunks for large contexts
    const chunks = this.splitIntoChunks(fullContext);
    const processedChunks = await Promise.all(
      chunks.map(chunk => this.processChunk(chunk, options))
    );
    
    return this.mergeProcessedChunks(processedChunks, options);
  }
  
  /**
   * Split context into semantic chunks
   */
  private splitIntoChunks(context: string): string[] {
    const chunks: string[] = [];
    const lines = context.split('\n');
    let currentChunk = '';
    let currentSize = 0;
    let inModule = false;
    
    for (const line of lines) {
      const lineSize = this.estimateTokens(line);
      
      // Detect module boundaries
      if (line.trim().startsWith('module ')) {
        if (inModule && currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
          currentSize = 0;
        }
        inModule = true;
      }
      
      // Check if adding this line would exceed chunk size
      if (currentSize + lineSize > this.CHUNK_SIZE && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = line;
        currentSize = lineSize;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
        currentSize += lineSize;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Process individual chunk with context-aware summarization
   */
  private async processChunk(
    chunk: string,
    options: any
  ): Promise<string> {
    // Extract key information from chunk
    const extracted = this.extractKeyInfo(chunk);
    
    // Prioritize based on project type
    const prioritized = this.prioritizeByProjectType(extracted, options.projectType);
    
    // Generate concise representation
    return this.generateConciseRepresentation(prioritized);
  }
  
  /**
   * Extract key information from Move code
   */
  private extractKeyInfo(code: string): MoveContractContext {
    const context: MoveContractContext = {
      modules: [],
      dependencies: [],
      structs: [],
      functions: [],
      constants: []
    };
    
    // Extract module information
    const moduleRegex = /module\s+([\w:]+)\s*{/g;
    let moduleMatch;
    while ((moduleMatch = moduleRegex.exec(code)) !== null) {
      const [address, name] = moduleMatch[1].split('::');
      context.modules.push({
        name: name || moduleMatch[1],
        address: address || '0x1',
        summary: this.generateModuleSummary(code, moduleMatch.index)
      });
    }
    
    // Extract struct definitions
    const structRegex = /struct\s+(\w+)\s*(?:has\s+([\w\s,]+))?\s*{([^}]*)}/g;
    let structMatch;
    while ((structMatch = structRegex.exec(code)) !== null) {
      const fields = structMatch[3]
        .split(',')
        .map(f => f.trim())
        .filter(f => f);
      
      context.structs.push({
        name: structMatch[1],
        fields,
        abilities: structMatch[2] ? structMatch[2].split(',').map(a => a.trim()) : []
      });
    }
    
    // Extract function signatures
    const functionRegex = /(public\s+)?(entry\s+)?(fun|native\s+fun)\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/g;
    let funcMatch;
    while ((funcMatch = functionRegex.exec(code)) !== null) {
      const params = funcMatch[5]
        .split(',')
        .map(p => p.trim())
        .filter(p => p);
      
      context.functions.push({
        name: funcMatch[4],
        visibility: funcMatch[1] ? 'public' : 'private',
        parameters: params,
        returnType: funcMatch[6]?.trim(),
        isEntry: !!funcMatch[2],
        isView: code.includes(`#[view]`) && code.indexOf(`#[view]`) < funcMatch.index
      });
    }
    
    // Extract constants
    const constRegex = /const\s+(\w+)\s*:\s*([^=]+)\s*=\s*([^;]+);/g;
    let constMatch;
    while ((constMatch = constRegex.exec(code)) !== null) {
      context.constants.push({
        name: constMatch[1],
        type: constMatch[2].trim(),
        value: constMatch[3].trim()
      });
    }
    
    return context;
  }
  
  /**
   * Generate module summary
   */
  private generateModuleSummary(code: string, startIndex: number): string {
    const moduleEnd = code.indexOf('}', startIndex);
    const moduleCode = code.substring(startIndex, moduleEnd + 1);
    
    // Count key elements
    const structCount = (moduleCode.match(/struct\s+\w+/g) || []).length;
    const funcCount = (moduleCode.match(/fun\s+\w+/g) || []).length;
    const entryCount = (moduleCode.match(/entry\s+fun/g) || []).length;
    const viewCount = (moduleCode.match(/#\[view\]/g) || []).length;
    
    return `Module with ${structCount} structs, ${funcCount} functions (${entryCount} entry, ${viewCount} view)`;
  }
  
  /**
   * Prioritize information based on project type
   */
  private prioritizeByProjectType(
    context: MoveContractContext,
    projectType: string
  ): MoveContractContext {
    const priorityPatterns: Record<string, string[]> = {
      nft: ['mint', 'burn', 'transfer', 'collection', 'token', 'metadata', 'royalty'],
      defi: ['swap', 'liquidity', 'pool', 'stake', 'reward', 'vault', 'lending'],
      gaming: ['player', 'game', 'score', 'reward', 'battle', 'inventory', 'quest'],
      social: ['profile', 'post', 'follow', 'like', 'comment', 'share', 'message'],
      general: []
    };
    
    const patterns = priorityPatterns[projectType] || priorityPatterns.general;
    
    if (patterns.length === 0) {
      return context;
    }
    
    // Prioritize functions and structs matching patterns
    const prioritizedFunctions = context.functions.sort((a, b) => {
      const aMatch = patterns.some(p => a.name.toLowerCase().includes(p));
      const bMatch = patterns.some(p => b.name.toLowerCase().includes(p));
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
    
    const prioritizedStructs = context.structs.sort((a, b) => {
      const aMatch = patterns.some(p => a.name.toLowerCase().includes(p));
      const bMatch = patterns.some(p => b.name.toLowerCase().includes(p));
      return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
    });
    
    return {
      ...context,
      functions: prioritizedFunctions,
      structs: prioritizedStructs
    };
  }
  
  /**
   * Generate concise representation of context
   */
  private generateConciseRepresentation(context: MoveContractContext): string {
    let output = '';
    
    // Add module summaries
    if (context.modules.length > 0) {
      output += '// MODULES\n';
      context.modules.forEach(mod => {
        output += `// ${mod.address}::${mod.name} - ${mod.summary}\n`;
      });
      output += '\n';
    }
    
    // Add key structs (limit to top 10)
    if (context.structs.length > 0) {
      output += '// KEY STRUCTS\n';
      context.structs.slice(0, 10).forEach(struct => {
        const abilities = struct.abilities.length > 0 ? ` has ${struct.abilities.join(', ')}` : '';
        output += `struct ${struct.name}${abilities} { ${struct.fields.slice(0, 3).join(', ')}${struct.fields.length > 3 ? ', ...' : ''} }\n`;
      });
      output += '\n';
    }
    
    // Add key functions (limit to top 15)
    if (context.functions.length > 0) {
      output += '// KEY FUNCTIONS\n';
      context.functions.slice(0, 15).forEach(func => {
        const visibility = func.visibility === 'public' ? 'public ' : '';
        const entry = func.isEntry ? 'entry ' : '';
        const view = func.isView ? '#[view] ' : '';
        const params = func.parameters.slice(0, 3).join(', ') + (func.parameters.length > 3 ? ', ...' : '');
        const returns = func.returnType ? `: ${func.returnType}` : '';
        output += `${view}${visibility}${entry}fun ${func.name}(${params})${returns}\n`;
      });
      output += '\n';
    }
    
    // Add constants (limit to top 5)
    if (context.constants.length > 0) {
      output += '// CONSTANTS\n';
      context.constants.slice(0, 5).forEach(constant => {
        output += `const ${constant.name}: ${constant.type} = ${constant.value};\n`;
      });
    }
    
    return output;
  }
  
  /**
   * Merge processed chunks intelligently
   */
  private mergeProcessedChunks(
    chunks: string[],
    options: any
  ): string {
    // Remove duplicates and merge
    const seen = new Set<string>();
    const merged: string[] = [];
    
    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      for (const line of lines) {
        const normalized = line.trim();
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          merged.push(line);
        }
      }
    }
    
    // Add context header
    const header = this.generateContextHeader(options);
    
    return header + '\n\n' + merged.join('\n');
  }
  
  /**
   * Generate context header with instructions
   */
  private generateContextHeader(options: any): string {
    const headers: Record<string, string> = {
      nft: `// NFT/Collection Smart Contract Context
// Focus: Minting, burning, transfers, collections, metadata, royalties
// Framework: aptos_token, aptos_framework`,
      defi: `// DeFi Smart Contract Context  
// Focus: Swaps, liquidity, pools, staking, rewards, vaults
// Framework: aptos_framework, coin, fungible_asset`,
      gaming: `// Gaming Smart Contract Context
// Focus: Players, games, scores, rewards, battles, inventory
// Framework: aptos_framework, event, table`,
      social: `// Social dApp Smart Contract Context
// Focus: Profiles, posts, follows, interactions, messaging
// Framework: aptos_framework, string, vector`,
      general: `// Aptos Move Smart Contract Context
// Framework: aptos_framework, std`
    };
    
    return headers[options.projectType] || headers.general;
  }
  
  /**
   * Optimize context for specific use case
   */
  private optimizeContext(context: string, options: any): string {
    // Remove comments if not needed
    if (!options.includeComments) {
      context = context.replace(/\/\/[^\n]*/g, '');
      context = context.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    
    // Remove test code if not needed
    if (!options.includeTests) {
      context = context.replace(/#\[test[^\]]*\][\s\S]*?fun\s+\w+[^}]*}/g, '');
    }
    
    // Compress whitespace
    context = context.replace(/\n\s*\n/g, '\n');
    context = context.replace(/\s+/g, ' ');
    
    return context;
  }
  
  /**
   * Estimate tokens (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Create incremental context for step-by-step contract building
   */
  async createIncrementalContext(
    requirements: string,
    step: number
  ): Promise<string> {
    const steps = [
      'module structure and dependencies',
      'data structures and storage',
      'core functions and logic',
      'entry functions and transactions',
      'view functions and queries',
      'events and error handling',
      'tests and deployment'
    ];
    
    const currentStep = steps[Math.min(step, steps.length - 1)];
    
    return `// Step ${step + 1}: Implementing ${currentStep}
// Previous context preserved, focusing on: ${currentStep}
// Requirements: ${requirements.substring(0, 200)}...

${this.getTemplateForStep(step)}`;
  }
  
  /**
   * Get template for specific step
   */
  private getTemplateForStep(step: number): string {
    const templates = [
      // Step 0: Module structure
      `module addr::contract_name {
    use std::signer;
    use std::string::{String, utf8};
    use aptos_framework::event;
    use aptos_framework::account;
    
    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_ARGUMENT: u64 = 2;
}`,
      // Step 1: Data structures
      `    // Data structures
    struct State has key {
        admin: address,
        data: vector<u8>,
        counter: u64,
    }
    
    struct Event has drop, store {
        user: address,
        action: String,
        timestamp: u64,
    }`,
      // Step 2: Core functions
      `    // Core functions
    fun init_module(account: &signer) {
        let state = State {
            admin: signer::address_of(account),
            data: vector::empty(),
            counter: 0,
        };
        move_to(account, state);
    }`,
      // Add more templates...
    ];
    
    return templates[Math.min(step, templates.length - 1)];
  }
}

// Export singleton instance
export const aptosContextManager = AptosContextManager.getInstance();
