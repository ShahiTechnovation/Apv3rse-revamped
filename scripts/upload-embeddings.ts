/**
 * Upload Embeddings to Cloudflare Vectorize
 * 
 * This script uploads generated embeddings to your Vectorize index.
 * Run this after generate-embeddings.ts
 * 
 * Usage:
 *   npm run upload-embeddings
 * 
 * Requirements:
 *   - wrangler CLI authenticated
 *   - Vectorize index created
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTORIZE_INDEX = 'aptos-move-docs';
const BATCH_SIZE = 100; // Vectors per batch

interface Vector {
  id: string;
  values: number[];
  metadata: any;
}

/**
 * Upload vectors in batches using Wrangler CLI
 */
async function uploadVectors(vectors: Vector[]): Promise<void> {
  console.log(`\n📤 Uploading ${vectors.length} vectors to Vectorize index: ${VECTORIZE_INDEX}`);

  // Split into batches
  const batches: Vector[][] = [];
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    batches.push(vectors.slice(i, i + BATCH_SIZE));
  }

  console.log(`   Processing ${batches.length} batches of ${BATCH_SIZE} vectors each\n`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 Uploading batch ${i + 1}/${batches.length} (${batch.length} vectors)...`);

    try {
      // Create temp file for batch
      const tempFile = path.join(__dirname, `temp-batch-${i}.ndjson`);
      const ndjson = batch.map(v => JSON.stringify(v)).join('\n');
      await fs.writeFile(tempFile, ndjson);

      // Upload using wrangler
      await runCommand(`wrangler vectorize insert ${VECTORIZE_INDEX} --file=${tempFile}`);

      // Clean up temp file
      await fs.unlink(tempFile);

      console.log(`✓ Batch ${i + 1} uploaded successfully\n`);
    } catch (error) {
      console.error(`✗ Error uploading batch ${i + 1}:`, error);
      throw error;
    }
  }

  console.log('✅ All embeddings uploaded successfully!\n');
}

/**
 * Run shell command
 */
function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: 'inherit' });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}: ${command}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check if Vectorize index exists
 */
async function checkIndex(): Promise<boolean> {
  try {
    console.log(`🔍 Checking if index '${VECTORIZE_INDEX}' exists...`);
    await runCommand(`wrangler vectorize get ${VECTORIZE_INDEX}`);
    console.log(`✓ Index found\n`);
    return true;
  } catch (error) {
    console.log(`✗ Index not found\n`);
    return false;
  }
}

/**
 * Create Vectorize index
 */
async function createIndex(): Promise<void> {
  console.log(`📝 Creating Vectorize index '${VECTORIZE_INDEX}'...`);
  try {
    await runCommand(
      `wrangler vectorize create ${VECTORIZE_INDEX} --dimensions=1536 --metric=cosine`
    );
    console.log(`✓ Index created successfully\n`);
  } catch (error) {
    console.error('✗ Failed to create index:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Cloudflare Vectorize Upload Tool\n');

  try {
    // Check if embeddings file exists
    const embeddingsPath = path.join(__dirname, '..', 'ai', 'embeddings.json');
    let vectors: Vector[];

    try {
      const content = await fs.readFile(embeddingsPath, 'utf-8');
      vectors = JSON.parse(content);
      console.log(`📊 Loaded ${vectors.length} vectors from embeddings.json\n`);
    } catch (error) {
      console.error('❌ Error: embeddings.json not found');
      console.log('\nPlease run the embedding generation script first:');
      console.log('  npm run generate-embeddings\n');
      process.exit(1);
    }

    // Check if index exists
    const indexExists = await checkIndex();
    if (!indexExists) {
      console.log('Creating new index...\n');
      await createIndex();
    }

    // Upload vectors
    await uploadVectors(vectors);

    console.log('✅ Upload complete!');
    console.log('\nYour semantic search is now ready to use.');
    console.log('Start your dev server and try making Aptos-related queries!\n');
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

main();
