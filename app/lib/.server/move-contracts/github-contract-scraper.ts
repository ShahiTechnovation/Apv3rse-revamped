/**
 * GitHub Contract Scraper
 * Fetches Move contracts from aptos-labs/move-by-examples repository
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('github-contract-scraper');

export interface GitHubContract {
  path: string;
  name: string;
  content: string;
  sha: string;
  size: number;
  url: string;
  category?: string;
  dependencies?: string[];
}

export interface GitHubApiConfig {
  token?: string;
  baseUrl?: string;
  owner?: string;
  repo?: string;
}

export class GitHubContractScraper {
  private readonly defaultConfig: Required<GitHubApiConfig> = {
    token: '',
    baseUrl: 'https://api.github.com',
    owner: 'aptos-labs',
    repo: 'move-by-examples',
  };

  private config: Required<GitHubApiConfig>;
  private contractCache: Map<string, GitHubContract> = new Map();
  private lastFetch: number = 0;
  private readonly cacheTTL = 3600000; // 1 hour

  constructor(config?: GitHubApiConfig) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Update configuration (e.g., from settings)
   */
  updateConfig(config: Partial<GitHubApiConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('GitHub config updated');
  }

  /**
   * Fetch repository structure
   */
  async fetchRepositoryStructure(): Promise<any[]> {
    try {
      const url = `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/git/trees/main?recursive=1`;
      
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };

      if (this.config.token) {
        headers['Authorization'] = `token ${this.config.token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { tree?: any[] };
      return data.tree || [];
    } catch (error) {
      logger.error('Failed to fetch repository structure:', error);
      throw error;
    }
  }

  /**
   * Fetch contract content from GitHub
   */
  async fetchContract(path: string): Promise<GitHubContract> {
    // Check cache first
    const cached = this.contractCache.get(path);
    if (cached && Date.now() - this.lastFetch < this.cacheTTL) {
      logger.debug(`Using cached contract: ${path}`);
      return cached;
    }

    try {
      const url = `${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
      
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };

      if (this.config.token) {
        headers['Authorization'] = `token ${this.config.token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch contract: ${response.status}`);
      }

      const data = await response.json() as {
        path: string;
        name: string;
        content: string;
        sha: string;
        size: number;
        html_url: string;
      };
      
      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      const contract: GitHubContract = {
        path: data.path,
        name: data.name,
        content,
        sha: data.sha,
        size: data.size,
        url: data.html_url,
        category: this.detectCategory(data.path),
        dependencies: this.extractDependencies(content),
      };

      // Cache the contract
      this.contractCache.set(path, contract);
      this.lastFetch = Date.now();

      logger.info(`Fetched contract: ${path}`);
      return contract;
    } catch (error) {
      logger.error(`Failed to fetch contract ${path}:`, error);
      throw error;
    }
  }

  /**
   * Fetch multiple contracts
   */
  async fetchContracts(paths: string[]): Promise<GitHubContract[]> {
    const contracts = await Promise.all(
      paths.map(path => this.fetchContract(path).catch(err => {
        logger.error(`Failed to fetch ${path}:`, err);
        return null;
      }))
    );

    return contracts.filter((c): c is GitHubContract => c !== null);
  }

  /**
   * Search for contracts by pattern
   */
  async searchContracts(pattern: string): Promise<string[]> {
    try {
      const structure = await this.fetchRepositoryStructure();
      
      // Filter for .move files matching pattern
      const moveFiles = structure
        .filter(item => 
          item.type === 'blob' && 
          item.path.endsWith('.move') &&
          item.path.toLowerCase().includes(pattern.toLowerCase())
        )
        .map(item => item.path);

      logger.info(`Found ${moveFiles.length} contracts matching "${pattern}"`);
      return moveFiles;
    } catch (error) {
      logger.error('Failed to search contracts:', error);
      return [];
    }
  }

  /**
   * Get all Move contracts from repository
   */
  async getAllContracts(): Promise<string[]> {
    try {
      const structure = await this.fetchRepositoryStructure();
      
      // Filter for all .move files
      const moveFiles = structure
        .filter(item => item.type === 'blob' && item.path.endsWith('.move'))
        .map(item => item.path);

      logger.info(`Found ${moveFiles.length} total Move contracts`);
      return moveFiles;
    } catch (error) {
      logger.error('Failed to get all contracts:', error);
      return [];
    }
  }

  /**
   * Detect category from file path
   */
  private detectCategory(path: string): string {
    const parts = path.split('/');
    if (parts.length > 1) {
      return parts[0]; // Use first directory as category
    }
    return 'uncategorized';
  }

  /**
   * Extract dependencies from Move contract
   */
  private extractDependencies(content: string): string[] {
    const dependencies: Set<string> = new Set();
    
    // Match use statements
    const useRegex = /use\s+([\w:]+)/g;
    let match;
    
    while ((match = useRegex.exec(content)) !== null) {
      const dep = match[1];
      // Extract module name from full path
      if (dep.includes('::')) {
        const parts = dep.split('::');
        dependencies.add(parts[0]);
      }
    }

    // Common Aptos dependencies
    const commonDeps = [
      'aptos_framework',
      'aptos_std',
      'aptos_token',
      'std',
    ];

    // Filter to only include external dependencies
    return Array.from(dependencies).filter(dep => 
      commonDeps.some(common => dep.startsWith(common))
    );
  }

  /**
   * Validate contract syntax (basic check)
   */
  validateContractSyntax(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for module declaration
    if (!content.includes('module ')) {
      errors.push('Missing module declaration');
    }

    // Check for balanced braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces');
    }

    // Check for entry functions
    if (!content.includes('entry ') && !content.includes('public entry')) {
      errors.push('No entry functions found');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get contract examples by category
   */
  async getContractsByCategory(category: string): Promise<GitHubContract[]> {
    const allPaths = await this.getAllContracts();
    const categoryPaths = allPaths.filter(path => 
      path.toLowerCase().includes(category.toLowerCase())
    );

    return this.fetchContracts(categoryPaths);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.contractCache.clear();
    this.lastFetch = 0;
    logger.info('Contract cache cleared');
  }
}

// Singleton instance
let instance: GitHubContractScraper | null = null;

export function getGitHubContractScraper(config?: GitHubApiConfig): GitHubContractScraper {
  if (!instance) {
    instance = new GitHubContractScraper(config);
  } else if (config) {
    instance.updateConfig(config);
  }
  return instance;
}
