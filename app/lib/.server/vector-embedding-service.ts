/**
 * Vector Embedding Service
 * Handles semantic search using Cloudflare Vectorize and OpenAI embeddings
 */

interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: {
    content: string;
    topic: string;
    source: 'llms.txt' | 'github' | 'sdk';
    timestamp: number;
  };
}

interface SemanticSearchResult {
  id: string;
  score: number;
  metadata: {
    content: string;
    topic: string;
    source: string;
    timestamp: number;
  };
}

export class VectorEmbeddingService {
  private vectorize: VectorizeIndex | null = null;
  private openaiApiKey: string;
  private embeddingModel = 'text-embedding-3-small'; // 1536 dimensions, $0.02/1M tokens
  private embeddingDimensions = 1536;

  constructor(vectorize?: VectorizeIndex, openaiApiKey?: string) {
    this.vectorize = vectorize || null;
    this.openaiApiKey = openaiApiKey || '';
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (!this.vectorize) {
      console.warn('[VectorEmbedding] Vectorize not configured, semantic search disabled');
      return;
    }
    console.log('[VectorEmbedding] Vector embedding service initialized');
  }

  /**
   * Check if vector search is available
   */
  isAvailable(): boolean {
    return !!this.vectorize && !!this.openaiApiKey;
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text,
          encoding_format: 'float',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[] }>;
      };
      return data.data[0].embedding;
    } catch (error) {
      console.error('[VectorEmbedding] Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Insert or update vectors in the index
   */
  async upsertVectors(vectors: EmbeddingVector[]): Promise<void> {
    if (!this.vectorize) {
      throw new Error('Vectorize not configured');
    }

    try {
      await this.vectorize.upsert(vectors);
      console.log(`[VectorEmbedding] Upserted ${vectors.length} vectors`);
    } catch (error) {
      console.error('[VectorEmbedding] Error upserting vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors using semantic similarity
   */
  async semanticSearch(
    query: string,
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<SemanticSearchResult[]> {
    if (!this.vectorize) {
      throw new Error('Vectorize not configured');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in Vectorize
      const results = await this.vectorize.query(queryEmbedding, {
        topK,
        filter,
        returnMetadata: true,
      });

      return results.matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error('[VectorEmbedding] Error performing semantic search:', error);
      throw error;
    }
  }

  /**
   * Hybrid search: Combine semantic search with keyword matching
   */
  async hybridSearch(
    query: string,
    keywordMatches: Array<{ content: string; topic: string; score: number }>,
    topK: number = 5
  ): Promise<Array<{ content: string; topic: string; score: number; source: string }>> {
    if (!this.isAvailable()) {
      // Fallback to keyword-only results
      return keywordMatches.slice(0, topK).map(match => ({
        ...match,
        source: 'keyword',
      }));
    }

    try {
      // Get semantic results
      const semanticResults = await this.semanticSearch(query, topK);

      // Combine and rerank results
      const combined = new Map<string, any>();

      // Add semantic results with higher weight
      semanticResults.forEach(result => {
        const key = result.metadata.content.substring(0, 100); // Use content prefix as key
        combined.set(key, {
          content: result.metadata.content,
          topic: result.metadata.topic,
          score: result.score * 0.7, // 70% weight for semantic
          source: 'semantic',
        });
      });

      // Add keyword results
      keywordMatches.forEach(match => {
        const key = match.content.substring(0, 100);
        if (combined.has(key)) {
          // Boost score if found in both
          const existing = combined.get(key);
          existing.score += match.score * 0.3; // 30% weight for keyword
          existing.source = 'hybrid';
        } else {
          combined.set(key, {
            ...match,
            score: match.score * 0.3,
            source: 'keyword',
          });
        }
      });

      // Sort by combined score
      return Array.from(combined.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } catch (error) {
      console.error('[VectorEmbedding] Error in hybrid search:', error);
      // Fallback to keyword results
      return keywordMatches.slice(0, topK).map(match => ({
        ...match,
        source: 'keyword',
      }));
    }
  }

  /**
   * Delete vectors by IDs
   */
  async deleteVectors(ids: string[]): Promise<void> {
    if (!this.vectorize) {
      throw new Error('Vectorize not configured');
    }

    try {
      await this.vectorize.deleteByIds(ids);
      console.log(`[VectorEmbedding] Deleted ${ids.length} vectors`);
    } catch (error) {
      console.error('[VectorEmbedding] Error deleting vectors:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{ count: number; dimensions: number }> {
    if (!this.vectorize) {
      return { count: 0, dimensions: 0 };
    }

    try {
      const info = await this.vectorize.describe();
      // @ts-ignore - Vectorize API types may not be fully defined
      const count = (info as any).count || 0;
      // @ts-ignore - Vectorize API types may not be fully defined
      const dimensions = (info as any).dimensions || this.embeddingDimensions;
      return { count, dimensions };
    } catch (error) {
      console.error('[VectorEmbedding] Error getting stats:', error);
      return { count: 0, dimensions: 0 };
    }
  }
}

// Singleton instance
let vectorEmbeddingService: VectorEmbeddingService | null = null;

/**
 * Get or create the Vector Embedding Service instance
 */
export async function getVectorEmbeddingService(
  vectorize?: VectorizeIndex,
  openaiApiKey?: string
): Promise<VectorEmbeddingService> {
  if (!vectorEmbeddingService) {
    vectorEmbeddingService = new VectorEmbeddingService(vectorize, openaiApiKey);
    await vectorEmbeddingService.initialize();
  }
  return vectorEmbeddingService;
}

export type { EmbeddingVector, SemanticSearchResult };
