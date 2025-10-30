/**
 * Contract Intent Classifier
 * Detects and classifies user intent for Move contract generation
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('contract-intent-classifier');

export interface ContractIntent {
  categories: ContractCategory[];
  features: string[];
  confidence: number;
  suggestedContracts: string[];
}

export enum ContractCategory {
  NFT = 'nft',
  TOKEN = 'token',
  MARKETPLACE = 'marketplace',
  DEFI = 'defi',
  GOVERNANCE = 'governance',
  GAMING = 'gaming',
  SOCIAL = 'social',
  UTILITY = 'utility',
}

export interface ContractMatch {
  path: string;
  category: ContractCategory;
  relevance: number;
  features: string[];
  description: string;
}

export class ContractIntentClassifier {
  private readonly categoryKeywords: Record<ContractCategory, string[]> = {
    [ContractCategory.NFT]: [
      'nft', 'non-fungible', 'collection', 'mint', 'digital asset', 
      'artwork', 'collectible', 'token id', 'metadata', 'royalty',
      'creator', 'burn nft', 'transfer nft', 'nft marketplace'
    ],
    [ContractCategory.TOKEN]: [
      'token', 'coin', 'fungible', 'erc20', 'currency', 'mint token',
      'burn token', 'transfer', 'balance', 'supply', 'decimal',
      'symbol', 'fa', 'fungible asset', 'aptos coin'
    ],
    [ContractCategory.MARKETPLACE]: [
      'marketplace', 'exchange', 'trading', 'auction', 'listing',
      'buy', 'sell', 'offer', 'bid', 'escrow', 'order book',
      'dex', 'swap', 'liquidity', 'amm'
    ],
    [ContractCategory.DEFI]: [
      'staking', 'lending', 'borrowing', 'yield', 'farming',
      'pool', 'liquidity', 'vault', 'interest', 'collateral',
      'loan', 'flash loan', 'compound', 'apy', 'apr'
    ],
    [ContractCategory.GOVERNANCE]: [
      'dao', 'voting', 'proposal', 'governance', 'delegate',
      'treasury', 'multisig', 'timelock', 'quorum', 'election',
      'poll', 'decision', 'council'
    ],
    [ContractCategory.GAMING]: [
      'game', 'play', 'reward', 'achievement', 'score',
      'leaderboard', 'tournament', 'battle', 'quest', 'level',
      'experience', 'xp', 'item', 'inventory', 'character'
    ],
    [ContractCategory.SOCIAL]: [
      'social', 'post', 'comment', 'like', 'follow', 'profile',
      'message', 'chat', 'friend', 'group', 'community',
      'content', 'share', 'feed'
    ],
    [ContractCategory.UTILITY]: [
      'utility', 'tool', 'service', 'oracle', 'random',
      'timelock', 'vesting', 'escrow', 'payment', 'subscription',
      'access control', 'whitelist', 'blacklist'
    ],
  };

  private readonly contractMappings: Record<string, ContractMatch[]> = {
    'nft_collection': [{
      path: 'nft/collection.move',
      category: ContractCategory.NFT,
      relevance: 1.0,
      features: ['create_collection', 'mint_nft', 'burn_nft', 'transfer'],
      description: 'Complete NFT collection with minting and management'
    }],
    'fungible_token': [{
      path: 'token/fa_coin.move',
      category: ContractCategory.TOKEN,
      relevance: 1.0,
      features: ['initialize', 'mint', 'burn', 'transfer', 'freeze'],
      description: 'Fungible asset implementation with full features'
    }],
    'simple_marketplace': [{
      path: 'marketplace/simple_marketplace.move',
      category: ContractCategory.MARKETPLACE,
      relevance: 1.0,
      features: ['list_item', 'buy_item', 'cancel_listing', 'update_price'],
      description: 'Basic marketplace for trading assets'
    }],
    'staking_pool': [{
      path: 'defi/staking.move',
      category: ContractCategory.DEFI,
      relevance: 1.0,
      features: ['stake', 'unstake', 'claim_rewards', 'calculate_rewards'],
      description: 'Token staking with reward distribution'
    }],
    'dao_voting': [{
      path: 'governance/dao.move',
      category: ContractCategory.GOVERNANCE,
      relevance: 1.0,
      features: ['create_proposal', 'vote', 'execute', 'delegate'],
      description: 'DAO governance with proposal and voting system'
    }],
  };

  /**
   * Detect intent from user prompt
   */
  detectIntent(prompt: string): ContractIntent {
    const normalizedPrompt = prompt.toLowerCase();
    const detectedCategories: Map<ContractCategory, number> = new Map();
    const detectedFeatures: Set<string> = new Set();

    // Score each category based on keyword matches
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      let matchedKeywords = 0;

      for (const keyword of keywords) {
        if (normalizedPrompt.includes(keyword)) {
          // Weight multi-word keywords higher
          const weight = keyword.split(' ').length;
          score += weight;
          matchedKeywords++;
          
          // Track features based on keywords
          this.extractFeatures(keyword, detectedFeatures);
        }
      }

      if (score > 0) {
        // Normalize score based on number of keywords
        const normalizedScore = score / keywords.length;
        detectedCategories.set(category as ContractCategory, normalizedScore);
      }
    }

    // Sort categories by score
    const sortedCategories = Array.from(detectedCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);

    // Calculate confidence based on top score
    const topScore = detectedCategories.get(sortedCategories[0]) || 0;
    const confidence = Math.min(topScore * 2, 1); // Scale and cap at 1

    // Get suggested contracts
    const suggestedContracts = this.getSuggestedContracts(sortedCategories, Array.from(detectedFeatures));

    logger.info(`Intent detected: ${sortedCategories.join(', ')} with confidence ${confidence}`);

    return {
      categories: sortedCategories,
      features: Array.from(detectedFeatures),
      confidence,
      suggestedContracts,
    };
  }

  /**
   * Extract features from matched keywords
   */
  private extractFeatures(keyword: string, features: Set<string>): void {
    const featureMap: Record<string, string[]> = {
      'mint': ['minting', 'token_creation'],
      'burn': ['burning', 'token_destruction'],
      'transfer': ['transfers', 'send_receive'],
      'marketplace': ['listing', 'trading'],
      'staking': ['stake', 'rewards'],
      'voting': ['proposals', 'governance'],
      'collection': ['collection_management'],
      'auction': ['bidding', 'timed_sales'],
      'swap': ['token_exchange', 'liquidity'],
    };

    for (const [key, mappedFeatures] of Object.entries(featureMap)) {
      if (keyword.includes(key)) {
        mappedFeatures.forEach(f => features.add(f));
      }
    }
  }

  /**
   * Get suggested contracts based on detected intent
   */
  private getSuggestedContracts(categories: ContractCategory[], features: string[]): string[] {
    const suggestions: string[] = [];

    // Map categories to specific contracts
    for (const category of categories) {
      switch (category) {
        case ContractCategory.NFT:
          suggestions.push('nft/collection.move', 'nft/token.move');
          if (features.some(f => f.includes('marketplace'))) {
            suggestions.push('marketplace/nft_marketplace.move');
          }
          break;
        case ContractCategory.TOKEN:
          suggestions.push('token/fa_coin.move', 'token/managed_coin.move');
          break;
        case ContractCategory.MARKETPLACE:
          suggestions.push('marketplace/simple_marketplace.move');
          if (features.some(f => f.includes('auction'))) {
            suggestions.push('marketplace/auction.move');
          }
          break;
        case ContractCategory.DEFI:
          if (features.some(f => f.includes('stak'))) {
            suggestions.push('defi/staking.move');
          }
          if (features.some(f => f.includes('swap') || f.includes('liquidity'))) {
            suggestions.push('defi/amm.move');
          }
          break;
        case ContractCategory.GOVERNANCE:
          suggestions.push('governance/dao.move', 'governance/voting.move');
          break;
        case ContractCategory.GAMING:
          suggestions.push('gaming/game_items.move', 'gaming/rewards.move');
          break;
        case ContractCategory.SOCIAL:
          suggestions.push('social/profile.move', 'social/posts.move');
          break;
        case ContractCategory.UTILITY:
          suggestions.push('utility/timelock.move', 'utility/multisig.move');
          break;
      }
    }

    // Remove duplicates and limit to top 5
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Get best matching contracts for intent
   */
  async getMatchingContracts(intent: ContractIntent): Promise<ContractMatch[]> {
    const matches: ContractMatch[] = [];

    for (const contractPath of intent.suggestedContracts) {
      // Find contract in mappings
      const contractKey = contractPath.replace('.move', '').replace('/', '_');
      const contractMatches = this.contractMappings[contractKey];

      if (contractMatches) {
        matches.push(...contractMatches);
      } else {
        // Create a default match for unmapped contracts
        const category = intent.categories[0] || ContractCategory.UTILITY;
        matches.push({
          path: contractPath,
          category,
          relevance: 0.7,
          features: intent.features,
          description: `Contract from ${contractPath}`,
        });
      }
    }

    // Sort by relevance
    return matches.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Check if prompt is contract-related
   */
  isContractRelated(prompt: string): boolean {
    const normalizedPrompt = prompt.toLowerCase();
    
    // Check for explicit contract keywords
    const contractKeywords = [
      'smart contract', 'move contract', 'deploy', 'blockchain',
      'on-chain', 'dapp', 'web3', 'aptos'
    ];

    if (contractKeywords.some(keyword => normalizedPrompt.includes(keyword))) {
      return true;
    }

    // Check if any category has significant matches
    const intent = this.detectIntent(prompt);
    return intent.confidence > 0.3 && intent.categories.length > 0;
  }
}

// Singleton instance
let instance: ContractIntentClassifier | null = null;

export function getContractIntentClassifier(): ContractIntentClassifier {
  if (!instance) {
    instance = new ContractIntentClassifier();
  }
  return instance;
}
