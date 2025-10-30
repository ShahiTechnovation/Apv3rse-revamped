# Semantic Search Setup Guide

Phase 1 implementation adds vector embeddings and hybrid search to improve Aptos Move code generation accuracy.

## Overview

The semantic search system uses:
- **Cloudflare Vectorize** for vector storage
- **OpenAI text-embedding-3-small** for generating embeddings
- **Hybrid search** combining semantic + keyword matching

## Prerequisites

1. **Cloudflare Account** with Workers/Pages access
2. **OpenAI API Key** for generating embeddings
3. **Wrangler CLI** installed and authenticated

## Setup Instructions

### 1. Install Dependencies

No additional npm packages needed. The system uses Cloudflare's native Vectorize API.

### 2. Set Environment Variables

Add to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Create Vectorize Index

Run this command to create your vector index:

```bash
wrangler vectorize create aptos-move-docs --dimensions=1536 --metric=cosine
```

Expected output:
```
✅ Successfully created index 'aptos-move-docs'
📝 Dimensions: 1536
📏 Metric: cosine
```

### 4. Generate Embeddings

Process your documentation and generate vector embeddings:

```bash
npm run generate-embeddings
```

This will:
- Parse `ai/llms.txt` and `llms.txt`
- Split into semantic chunks
- Generate embeddings via OpenAI API
- Save to `ai/embeddings.json`

**Cost estimate**: ~$0.01-0.05 depending on doc size

### 5. Upload to Vectorize

Upload the generated embeddings to Cloudflare:

```bash
npm run upload-embeddings
```

Or run both steps in one command:

```bash
npm run embeddings
```

### 6. Deploy Configuration

The `wrangler.toml` is already configured with:

```toml
[[vectorize]]
binding = "APTOS_VECTORIZE"
index_name = "aptos-move-docs"
```

Deploy your app:

```bash
npm run build
npm run deploy
```

## Usage

### Automatic Activation

Semantic search activates automatically when:
1. User enables "Aptos Mode" in the UI
2. Query contains Aptos-related keywords
3. OpenAI API key is available
4. Vectorize index is populated

### Search Modes

**Hybrid Search** (default when semantic search available):
- 70% weight for semantic similarity
- 30% weight for keyword matching
- Best of both worlds

**Keyword-Only Fallback**:
- Activates if Vectorize unavailable
- Pure text matching
- Still functional, just less accurate

### Monitoring

Check logs for semantic search status:

```
[AptosContext] Semantic search enabled
[AptosContext] Used hybrid search (5 results)
```

Or fallback mode:

```
[AptosContext] Semantic search disabled (using keyword matching)
[AptosContext] Could not initialize semantic search: ...
```

## Testing

### 1. Test Query Accuracy

Try these queries in Aptos Mode:

**Before semantic search:**
- "prevent reentrancy" → might miss security docs

**After semantic search:**
- "prevent reentrancy" → finds security patterns, external call safety, best practices

### 2. Check Vector Index

```bash
wrangler vectorize get aptos-move-docs
```

Expected output:
```json
{
  "name": "aptos-move-docs",
  "dimensions": 1536,
  "metric": "cosine",
  "count": 150
}
```

### 3. Verify Search Results

Enable debug logging to see search sources:

```typescript
// In your query, check the log output
logger.info(`Enhanced prompt with Aptos context (source: ${enhanced.contextSource})`);
```

## Updating Documentation

When you update `ai/llms.txt` or `llms.txt`:

1. Regenerate embeddings:
   ```bash
   npm run generate-embeddings
   ```

2. Upload new embeddings:
   ```bash
   npm run upload-embeddings
   ```

3. Embeddings are upserted (updated if ID exists)

## Cost Analysis

### Development (Low Usage)
- **Embeddings generation**: $0.02-0.10 one-time
- **Vectorize queries**: ~100 queries = $0.004
- **Total monthly**: ~$5-10

### Production (High Usage)
- **Embeddings updates**: $0.50/month (weekly updates)
- **Vectorize queries**: ~100K queries = $4
- **Total monthly**: ~$20-30

## Troubleshooting

### Semantic Search Not Working

**Check API Key:**
```bash
echo $OPENAI_API_KEY
```

**Check Vectorize Index:**
```bash
wrangler vectorize get aptos-move-docs
```

**Check Embeddings File:**
```bash
ls -lh ai/embeddings.json
```

### Embeddings Generation Fails

**Error: "OpenAI API error: 401"**
- Solution: Check your `OPENAI_API_KEY` is valid

**Error: "Rate limit exceeded"**
- Solution: Reduce `batchSize` in `generate-embeddings.ts`

**Error: "File not found: ai/llms.txt"**
- Solution: Ensure documentation files exist

### Upload Fails

**Error: "Index not found"**
- Solution: Create index with `wrangler vectorize create`

**Error: "Wrangler not authenticated"**
- Solution: Run `wrangler login`

## Architecture

```
┌─────────────────────────────────────┐
│  User Query: "Create NFT collection" │
└──────────────┬──────────────────────┘
               ↓
    ┌──────────────────────┐
    │ AptosPromptEnhancer  │
    │ (api.chat.ts)        │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │ AptosContextService  │
    │ - Keyword search     │
    │ - Semantic search    │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │ VectorEmbeddingService│
    │ - Generate embedding │
    │ - Query Vectorize    │
    │ - Hybrid reranking   │
    └──────────┬───────────┘
               ↓
    ┌──────────────────────┐
    │ Cloudflare Vectorize │
    │ (1536-dim vectors)   │
    └──────────┬───────────┘
               ↓
         Top K Results
               ↓
         LLM Generation
```

## Next Steps (Phase 2)

- [ ] Add GitHub Move examples corpus
- [ ] Integrate Aptos SDK reference docs
- [ ] Add code example search
- [ ] Implement feedback loop for relevance

## Files Created/Modified

**New Files:**
- `app/lib/.server/vector-embedding-service.ts` - Vector search service
- `scripts/generate-embeddings.ts` - Embedding generation
- `scripts/upload-embeddings.ts` - Vectorize upload tool
- `docs/SEMANTIC_SEARCH_SETUP.md` - This guide

**Modified Files:**
- `app/lib/.server/aptos-context-service.ts` - Added hybrid search
- `app/lib/.server/aptos-prompt-enhancer.ts` - Pass Vectorize binding
- `app/routes/api.chat.ts` - Pass environment to enhancer
- `wrangler.toml` - Added Vectorize binding
- `worker-configuration.d.ts` - Added type definitions
- `package.json` - Added embedding scripts

## Support

For issues or questions:
1. Check logs for error messages
2. Verify all setup steps completed
3. Test with simple queries first
4. Check Cloudflare dashboard for Vectorize status
