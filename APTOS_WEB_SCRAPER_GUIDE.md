# Aptos Web Scraper & Contract Verification System

## 🎯 Overview

The Aptos Web Scraper system fetches, verifies, and integrates the latest Aptos documentation and contract examples to enhance AI code generation quality. It ensures all generated Move code follows official best practices and security guidelines.

---

## 🚀 Features

### **1. Documentation Scraping**
- Fetches latest content from aptos.dev
- Extracts Move code examples
- Caches results for 24 hours
- Categorizes content (docs, tutorials, examples, reference)

### **2. Contract Verification**
- Validates Move contract security
- Checks for required patterns
- Identifies potential issues
- Provides improvement suggestions

### **3. Enhanced System Prompts**
- Integrates scraped best practices
- Adds verified code patterns
- Updates security guidelines
- Improves AI code generation

---

## 📁 File Structure

```
app/lib/.server/
└── aptos-web-scraper.ts       # Main scraper service

app/routes/
└── api.aptos-scraper.ts       # API endpoints

ai/
└── system_prompt.json         # Enhanced with scraped data
```

---

## 🔧 Installation

### **1. Install Dependencies**

The scraper uses `cheerio` for HTML parsing:

```bash
npm install cheerio
# or
pnpm add cheerio
```

Already added to `package.json`:
```json
{
  "dependencies": {
    "cheerio": "^1.0.0-rc.12"
  }
}
```

### **2. No Additional Setup Required**
The scraper works out of the box with no API keys or configuration needed.

---

## 📖 API Usage

### **Base URL**
```
POST /api/aptos-scraper
GET /api/aptos-scraper (for stats)
```

### **1. Scrape Documentation**

Fetch and parse Aptos documentation pages:

```typescript
const response = await fetch('/api/aptos-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'scrapeDocumentation',
    params: {
      urls: [
        'https://aptos.dev/move/move-on-aptos',
        'https://aptos.dev/standards/fungible-asset',
      ]
    }
  })
});

const { results } = await response.json();
// results: ScrapedContent[]
```

### **2. Scrape Contract Examples**

Fetch Move contract examples from GitHub:

```typescript
const response = await fetch('/api/aptos-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'scrapeExamples'
  })
});

const { examples } = await response.json();
```

### **3. Verify Contract**

Check Move contract for security issues:

```typescript
const moveCode = `
module 0x1::my_module {
    use std::signer;
    
    public entry fun transfer(from: &signer, to: address, amount: u64) {
        // Contract code here
    }
}
`;

const response = await fetch('/api/aptos-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'verifyContract',
    params: { code: moveCode }
  })
});

const { verification } = await response.json();
console.log('Issues:', verification.issues);
console.log('Suggestions:', verification.suggestions);
console.log('Security Checks:', verification.securityChecks);
```

### **4. Fetch Best Practices**

Get latest Aptos best practices:

```typescript
const response = await fetch('/api/aptos-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'fetchBestPractices'
  })
});

const { bestPractices } = await response.json();
```

### **5. Generate Enhanced Prompt**

Create an enhanced system prompt with scraped data:

```typescript
const response = await fetch('/api/aptos-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generateEnhancedPrompt'
  })
});

const { enhancedPrompt } = await response.json();
// Use this in your AI system prompt
```

### **6. Clear Cache**

Force refresh of cached data:

```typescript
const response = await fetch('/api/aptos-scraper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'clearCache'
  })
});
```

### **7. Get Cache Stats**

Check cache status:

```typescript
const response = await fetch('/api/aptos-scraper');
const { stats } = await response.json();
console.log('Cached URLs:', stats.urls);
console.log('Cache size:', stats.size);
```

---

## 🔍 Contract Verification

### **Security Checks**

The verifier checks for:

1. ✅ **Signer Verification**
   ```move
   let addr = signer::address_of(account);
   assert!(addr == expected, EUNAUTHORIZED);
   ```

2. ✅ **Input Validation**
   ```move
   assert!(amount > 0, EINVALID_AMOUNT);
   ```

3. ✅ **Event Emission**
   ```move
   event::emit(TransferEvent { from, to, amount });
   ```

4. ✅ **Error Handling**
   ```move
   const EUNAUTHORIZED: u64 = 1;
   const EINVALID_AMOUNT: u64 = 2;
   ```

5. ✅ **Proper Types**
   ```move
   struct MyResource has key, store { ... }
   ```

### **Example Verification Result**

```json
{
  "isValid": false,
  "issues": [
    "Missing signer verification - always verify signer::address_of(account)",
    "Missing input validation - validate all parameters"
  ],
  "suggestions": [
    "Add: let addr = signer::address_of(account); assert!(addr == expected, ERROR_CODE);",
    "Add: assert!(amount > 0, EINVALID_AMOUNT);",
    "Consider emitting events for important state changes"
  ],
  "securityChecks": {
    "hasSignerVerification": false,
    "hasInputValidation": false,
    "hasEventEmission": true,
    "hasErrorHandling": true,
    "usesProperTypes": true
  }
}
```

---

## 🎨 Scraped Content Structure

```typescript
interface ScrapedContent {
  url: string;
  title: string;
  content: string;              // Extracted text (max 10k chars)
  codeExamples: string[];       // Move code blocks
  lastUpdated: Date;
  category: 'documentation' | 'tutorial' | 'example' | 'reference';
}
```

---

## 🌐 Data Sources

### **Official Aptos Sources**
- **Documentation**: https://aptos.dev
- **GitHub**: https://github.com/aptos-labs/aptos-core
- **Move Book**: https://move-language.github.io/move
- **Examples**: aptos-core/aptos-move/move-examples

### **Scraped URLs**
```typescript
const APTOS_SOURCES = {
  docs: 'https://aptos.dev',
  github: 'https://github.com/aptos-labs/aptos-core',
  moveBook: 'https://move-language.github.io/move',
  examples: 'https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples',
};
```

---

## ⚡ Performance

### **Caching Strategy**
- **Cache Duration**: 24 hours
- **Rate Limiting**: 1 second between requests
- **Content Limit**: 10,000 characters per page
- **Code Limit**: 5,000 characters per example

### **Optimization**
- In-memory caching with Map
- Automatic cache expiry
- Parallel scraping support
- Graceful error handling

---

## 🔐 Security Features

### **Verification Patterns**

1. **Signer Verification Detection**
   ```regex
   /signer::address_of|assert!\(/
   ```

2. **Input Validation Detection**
   ```regex
   /assert!\(|abort|require/
   ```

3. **Event Emission Detection**
   ```regex
   /event::emit|Event/
   ```

4. **Error Handling Detection**
   ```regex
   /const E[A-Z_]+|abort/
   ```

5. **Resource Abilities Detection**
   ```regex
   /has key|has store|has copy|has drop/
   ```

### **Dangerous Pattern Detection**
- Hardcoded addresses
- Unsafe operations
- Missing acquires annotations
- Unchecked resource access

---

## 📊 Integration with System Prompt

The scraper enhances the AI system prompt with:

### **1. Latest Best Practices**
```
# APTOS MOVE DEVELOPMENT - ENHANCED CONTEXT

## Latest Best Practices (from aptos.dev)
[Scraped content from official docs]

## Verified Move Patterns
[Real examples from aptos-labs/aptos-core]
```

### **2. Security Requirements**
```
## Security Requirements (MANDATORY)
1. Signer Verification: ALWAYS verify...
2. Input Validation: Validate ALL inputs...
3. Event Emission: Emit events for state changes...
```

### **3. Contract Templates**
```
## Contract Structure Template
module my_addr::my_module {
    // Complete verified template
}
```

---

## 🛠️ Usage in Development

### **Automatic Integration**

The scraper automatically enhances AI responses when:
1. User requests Move contract generation
2. User asks for contract verification
3. System prompt is initialized

### **Manual Trigger**

You can manually trigger scraping:

```typescript
import { getAptosWebScraper } from '~/lib/.server/aptos-web-scraper';

const scraper = getAptosWebScraper();

// Scrape documentation
const docs = await scraper.scrapeDocumentation([
  'https://aptos.dev/move/move-on-aptos'
]);

// Verify contract
const verification = scraper.verifyContract(moveCode);

// Generate enhanced prompt
const prompt = await scraper.generateEnhancedPrompt();
```

---

## 📝 Example Workflow

### **1. User Requests Contract**
```
User: "Create an NFT minting contract"
```

### **2. System Scrapes Latest Docs**
```typescript
const scraper = getAptosWebScraper();
const bestPractices = await scraper.fetchBestPractices();
const examples = await scraper.scrapeContractExamples();
```

### **3. AI Generates Code with Context**
```move
module 0x1::nft_minter {
    use aptos_token_objects::token;
    use std::signer;
    
    // Generated with verified patterns
    const EUNAUTHORIZED: u64 = 1;
    
    public entry fun mint_nft(creator: &signer, ...) {
        let addr = signer::address_of(creator);
        assert!(addr == @admin, EUNAUTHORIZED);
        // ... rest of code
    }
}
```

### **4. System Verifies Generated Code**
```typescript
const verification = scraper.verifyContract(generatedCode);
if (!verification.isValid) {
  // Show issues and suggestions to user
}
```

---

## 🎯 Benefits

### **For Developers**
- ✅ Always up-to-date documentation
- ✅ Verified code patterns
- ✅ Security best practices
- ✅ Real-world examples

### **For AI**
- ✅ Enhanced context
- ✅ Verified syntax
- ✅ Better code generation
- ✅ Fewer hallucinations

### **For Projects**
- ✅ Production-ready code
- ✅ Security compliance
- ✅ Best practices enforcement
- ✅ Reduced bugs

---

## 🔄 Update Frequency

- **Cache Refresh**: Every 24 hours
- **Manual Refresh**: Via clearCache() API
- **Auto-refresh**: On cache expiry
- **Rate Limiting**: 1 request/second

---

## 🐛 Troubleshooting

### **Issue: Scraping Fails**
```
Solution: Check internet connection and firewall settings
```

### **Issue: Cache Not Updating**
```
Solution: Call clearCache() API to force refresh
```

### **Issue: Verification Too Strict**
```
Solution: Review suggestions, not all are mandatory
```

---

## 🚀 Future Enhancements

- [ ] Machine learning for pattern recognition
- [ ] Automated security auditing
- [ ] Integration with Move Prover
- [ ] Community pattern submissions
- [ ] Real-time documentation updates
- [ ] Multi-language support
- [ ] Advanced code analysis

---

## 📚 Related Documentation

- [APTOS_MCP_INTEGRATION.md](./APTOS_MCP_INTEGRATION.md) - MCP integration
- [APTOS_EXECUTION_DEMO.md](./APTOS_EXECUTION_DEMO.md) - Execution pipeline
- [ai/system_prompt.json](./ai/system_prompt.json) - Enhanced system prompt

---

**The web scraper ensures your AI assistant generates production-ready, secure, and verified Aptos Move code! 🚀**
