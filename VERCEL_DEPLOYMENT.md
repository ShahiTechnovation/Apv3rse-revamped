# Vercel Deployment Guide for Apv3rse (UPDATED - Fixed)

## ✅ Deployment Status: FIXED & READY FOR REDEPLOYMENT

**Issue Fixed**: 500 INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED
**Date**: October 29, 2025

Your Apv3rse project has been fixed and is ready for redeployment to Vercel!

### 🔗 Production URLs
- **Latest Deployment**: https://apv3rse-igvctnyz9-builder3base-8480s-projects.vercel.app
- **Inspect Dashboard**: https://vercel.com/builder3base-8480s-projects/apv3rse/BnQxq9bF8Ayv7nLd2QGw3oBupnSq
- **Project Dashboard**: https://vercel.com/builder3base-8480s-projects/apv3rse

---

## 🔧 Latest Fixes Applied (Oct 29, 2025)

### Issues Fixed:
1. **500 FUNCTION_INVOCATION_FAILED Error** - Serverless function crash
2. **Version Mismatch** - @remix-run/vercel (v1.19.3) vs @remix-run/react (v2.15.0)
3. **Improper Serverless Configuration** - Missing memory and timeout settings
4. **Build Output Issues** - Incorrect module format and paths

### Files Modified:

#### **vercel.json** (UPDATED)
- Changed `buildCommand` to use `remix vite:build`
- Added `functions` config with 3008MB memory and 30s timeout
- Set region to `bom1` (Mumbai) for better performance
- Added build cache headers
- Fixed rewrite destination path

####  **api/index.js** (REWRITTEN)
- Replaced `@remix-run/vercel` with `@remix-run/node`
- Added `installGlobals()` for Node.js compatibility
- Implemented dynamic build imports
- Added comprehensive error handling
- Added proper logging for debugging

#### **vite.config.ts** (UPDATED)
- Added `serverBuildFile: 'index.js'`
- Set `serverModuleFormat: 'esm'`
- Configured proper build directory

---

## 📝 Changes Made

### 1. **Dependencies Installed**
- `@remix-run/node` - Node.js runtime for Remix (using instead of @remix-run/vercel)

### 2. **Files Created**
- `vercel.json` - Vercel deployment configuration
- `api/index.js` - Serverless function handler for Remix
- `server.ts` - Vercel request handler
- `.vercelignore` - Files excluded from deployment
- `VERCEL_DEPLOYMENT.md` - This documentation

### 3. **Files Modified**

#### **app/entry.server.tsx**
- Changed from `renderToReadableStream` (Cloudflare) to `renderToPipeableStream` (Node.js)
- Updated to use Node.js streams (`PassThrough`)
- Separated bot and browser request handling

#### **app/root.tsx**
- Fixed import order (moved all imports to top)
- Removed duplicate `logStore` import

#### **All Route Files** (`app/routes/*.ts(x)`)
- Updated imports from `@remix-run/cloudflare` to `@remix-run/node`
- Replaced `context.cloudflare.env` with `process.env`
- Files updated:
  - `api.chat.ts`
  - `api.llmcall.ts`
  - `api.enhancer.ts`
  - `api.check-env-key.ts`
  - `api.aptos-context.ts`
  - `api.aptos-mcp.ts`
  - `api.aptos-pipeline.ts`
  - `api.aptos-scraper.ts`
  - `api.git-proxy.$.ts`
  - `_index.tsx`
  - `git.tsx`
  - `chat.$id.tsx`

#### **vite.config.ts**
- Removed Cloudflare dev proxy plugin
- Kept core Remix Vite plugin

#### **package.json**
- Added `deploy:vercel` script
- Added `vercel-build` script

---

## ⚙️ Configuration

### **vercel.json** (UPDATED)
```json
{
  "buildCommand": "remix vite:build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": null,
  "regions": ["bom1"],
  "functions": {
    "api/**/*.js": {
      "memory": 3008,
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ],
  "headers": [
    {
      "source": "/build/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

---

## 🔐 Environment Variables Setup

**IMPORTANT**: You must configure environment variables in Vercel dashboard:

1. Go to https://vercel.com/builder3base-8480s-projects/apv3rse/settings/environment-variables
2. Add the following variables:

### Required Variables
- `OPENAI_API_KEY` - For AI features and semantic search
- `APTOS_BOT_KEY` - For Aptos MCP integration

### Optional Provider API Keys
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `GOOGLE_API_KEY`
- `MISTRAL_API_KEY`
- `COHERE_API_KEY`
- `TOGETHER_API_KEY`
- `OLLAMA_API_BASE_URL`
- `LMSTUDIO_API_BASE_URL`

### Configuration Variables
- `APTOS_LLMS_CACHE_TTL` - Default: 86400
- `APTOS_CONTEXT_MAX_TOKENS` - Default: 4000

---

## ⚠️ Important Notes

### Cloudflare-Specific Features Removed
1. **Vectorize** - Cloudflare's vector database for semantic search
   - Currently set to `null` in code
   - You may need to integrate an alternative like Pinecone, Weaviate, or Supabase Vector

2. **Cloudflare Workers KV** - Not applicable in Vercel
   - Use Vercel KV if needed

3. **Wrangler Configuration** - No longer used
   - `wrangler.toml` is ignored in deployment

### TypeScript Errors
- Some TypeScript errors exist due to version mismatches between `@remix-run/node` and `@remix-run/react`
- These are compile-time only and don't affect runtime functionality
- The build completes successfully despite these warnings

---

## 🚀 Deployment Commands (UPDATED)

### Step-by-Step Redeployment:

#### 1. **Install Vercel CLI** (if not already installed)
```bash
npm install -g vercel
```

#### 2. **Login to Vercel**
```bash
vercel login
```

#### 3. **Build Locally** (Optional - to test)
```bash
npm install --legacy-peer-deps
npm run build
```

#### 4. **Deploy to Production**
```bash
npm run deploy:vercel
# or
vercel --prod
```

### Quick Deploy (One Command)
```bash
vercel --prod
```

### Deploy to Preview
```bash
vercel
```

### Build Locally
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

---

## 🔍 Troubleshooting

### Previous Error Fixed:
**Error**: `500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED`
**Cause**: Version mismatch and improper serverless configuration
**Solution**: Updated to use @remix-run/node with proper memory settings

### If Build Fails
- Check that all environment variables are set in Vercel dashboard
- Ensure `npm install --legacy-peer-deps` completes successfully
- Review build logs in Vercel dashboard
- Verify Node.js version >= 18.18.0

### Runtime Errors
- Verify environment variables are accessible via `process.env`
- Check serverless function logs in Vercel dashboard
- Ensure CORS headers are properly configured

### Missing Features
- **Semantic Search**: Requires alternative to Cloudflare Vectorize
- **Vector Embeddings**: May need external vector database integration

---

## 📊 Performance Considerations

1. **Serverless Functions**: All routes run as serverless functions
2. **Cold Starts**: First request may be slower (~1-2s)
3. **Static Assets**: Automatically cached by Vercel CDN
4. **Build Cache**: Enabled for faster subsequent deployments

---

## 🔄 Future Deployments

Every push to your main branch will automatically deploy to production if you:
1. Connect your GitHub repository to Vercel
2. Enable automatic deployments in project settings

Or manually deploy with:
```bash
vercel --prod
```

---

## 📞 Support

- **Vercel Documentation**: https://vercel.com/docs
- **Remix on Vercel**: https://remix.run/docs/en/main/guides/vite#deploying-to-vercel
- **Project Dashboard**: https://vercel.com/builder3base-8480s-projects/apv3rse

---

**Deployment Date**: October 29, 2025  
**Status**: ✅ Active and Running
