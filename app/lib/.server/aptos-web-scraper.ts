/**
 * Aptos Web Scraper Service
 * Fetches and verifies Aptos documentation, contract examples, and best practices
 * from official sources to enhance AI context
 */

import { createScopedLogger } from '~/utils/logger';

// Note: cheerio needs to be installed: pnpm add cheerio
// Temporarily using fetch and regex for parsing until cheerio is installed
type CheerioAPI = any;

const logger = createScopedLogger('aptos-scraper');

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  codeExamples: string[];
  lastUpdated: Date;
  category: 'documentation' | 'tutorial' | 'example' | 'reference';
}

export interface ContractVerification {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  securityChecks: {
    hasSignerVerification: boolean;
    hasInputValidation: boolean;
    hasEventEmission: boolean;
    hasErrorHandling: boolean;
    usesProperTypes: boolean;
  };
}

const APTOS_SOURCES = {
  docs: 'https://aptos.dev',
  github: 'https://github.com/aptos-labs/aptos-core',
  moveBook: 'https://move-language.github.io/move',
  examples: 'https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples',
};

class AptosWebScraper {
  private cache: Map<string, ScrapedContent> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch and parse Aptos documentation pages
   */
  async scrapeDocumentation(urls: string[]): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];

    for (const url of urls) {
      try {
        // Check cache first
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
          results.push(cached);
          continue;
        }

        logger.info(`Scraping: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          logger.warn(`Failed to fetch ${url}: ${response.status}`);
          continue;
        }

        const html = await response.text();

        // Extract content using regex (simple parsing without cheerio)
        const title = this.extractTitle(html);
        const content = this.extractTextContent(html);
        const codeExamples = this.extractCodeExamples(html);

        const scrapedContent: ScrapedContent = {
          url,
          title,
          content,
          codeExamples,
          lastUpdated: new Date(),
          category: this.categorizeUrl(url),
        };

        this.cache.set(url, scrapedContent);
        results.push(scrapedContent);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error scraping ${url}:`, error);
      }
    }

    return results;
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return this.stripHtmlTags(h1Match[1]);
    }
    
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      return this.stripHtmlTags(titleMatch[1]);
    }
    
    return 'Untitled';
  }

  /**
   * Extract text content from HTML
   */
  private extractTextContent(html: string): string {
    // Remove script, style, nav, footer, header tags
    let cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

    // Extract main content or body
    const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                      cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                      cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    
    if (mainMatch) {
      cleaned = mainMatch[1];
    }

    // Strip all HTML tags
    cleaned = this.stripHtmlTags(cleaned);

    // Clean up whitespace
    return cleaned
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 10000); // Limit to 10k chars
  }

  /**
   * Extract code examples from HTML
   */
  private extractCodeExamples(html: string): string[] {
    const examples: string[] = [];
    
    // Match code blocks in pre tags
    const codeBlockRegex = /<pre[^>]*>[\s\S]*?<code[^>]*>([\s\S]*?)<\/code>[\s\S]*?<\/pre>/gi;
    let match;
    
    while ((match = codeBlockRegex.exec(html)) !== null) {
      const code = this.stripHtmlTags(match[1])
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
      
      if (code.length > 20 && code.length < 5000) {
        examples.push(code);
      }
    }

    return examples;
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Categorize URL by content type
   */
  private categorizeUrl(url: string): ScrapedContent['category'] {
    if (url.includes('/tutorial')) return 'tutorial';
    if (url.includes('/example')) return 'example';
    if (url.includes('/reference') || url.includes('/api')) return 'reference';
    return 'documentation';
  }

  /**
   * Scrape Move contract examples from GitHub
   */
  async scrapeContractExamples(): Promise<ScrapedContent[]> {
    const exampleUrls = [
      'https://raw.githubusercontent.com/aptos-labs/aptos-core/main/aptos-move/move-examples/hello_blockchain/sources/hello_blockchain.move',
      'https://raw.githubusercontent.com/aptos-labs/aptos-core/main/aptos-move/move-examples/mint_nft/sources/minting.move',
      'https://raw.githubusercontent.com/aptos-labs/aptos-core/main/aptos-move/framework/aptos-token-objects/sources/token.move',
    ];

    const results: ScrapedContent[] = [];

    for (const url of exampleUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const code = await response.text();
        
        results.push({
          url,
          title: url.split('/').pop() || 'Example',
          content: code,
          codeExamples: [code],
          lastUpdated: new Date(),
          category: 'example',
        });

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(`Error fetching example ${url}:`, error);
      }
    }

    return results;
  }

  /**
   * Verify Move contract code
   */
  verifyContract(code: string): ContractVerification {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Security checks
    const hasSignerVerification = /signer::address_of|assert!\(/.test(code);
    const hasInputValidation = /assert!\(|abort|require/.test(code);
    const hasEventEmission = /event::emit|Event/.test(code);
    const hasErrorHandling = /const E[A-Z_]+|abort/.test(code);
    const usesProperTypes = /has key|has store|has copy|has drop/.test(code);

    // Check for common issues
    if (!hasSignerVerification) {
      issues.push('Missing signer verification - always verify signer::address_of(account)');
      suggestions.push('Add: let addr = signer::address_of(account); assert!(addr == expected, ERROR_CODE);');
    }

    if (!hasInputValidation) {
      issues.push('Missing input validation - validate all parameters');
      suggestions.push('Add: assert!(amount > 0, EINVALID_AMOUNT);');
    }

    if (!hasEventEmission) {
      suggestions.push('Consider emitting events for important state changes');
    }

    if (!hasErrorHandling) {
      issues.push('Missing error constants - define error codes');
      suggestions.push('Add: const EINVALID_OPERATION: u64 = 1;');
    }

    if (!usesProperTypes) {
      issues.push('Missing resource abilities - specify key, store, copy, drop');
      suggestions.push('Add abilities to structs: struct MyResource has key, store { ... }');
    }

    // Check for dangerous patterns
    if (/hardcoded.*0x[0-9a-fA-F]{40}/.test(code)) {
      issues.push('Hardcoded addresses found - use named addresses or parameters');
    }

    if (/unsafe|unchecked/.test(code)) {
      issues.push('Unsafe operations detected - review carefully');
    }

    // Check for best practices
    if (!/public entry fun/.test(code) && /public fun/.test(code)) {
      suggestions.push('Consider using "public entry fun" for transaction entry points');
    }

    if (!/acquires/.test(code) && /borrow_global/.test(code)) {
      issues.push('Missing "acquires" annotation for global resource access');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      securityChecks: {
        hasSignerVerification,
        hasInputValidation,
        hasEventEmission,
        hasErrorHandling,
        usesProperTypes,
      },
    };
  }

  /**
   * Fetch latest Aptos best practices
   */
  async fetchBestPractices(): Promise<string> {
    const urls = [
      'https://aptos.dev/move/move-on-aptos/best-practices',
      'https://aptos.dev/move/move-on-aptos/security',
      'https://aptos.dev/standards',
    ];

    const contents = await this.scrapeDocumentation(urls);
    
    return contents
      .map(c => `# ${c.title}\n\n${c.content}`)
      .join('\n\n---\n\n')
      .substring(0, 15000); // Limit total size
  }

  /**
   * Fetch Move language patterns
   */
  async fetchMovePatterns(): Promise<string[]> {
    const examples = await this.scrapeContractExamples();
    
    return examples
      .flatMap(e => e.codeExamples)
      .filter(code => code.includes('module') && code.length > 100);
  }

  /**
   * Generate enhanced system prompt from scraped data
   */
  async generateEnhancedPrompt(): Promise<string> {
    logger.info('Generating enhanced system prompt from web sources...');

    const [bestPractices, patterns] = await Promise.all([
      this.fetchBestPractices(),
      this.fetchMovePatterns(),
    ]);

    const enhancedPrompt = `
# APTOS MOVE DEVELOPMENT - ENHANCED CONTEXT

## Latest Best Practices (from aptos.dev)
${bestPractices}

## Verified Move Patterns
${patterns.slice(0, 3).map((p, i) => `
### Pattern ${i + 1}
\`\`\`move
${p.substring(0, 1000)}
\`\`\`
`).join('\n')}

## Security Requirements (MANDATORY)
1. **Signer Verification**: ALWAYS verify signer ownership
   \`\`\`move
   let addr = signer::address_of(account);
   assert!(addr == expected_addr, EUNAUTHORIZED);
   \`\`\`

2. **Input Validation**: Validate ALL inputs
   \`\`\`move
   assert!(amount > 0, EINVALID_AMOUNT);
   assert!(exists<Resource>(addr), ERESOURCE_NOT_FOUND);
   \`\`\`

3. **Event Emission**: Emit events for state changes
   \`\`\`move
   event::emit(TransferEvent { from, to, amount });
   \`\`\`

4. **Error Handling**: Define clear error codes
   \`\`\`move
   const EUNAUTHORIZED: u64 = 1;
   const EINVALID_AMOUNT: u64 = 2;
   const ERESOURCE_NOT_FOUND: u64 = 3;
   \`\`\`

5. **Resource Abilities**: Specify proper abilities
   \`\`\`move
   struct MyResource has key, store {
       value: u64,
   }
   \`\`\`

## Contract Structure Template
\`\`\`move
module my_addr::my_module {
    use std::signer;
    use aptos_framework::event;
    
    // Error codes
    const EUNAUTHORIZED: u64 = 1;
    
    // Resources
    struct MyResource has key {
        value: u64,
    }
    
    // Events
    struct MyEvent has drop, store {
        value: u64,
    }
    
    // Entry functions
    public entry fun create(account: &signer, value: u64) {
        let addr = signer::address_of(account);
        assert!(value > 0, EINVALID_VALUE);
        
        move_to(account, MyResource { value });
        event::emit(MyEvent { value });
    }
    
    // View functions
    #[view]
    public fun get_value(addr: address): u64 acquires MyResource {
        borrow_global<MyResource>(addr).value
    }
}
\`\`\`

## CRITICAL RULES
- Never hardcode addresses in production
- Always use named addresses in Move.toml
- Test on devnet before testnet/mainnet
- Use proper error messages
- Document all public functions
- Follow Aptos naming conventions
- Emit events for tracking
- Use view functions for queries
- Implement proper access control
`;

    return enhancedPrompt;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
let scraperInstance: AptosWebScraper | null = null;

export function getAptosWebScraper(): AptosWebScraper {
  if (!scraperInstance) {
    scraperInstance = new AptosWebScraper();
  }
  return scraperInstance;
}

export { AptosWebScraper };
