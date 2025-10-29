# Aptos MCP & llms.txt Integration Guide

## Overview

This project now includes **server-side integration** with:
1. **Aptos MCP (Model Context Protocol)** - Direct blockchain interaction tools
2. **Aptos llms.txt Documentation** - Cached official Aptos docs for AI context enhancement

## Architecture

```
User Prompt (Frontend)
    ↓
Chat API (/api/chat)
    ↓
Aptos Prompt Enhancer
    ↓
Aptos Context Service → llms.txt Cache (https://aptos.dev/llms-*.txt)
    ↓
Enhanced Prompt with Context
    ↓
LLM (with Aptos knowledge)
    ↓
Better Move Code Generation
    ↓
(Optional) Aptos MCP Service → Compile/Deploy
```

## Features

### 1. Automatic Context Enhancement
- **Detects Aptos-related queries** automatically
- **Fetches relevant documentation** from cached llms.txt files
- **Injects context** into AI prompts for better code generation
- **Smart file selection**: Uses `llms-small.txt` for simple queries, `llms-full.txt` for complex ones

### 2. Server-Side MCP Tools
- **Compile Move code** without external tools
- **Deploy contracts** to devnet/testnet/mainnet
- **Create Aptos accounts**
- **Execute Move functions**
- **Query blockchain state**

### 3. Intelligent Caching
- **24-hour cache** of Aptos documentation (configurable)
- **Topic indexing** for fast retrieval
- **Automatic refresh** when cache expires
- **Token-limited context** to avoid overwhelming the LLM

## Setup

### 1. Environment Variables

Create a `.env` file (or `.env.local`):

```env
# Required: Get from https://geomi.dev/
APTOS_BOT_KEY=your-geomi-bot-key-here

# Optional: Cache configuration
APTOS_LLMS_CACHE_TTL=86400          # 24 hours in seconds
APTOS_CONTEXT_MAX_TOKENS=4000       # Max tokens for context
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

The `@aptos-labs/aptos-mcp` package is already added to `package.json`.

### 3. Get Your Geomi Bot Key

1. Visit [https://geomi.dev/](https://geomi.dev/)
2. Log in with your account
3. Navigate to **Bot Keys** section
4. Click **Create Bot Key**
5. Copy the key and add it to your `.env` file

## Usage

### Frontend Integration

When sending chat messages, include the `isAptosMode` flag:

```typescript
// In your chat component
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [...],
    isAptosMode: true,  // Enable Aptos context enhancement
    // ... other params
  }),
});
```

### Automatic Detection

The system can also **auto-detect** Aptos queries based on keywords:
- move, aptos, blockchain, smart contract, dapp
- nft, token, fungible asset, module, resource
- signer, account, transaction, deploy, compile
- And many more...

### Using MCP Tools

#### Compile Move Code

```typescript
const response = await fetch('/api/aptos-mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'compile',
    params: {
      code: 'module 0x1::hello_world { ... }',
      moduleName: 'hello_world',
    },
  }),
});

const result = await response.json();
// { success: true, bytecode: '...', warnings: [] }
```

#### Deploy Contract

```typescript
const response = await fetch('/api/aptos-mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'deploy',
    params: {
      bytecode: '...',
      network: 'devnet',
      privateKey: 'optional-private-key',
    },
  }),
});

const result = await response.json();
// { success: true, transactionHash: '0x...', address: '0x...' }
```

#### Create Account

```typescript
const response = await fetch('/api/aptos-mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'createAccount',
    params: {},
  }),
});

const result = await response.json();
// { success: true, data: { address: '0x...', privateKey: '...' } }
```

### Context Management

#### Get Cache Statistics

```typescript
const response = await fetch('/api/aptos-context');
const stats = await response.json();
// {
//   success: true,
//   stats: {
//     isCached: true,
//     lastFetch: 1234567890,
//     topicCount: 150,
//     cacheAge: 3600000
//   }
// }
```

#### Manually Refresh Cache

```typescript
const response = await fetch('/api/aptos-context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'refreshCache',
  }),
});
```

#### Check if Query is Aptos-Related

```typescript
const response = await fetch('/api/aptos-context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'isAptosQuery',
    params: { query: 'How do I create a Move module?' },
  }),
});

const result = await response.json();
// { success: true, isAptosQuery: true }
```

## How It Works

### Context Enhancement Flow

1. **User sends a prompt** with `isAptosMode: true`
2. **Aptos Prompt Enhancer** analyzes the query
3. **Context Service** fetches relevant sections from cached llms.txt
4. **System prompt is enhanced** with official Aptos documentation
5. **LLM generates code** with accurate Aptos/Move knowledge
6. **(Optional)** Code is compiled/deployed via MCP

### Example Enhanced Prompt

**User Input:**
```
Create a simple NFT collection in Move
```

**Enhanced System Prompt (Automatically Added):**
```
You are an expert Aptos blockchain developer...

## Aptos Documentation Reference

# Aptos Digital Asset Standard
...official documentation about NFTs...

# Creating Tokens
...code examples from aptos.dev...

---

[Your original system prompt]
```

**Result:** Much better Move code that follows Aptos best practices!

## Benefits

✅ **Accurate Code Generation** - AI has official Aptos docs as reference  
✅ **Up-to-Date Information** - Cache refreshes daily from aptos.dev  
✅ **Better Error Handling** - AI knows Aptos error codes and solutions  
✅ **Security Best Practices** - Follows official security guidelines  
✅ **SDK Integration** - Correct usage of Aptos SDKs  
✅ **Automated Deployment** - Compile and deploy directly from chat  

## File Structure

```
app/
├── lib/
│   └── .server/
│       ├── aptos-context-service.ts      # llms.txt caching & retrieval
│       ├── aptos-mcp-service.ts          # MCP server integration
│       └── aptos-prompt-enhancer.ts      # Prompt enhancement logic
├── routes/
│   ├── api.chat.ts                       # Modified to use context
│   ├── api.aptos-mcp.ts                  # MCP tool endpoints
│   └── api.aptos-context.ts              # Context management endpoints
└── .env.example                          # Environment variables template
```

## Troubleshooting

### MCP Server Not Starting

**Issue:** `APTOS_BOT_KEY not set` warning

**Solution:** Make sure you've added your Geomi bot key to `.env`:
```env
APTOS_BOT_KEY=your-actual-key-here
```

### Context Not Loading

**Issue:** Cache fails to initialize

**Solution:** Check your internet connection and firewall settings. The service needs to fetch from `https://aptos.dev/`.

### Slow First Request

**Issue:** First Aptos query takes a long time

**Solution:** This is normal! The first request initializes the cache by downloading all llms.txt files. Subsequent requests are much faster.

## Advanced Configuration

### Custom Cache TTL

```env
# Refresh cache every 12 hours instead of 24
APTOS_LLMS_CACHE_TTL=43200
```

### Adjust Context Token Limit

```env
# Increase context size for more detailed documentation
APTOS_CONTEXT_MAX_TOKENS=8000
```

## Next Steps

1. **Test the integration** with various Aptos prompts
2. **Monitor cache performance** via `/api/aptos-context`
3. **Integrate with your existing Aptos UI** components
4. **Add rate limiting** for production use
5. **Implement error tracking** for MCP operations

## Resources

- [Aptos Documentation](https://aptos.dev/)
- [Aptos MCP GitHub](https://github.com/aptos-labs/aptos-mcp)
- [Geomi Platform](https://geomi.dev/)
- [Move Language Book](https://move-language.github.io/move/)

## Support

For issues or questions:
1. Check the logs in your console
2. Verify environment variables are set correctly
3. Ensure you have a valid Geomi bot key
4. Check that `@aptos-labs/aptos-mcp` is installed

---

**Status:** ✅ Fully Integrated and Ready to Use!
