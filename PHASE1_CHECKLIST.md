# Phase 1 Setup Checklist

Quick reference for setting up semantic search. Follow these steps in order.

## ☑️ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] Wrangler authenticated: `wrangler login`
- [ ] OpenAI API key obtained from platform.openai.com

## ☑️ Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add:
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Create Vectorize Index
```bash
wrangler vectorize create aptos-move-docs --dimensions=1536 --metric=cosine
```

Expected output:
```
✅ Successfully created index 'aptos-move-docs'
```

### 4. Generate Embeddings
```bash
npm run generate-embeddings
```

Expected output:
```
🚀 Aptos Documentation Embedding Generator
📖 Processing ai/llms.txt (45000 characters)
✓ Extracted 87 chunks
📊 Generating embeddings for 87 chunks...
✓ Processed batch 1/1
💰 Total tokens used: 12,345
💵 Estimated cost: $0.0247
💾 Saved 87 embeddings to ai/embeddings.json
```

### 5. Upload to Vectorize
```bash
npm run upload-embeddings
```

Expected output:
```
🚀 Cloudflare Vectorize Upload Tool
📊 Loaded 87 vectors from embeddings.json
📦 Uploading batch 1/1 (87 vectors)...
✓ Batch 1 uploaded successfully
✅ All embeddings uploaded successfully!
```

### 6. Build and Deploy
```bash
npm run build
npm run deploy
```

## ☑️ Verification

### Check Vectorize Index
```bash
wrangler vectorize get aptos-move-docs
```

Should show:
```json
{
  "name": "aptos-move-docs",
  "dimensions": 1536,
  "metric": "cosine",
  "count": 87
}
```

### Check Local Files
```bash
# Windows
dir ai\embeddings.json

# Unix/Mac
ls -lh ai/embeddings.json
```

Should show: `~1-2 MB` file size

### Test in Development
```bash
npm run dev
```

1. Open browser to localhost:5173
2. Enable "Aptos Mode"
3. Try query: "Create an NFT collection with security checks"
4. Check browser console for:
   ```
   [AptosContext] Semantic search enabled
   [AptosContext] Used hybrid search (5 results)
   ```

## ☑️ Common Issues

### ❌ "OpenAI API error: 401"
**Fix**: Check your API key is correct in `.env`
```bash
echo $OPENAI_API_KEY  # Should output: sk-...
```

### ❌ "Index not found"
**Fix**: Create the index
```bash
wrangler vectorize create aptos-move-docs --dimensions=1536 --metric=cosine
```

### ❌ "Wrangler not authenticated"
**Fix**: Login to Cloudflare
```bash
wrangler login
```

### ❌ "File not found: ai/llms.txt"
**Fix**: Ensure documentation exists
```bash
# Check if file exists
cat ai/llms.txt
```

### ❌ "Module not found: tsx"
**Fix**: Install dependencies
```bash
npm install
```

## ☑️ Success Indicators

✅ **Embeddings Generated**: `ai/embeddings.json` exists (~1-2 MB)  
✅ **Vectorize Indexed**: `wrangler vectorize get aptos-move-docs` shows count > 0  
✅ **Environment Configured**: `.env` contains `OPENAI_API_KEY`  
✅ **App Deployed**: Accessible at your Cloudflare Pages URL  
✅ **Logs Show Success**: Console displays "Semantic search enabled"  

## ☑️ Next Actions

After successful setup:

1. **Test Queries**: Try various Aptos-related questions
2. **Monitor Logs**: Check for hybrid search usage
3. **Update Docs**: Modify `ai/llms.txt` and rerun `npm run embeddings`
4. **Track Costs**: Monitor OpenAI usage at platform.openai.com

## 📊 Expected Costs

**One-time Setup**: $0.02-0.10  
**Monthly (Dev)**: $5-10  
**Monthly (Prod)**: $20-30  

## 🆘 Need Help?

1. Check full documentation: `docs/SEMANTIC_SEARCH_SETUP.md`
2. Review architecture: `SEMANTIC_SEARCH_README.md`
3. Check logs for detailed error messages
4. Verify all checklist items completed

## 📝 Maintenance

### Weekly
- [ ] Check Vectorize query usage
- [ ] Monitor OpenAI API costs

### When Documentation Updates
```bash
npm run embeddings  # Regenerate and upload
```

### Monthly
- [ ] Review search accuracy
- [ ] Check for new Aptos documentation
- [ ] Update `ai/llms.txt` if needed

---

**Checklist Version**: 1.0  
**Last Updated**: October 29, 2025  
**Completion Time**: ~15 minutes
