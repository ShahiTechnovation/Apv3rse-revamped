/**
 * Generate Vector Embeddings for Aptos Documentation
 * 
 * This script processes llms.txt files and generates embeddings for semantic search.
 * Run this script after updating documentation to rebuild the vector index.
 * 
 * Usage:
 *   npm run embeddings
 * 
 * Requirements:
 *   - OPENAI_API_KEY environment variable
 *   - Cloudflare Vectorize index created: wrangler vectorize create aptos-move-docs --dimensions=1536 --metric=cosine
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DocumentChunk {
  id: string;
  content: string;
  topic: string;
  metadata: {
    source: string;
    section: string;
    timestamp: number;
  };
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: { total_tokens: number };
}

class EmbeddingGenerator {
  private openaiApiKey: string;
  private embeddingModel = 'text-embedding-3-small';
  private maxChunkSize = 8000; // characters per chunk
  private batchSize = 100; // embeddings per batch

  constructor(apiKey: string) {
    this.openaiApiKey = apiKey;
  }

  /**
   * Parse llms.txt into structured chunks
   */
  parseDocument(content: string, source: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sections = this.parseMarkdownSections(content);

    sections.forEach((section, index) => {
      const sectionContent = `${section.header}\n${section.content}`.trim();
      
      // Split large sections into smaller chunks
      if (sectionContent.length > this.maxChunkSize) {
        const subChunks = this.splitIntoChunks(sectionContent, this.maxChunkSize);
        subChunks.forEach((chunk, subIndex) => {
          chunks.push({
            id: `${source}-${index}-${subIndex}`,
            content: chunk,
            topic: this.extractTopicFromHeader(section.header),
            metadata: {
              source,
              section: section.header,
              timestamp: Date.now(),
            },
          });
        });
      } else {
        chunks.push({
          id: `${source}-${index}`,
          content: sectionContent,
          topic: this.extractTopicFromHeader(section.header),
          metadata: {
            source,
            section: section.header,
            timestamp: Date.now(),
          },
        });
      }
    });

    return chunks;
  }

  /**
   * Parse markdown into sections
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

    if (currentHeader) {
      sections.push({
        header: currentHeader,
        content: currentContent.join('\n'),
      });
    }

    return sections;
  }

  /**
   * Split text into chunks
   */
  private splitIntoChunks(text: string, maxSize: number): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split('\n\n');
    let currentChunk = '';

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > maxSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Extract topic from header
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
   * Generate embeddings for chunks
   */
  async generateEmbeddings(chunks: DocumentChunk[]): Promise<Array<{ id: string; values: number[]; metadata: any }>> {
    const vectors: Array<{ id: string; values: number[]; metadata: any }> = [];
    let totalTokens = 0;

    console.log(`\n📊 Generating embeddings for ${chunks.length} chunks...`);

    // Process in batches
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      const batchTexts = batch.map(c => c.content);

      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: this.embeddingModel,
            input: batchTexts,
            encoding_format: 'float',
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json() as EmbeddingResponse;
        totalTokens += data.usage.total_tokens;

        // Combine embeddings with chunks
        data.data.forEach((embedding, index) => {
          const chunk = batch[index];
          vectors.push({
            id: chunk.id,
            values: embedding.embedding,
            metadata: {
              content: chunk.content,
              topic: chunk.topic,
              source: chunk.metadata.source,
              timestamp: chunk.metadata.timestamp,
            },
          });
        });

        console.log(`✓ Processed batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(chunks.length / this.batchSize)}`);
      } catch (error) {
        console.error(`✗ Error processing batch ${Math.floor(i / this.batchSize) + 1}:`, error);
        throw error;
      }
    }

    const estimatedCost = (totalTokens / 1_000_000) * 0.02; // $0.02 per 1M tokens
    console.log(`\n💰 Total tokens used: ${totalTokens.toLocaleString()}`);
    console.log(`💵 Estimated cost: $${estimatedCost.toFixed(4)}\n`);

    return vectors;
  }

  /**
   * Save embeddings to JSON file
   */
  async saveEmbeddings(vectors: any[], outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(vectors, null, 2));
    console.log(`💾 Saved ${vectors.length} embeddings to ${outputPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Aptos Documentation Embedding Generator\n');

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('\nPlease set your OpenAI API key:');
    console.log('  export OPENAI_API_KEY=sk-...');
    process.exit(1);
  }

  const generator = new EmbeddingGenerator(apiKey);

  try {
    // Read llms.txt files
    const llmsPath = path.join(__dirname, '..', 'ai', 'llms.txt');
    const llmsTxtPath = path.join(__dirname, '..', 'llms.txt');

    let allChunks: DocumentChunk[] = [];

    // Process ai/llms.txt
    try {
      const llmsContent = await fs.readFile(llmsPath, 'utf-8');
      console.log(`📖 Processing ai/llms.txt (${llmsContent.length} characters)`);
      const chunks = generator.parseDocument(llmsContent, 'llms.txt');
      allChunks = allChunks.concat(chunks);
      console.log(`✓ Extracted ${chunks.length} chunks\n`);
    } catch (error) {
      console.log(`⚠️  ai/llms.txt not found, skipping\n`);
    }

    // Process root llms.txt if different
    try {
      const rootContent = await fs.readFile(llmsTxtPath, 'utf-8');
      console.log(`📖 Processing llms.txt (${rootContent.length} characters)`);
      const chunks = generator.parseDocument(rootContent, 'llms-root.txt');
      allChunks = allChunks.concat(chunks);
      console.log(`✓ Extracted ${chunks.length} chunks\n`);
    } catch (error) {
      console.log(`⚠️  Root llms.txt not found, skipping\n`);
    }

    if (allChunks.length === 0) {
      console.error('❌ No documentation found to process');
      process.exit(1);
    }

    // Generate embeddings
    const vectors = await generator.generateEmbeddings(allChunks);

    // Save to file
    const outputPath = path.join(__dirname, '..', 'ai', 'embeddings.json');
    await generator.saveEmbeddings(vectors, outputPath);

    console.log('\n✅ Embedding generation complete!');
    console.log('\nNext steps:');
    console.log('  1. Upload embeddings to Vectorize:');
    console.log('     node scripts/upload-embeddings.js');
    console.log('  2. Start your dev server to test semantic search\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
