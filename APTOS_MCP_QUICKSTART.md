# Aptos MCP & llms.txt Quick Start

## 🚀 What's New?

Your project now has **server-side Aptos MCP integration** and **automatic documentation context enhancement**!

## ⚡ Quick Setup (3 Steps)

### 1. Get Your Bot Key
1. Visit [https://geomi.dev/](https://geomi.dev/)
2. Click your name → **Bot Keys** → **Create Bot Key**
3. Copy the key

### 2. Set Environment Variable
Create `.env` or `.env.local`:
```env
APTOS_BOT_KEY=your-key-here
```

### 3. Install & Run
```bash
npm install
npm run dev
```

That's it! 🎉

## 🧪 Test It

### In Your Chat Interface

**Try these prompts:**

```
Create a simple Move module for a counter
```

```
How do I create an NFT collection on Aptos?
```

```
Write a Move smart contract for a token swap
```

The AI will now have **official Aptos documentation** as context and generate much better Move code!

### Enable Aptos Mode

In your frontend code:
```typescript
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages: [...],
    isAptosMode: true,  // ← Add this!
  }),
});
```

## 🔧 What Happens Behind the Scenes?

1. **Your prompt** → Detected as Aptos-related
2. **System fetches** relevant docs from cached llms.txt
3. **AI receives** enhanced prompt with official Aptos documentation
4. **Better code** generated using real examples and best practices!

## 📊 Check Status

```bash
curl http://localhost:5173/api/aptos-context
```

Response:
```json
{
  "success": true,
  "stats": {
    "isCached": true,
    "topicCount": 150,
    "cacheAge": 3600000
  }
}
```

## 🛠️ Available MCP Tools

Your backend can now:
- ✅ Compile Move code
- ✅ Deploy contracts to devnet/testnet/mainnet
- ✅ Create Aptos accounts
- ✅ Execute Move functions
- ✅ Query blockchain state

## 📚 Full Documentation

See [APTOS_MCP_INTEGRATION.md](./APTOS_MCP_INTEGRATION.md) for complete details.

## 🎯 Benefits

- **Accurate Move code** - AI knows the latest Aptos syntax
- **Security best practices** - Follows official guidelines
- **Real examples** - Uses patterns from aptos.dev
- **Error handling** - Knows Aptos error codes
- **SDK usage** - Correct TypeScript/Python/Rust SDK examples

## 🔥 Pro Tips

1. **First request is slow** - Cache initialization downloads docs (one-time)
2. **Cache refreshes daily** - Always up-to-date with aptos.dev
3. **Auto-detection works** - No need to always set `isAptosMode: true`
4. **Token-limited** - Only relevant docs are included (not the entire site)

---

**Ready to build amazing Aptos dApps with AI! 🚀**
