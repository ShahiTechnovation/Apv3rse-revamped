/**
 * Aptos Context Service
 * Fetches, caches, and indexes Aptos documentation from llms.txt files
 * Provides relevant context for AI prompts
 */

interface LLMsContent {
  full: string;
  small: string;
  index: string;
}

interface TopicIndex {
  [topic: string]: string[];
}

interface ContextChunk {
  topic: string;
  content: string;
  source: 'full' | 'small' | 'index';
}

class AptosContextService {
  private cache: LLMsContent | null = null;
  private topicIndex: TopicIndex = {};
  private lastFetch: number = 0;
  private cacheTTL: number;
  private maxTokens: number;

  private readonly LLMS_URLS = {
    full: 'https://aptos.dev/llms-full.txt',
    small: 'https://aptos.dev/llms-small.txt',
    index: 'https://aptos.dev/llms.txt',
  };

  // Keywords that indicate Aptos-related queries
  private readonly APTOS_KEYWORDS = [
    'move', 'aptos', 'blockchain', 'smart contract', 'dapp', 'nft', 'token',
    'fungible asset', 'module', 'resource', 'signer', 'account', 'transaction',
    'deploy', 'publish', 'compile', 'sdk', 'wallet', 'crypto', 'web3',
    'validator', 'staking', 'gas', 'coin', 'collection', 'digital asset'
  ];

  constructor() {
    this.cacheTTL = parseInt(process.env.APTOS_LLMS_CACHE_TTL || '86400', 10) * 1000; // Default 24 hours
    this.maxTokens = parseInt(process.env.APTOS_CONTEXT_MAX_TOKENS || '4000', 10);
  }

  /**
   * Initialize the service by fetching and caching llms.txt files
   */
  async initialize(): Promise<void> {
    console.log('[AptosContext] Initializing Aptos Context Service...');
    await this.refreshCache();
    console.log('[AptosContext] Initialization complete');
  }

  /**
   * Fetch and cache all llms.txt files
   */
  async refreshCache(): Promise<void> {
    try {
      console.log('[AptosContext] Fetching llms.txt files...');
      
      const [full, small, index] = await Promise.all([
        this.fetchURL(this.LLMS_URLS.full),
        this.fetchURL(this.LLMS_URLS.small),
        this.fetchURL(this.LLMS_URLS.index),
      ]);

      this.cache = { full, small, index };
      this.lastFetch = Date.now();

      // Parse and index the content
      this.buildTopicIndex();

      console.log('[AptosContext] Cache refreshed successfully');
      console.log(`[AptosContext] Indexed ${Object.keys(this.topicIndex).length} topics`);
    } catch (error) {
      console.error('[AptosContext] Error refreshing cache:', error);
      throw error;
    }
  }

  /**
   * Fetch content from URL
   */
  private async fetchURL(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Build topic index from cached content
   */
  private buildTopicIndex(): void {
    if (!this.cache) return;

    this.topicIndex = {};

    // Parse the small file for quick lookups
    const sections = this.parseMarkdownSections(this.cache.small);
    
    sections.forEach(section => {
      const topic = this.extractTopicFromHeader(section.header);
      if (topic) {
        if (!this.topicIndex[topic]) {
          this.topicIndex[topic] = [];
        }
        this.topicIndex[topic].push(section.content);
      }
    });
  }

  /**
   * Parse markdown into sections based on headers
   */
  private parseMarkdownSections(content: string): Array<{ header: string; content: string }> {
    const sections: Array<{ header: string; content: string }> = [];
    const lines = content.split('\n');
    let currentHeader = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentHeader) {
          sections.push({
            header: currentHeader,
            content: currentContent.join('\n'),
          });
        }
        currentHeader = line;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Push last section
    if (currentHeader) {
      sections.push({
        header: currentHeader,
        content: currentContent.join('\n'),
      });
    }

    return sections;
  }

  /**
   * Extract topic keywords from header
   */
  private extractTopicFromHeader(header: string): string {
    return header
      .replace(/^#+\s*/, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  /**
   * Check if cache needs refresh
   */
  private needsRefresh(): boolean {
    return !this.cache || Date.now() - this.lastFetch > this.cacheTTL;
  }

  /**
   * Detect if query is Aptos-related
   */
  isAptosQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return this.APTOS_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
  }

  /**
   * Get relevant context for a user query
   */
  async getRelevantContext(query: string): Promise<string> {
    // Refresh cache if needed
    if (this.needsRefresh()) {
      await this.refreshCache();
    }

    if (!this.cache) {
      throw new Error('Cache not initialized');
    }

    // Determine which file to use based on query complexity
    const useFullDocs = this.shouldUseFullDocs(query);
    const source = useFullDocs ? this.cache.full : this.cache.small;

    // Extract relevant chunks
    const chunks = this.extractRelevantChunks(query, source);

    // Combine and limit by token count
    const context = this.combineChunks(chunks);

    return context;
  }

  /**
   * Determine if query needs full documentation
   */
  private shouldUseFullDocs(query: string): boolean {
    const complexityIndicators = [
      'detailed', 'complete', 'full', 'comprehensive', 'advanced',
      'security', 'best practice', 'production', 'optimization',
      'architecture', 'implementation', 'tutorial', 'guide'
    ];

    const lowerQuery = query.toLowerCase();
    return complexityIndicators.some(indicator => lowerQuery.includes(indicator));
  }

  /**
   * Extract relevant chunks from content based on query
   */
  private extractRelevantChunks(query: string, content: string): ContextChunk[] {
    const chunks: ContextChunk[] = [];
    const queryKeywords = this.extractKeywords(query);

    // Parse content into sections
    const sections = this.parseMarkdownSections(content);

    // Score and filter sections
    sections.forEach(section => {
      const score = this.calculateRelevanceScore(section, queryKeywords);
      if (score > 0) {
        chunks.push({
          topic: this.extractTopicFromHeader(section.header),
          content: `${section.header}\n${section.content}`,
          source: content === this.cache?.full ? 'full' : 'small',
        });
      }
    });

    // Sort by relevance (simple keyword matching for now)
    chunks.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore({ header: a.topic, content: a.content }, queryKeywords);
      const scoreB = this.calculateRelevanceScore({ header: b.topic, content: b.content }, queryKeywords);
      return scoreB - scoreA;
    });

    return chunks;
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['what', 'how', 'when', 'where', 'why', 'which', 'that', 'this', 'with', 'from'].includes(word));
  }

  /**
   * Calculate relevance score for a section
   */
  private calculateRelevanceScore(section: { header: string; content: string }, keywords: string[]): number {
    let score = 0;
    const text = `${section.header} ${section.content}`.toLowerCase();

    keywords.forEach(keyword => {
      const count = (text.match(new RegExp(keyword, 'g')) || []).length;
      score += count;
    });

    return score;
  }

  /**
   * Combine chunks and limit by token count
   */
  private combineChunks(chunks: ContextChunk[]): string {
    const parts: string[] = [];
    let estimatedTokens = 0;

    for (const chunk of chunks) {
      // Rough token estimation (1 token ≈ 4 characters)
      const chunkTokens = Math.ceil(chunk.content.length / 4);
      
      if (estimatedTokens + chunkTokens > this.maxTokens) {
        break;
      }

      parts.push(chunk.content);
      estimatedTokens += chunkTokens;
    }

    if (parts.length === 0) {
      return '';
    }

    return `# Aptos Documentation Context\n\n${parts.join('\n\n---\n\n')}`;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    isCached: boolean;
    lastFetch: number;
    topicCount: number;
    cacheAge: number;
  } {
    return {
      isCached: !!this.cache,
      lastFetch: this.lastFetch,
      topicCount: Object.keys(this.topicIndex).length,
      cacheAge: Date.now() - this.lastFetch,
    };
  }
}

// Singleton instance
let aptosContextService: AptosContextService | null = null;

/**
 * Get or create the Aptos Context Service instance
 */
export async function getAptosContextService(): Promise<AptosContextService> {
  if (!aptosContextService) {
    aptosContextService = new AptosContextService();
    await aptosContextService.initialize();
  }
  return aptosContextService;
}

export { AptosContextService };
