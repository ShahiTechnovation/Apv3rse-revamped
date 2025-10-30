# 🧠 Aptos Move Knowledge Base Implementation

## Overview
This document explains how the Aptos Move language knowledge base is integrated into the LLM code generation system to provide accurate, secure, and verified Move smart contract assistance.

---

## 📁 File Structure

```
/ai/
├── llms.txt                # Move language reference and patterns
└── system_prompt.json      # System prompt for LLM initialization

/app/lib/.server/
├── aptos-prompt-enhancer.ts     # Main prompt enhancement logic
├── aptos-context-service.ts     # Context retrieval from llms.txt
├── aptos-mcp-service.ts         # MCP server integration
└── llm/
    └── stream-text.ts           # LLM streaming with Aptos context

/app/routes/
└── api.chat.ts                  # Chat API with Aptos mode
```

---

## 🎯 How It Works

### 1. Knowledge Base Files

#### **ai/llms.txt**
Contains comprehensive Move language reference:
- Module essentials and structure
- Resource patterns and ownership
- Common framework imports
- NFT and token standards
- Security best practices
- Code examples and patterns
- Storage guidelines

#### **ai/system_prompt.json**
Structured prompt template for:
- Knowledge scope definition
- Core concepts summary
- Security guidelines
- Best practices
- Fallback instructions

### 2. Prompt Enhancement Pipeline

```
User Query
    ↓
Is Aptos-related?
    ↓ Yes
Retrieve Context from llms.txt
    ↓
Build Enhanced System Prompt
    ↓
Combine with User Prompt
    ↓
Send to LLM
    ↓
Receive Move Code
```

### 3. Integration Points

#### **A. Chat API (`api.chat.ts`)**
```typescript
// Check if Aptos mode is enabled
if (isAptosMode && messages.length > 0) {
  const promptEnhancer = await getAptosPromptEnhancer();
  const enhanced = await promptEnhancer.enhancePrompt(
    lastMessage.content, 
    isAptosMode
  );
  
  // Enhanced prompt includes system context
  aptosSystemPrompt = enhanced.systemPrompt;
}
```

#### **B. Stream Text (`stream-text.ts`)**
```typescript
// Prepend Aptos system prompt if provided
if (aptosSystemPrompt) {
  systemPrompt = `${aptosSystemPrompt}\n\n---\n\n${systemPrompt}`;
}
```

#### **C. Prompt Enhancer (`aptos-prompt-enhancer.ts`)**
```typescript
private getBaseAptosSystemPrompt(): string {
  // Returns comprehensive Move language guidelines
  // Including:
  // - Module structure
  // - Resource patterns
  // - Security rules
  // - Common imports
  // - Event patterns
  // - Error handling
}
```

---

## 🔒 Security Features

### 1. Input Validation Rules
The system prompt enforces:
```move
// Always validate inputs
assert!(amount > 0, EINVALID_AMOUNT);
assert!(addr != @0x0, EINVALID_ADDRESS);
assert!(vector::length(&items) <= MAX_ITEMS, ETOO_MANY_ITEMS);
```

### 2. Signer Verification
```move
// Always check signer before state changes
public entry fun protected(account: &signer) {
    let addr = signer::address_of(account);
    assert!(addr == @owner, ENOT_OWNER);
    // ... perform action ...
}
```

### 3. Resource Existence Checks
```move
// Check before accessing resources
assert!(exists<MyResource>(addr), ERESOURCE_NOT_FOUND);
let resource = borrow_global<MyResource>(addr);
```

### 4. Event Emission
```move
// Always emit events for important actions
#[event]
struct MintEvent has drop, store {
    minter: address,
    token_id: u64,
    timestamp: u64,
}

event::emit(MintEvent { /* ... */ });
```

---

## 📚 Supported Smart Contract Categories

### 1. NFT Minting Modules
```move
use aptos_token::collection;
use aptos_token::token;

// Creates collections and mints tokens
// Uses proper royalty and metadata patterns
```

### 2. Governance Tokens
```move
use aptos_framework::fungible_asset;

// Implements FA standard
// Supports mint, burn, transfer with proper refs
```

### 3. Tokenized Codebase References
```move
struct CodebaseReference has key {
    ipfs_hash: String,
    commit_hash: String,
    timestamp: u64,
}

// Stores project metadata on-chain
```

### 4. Social Media Posts
```move
struct Post has key, store {
    content_hash: String,
    author: address,
    timestamp: u64,
}

// On-chain social interactions
```

---

## 🎓 Code Generation Standards

### Module Template
```move
module <address>::<module_name> {
    use aptos_framework::...;
    use std::...;

    /// Error codes
    const ECODE: u64 = 1;

    /// Resource definitions
    struct MyResource has key {
        value: u64,
    }

    /// Events
    #[event]
    struct MyEvent has drop, store {
        data: u64,
    }

    /// Entry functions
    public entry fun initialize(account: &signer) {
        // Implementation
    }

    /// View functions
    #[view]
    public fun get_value(addr: address): u64 {
        // Read-only logic
    }

    /// Tests
    #[test]
    fun test_initialize() {
        // Test logic
    }
}
```

---

## 🚀 Usage Examples

### Enable Aptos Mode in UI
```typescript
// In your chat component
const [isAptosMode, setIsAptosMode] = useState(true);

// Send with request
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    messages,
    isAptosMode,
    // ...
  })
});
```

### Query Examples

#### ✅ Good Queries
```
"Write a Move module to mint NFTs with royalties"
"Create a governance token using fungible asset standard"
"Fix EALREADY_EXISTS error in my resource initialization"
"How to emit events for token transfers?"
```

#### ❌ Bad Queries
```
"Write me some blockchain code"  // Too vague
"Make it faster"  // No context
"Add database connection"  // Not Move-related
```

---

## 🛠️ Configuration

### Temperature Settings
For Move code generation, use **low temperature** (0.1-0.3):
```typescript
const modelSettings = {
  temperature: 0.2,  // Deterministic code
  maxTokens: 4000,
};
```

### Context Window
- **Small context**: Basic patterns (~2KB)
- **Full context**: Complete reference (~10KB)
- Automatically selected based on query complexity

---

## 📊 Quality Assurance

### The system enforces:

1. **Syntax Correctness**
   - Proper module declaration
   - Correct import statements
   - Valid ability annotations

2. **Security Standards**
   - Signer verification
   - Input validation
   - Resource checks
   - Error handling

3. **Best Practices**
   - Event emission
   - Clear naming
   - Proper documentation
   - Test inclusion

4. **Framework Compliance**
   - Uses official Aptos modules
   - Follows token standards
   - Respects gas optimization

---

## 🔍 Debugging

### Check if Aptos Mode is Active
```typescript
// In browser console
localStorage.getItem('aptos-mode')
```

### View Enhanced Prompt
```typescript
// In api.chat.ts, add logging
console.log('Aptos System Prompt:', aptosSystemPrompt);
```

### Verify Context Loading
```typescript
// In aptos-context-service.ts
console.log('Loaded llms.txt:', contextContent.length);
```

---

## 🎯 Benefits

### For Developers
- ✅ Accurate Move syntax
- ✅ Security-first code generation
- ✅ Standard-compliant patterns
- ✅ Best practice enforcement
- ✅ Educational explanations

### For Code Quality
- ✅ No hallucinated functions
- ✅ Verified framework imports
- ✅ Proper error handling
- ✅ Gas-optimized patterns
- ✅ Test-ready code

### For Security
- ✅ Input validation enforced
- ✅ Signer checks required
- ✅ Resource safety guaranteed
- ✅ Event emission included
- ✅ Access control patterns

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Move Prover integration for formal verification
- [ ] Real-time compilation feedback
- [ ] Gas cost estimation
- [ ] Automatic test generation
- [ ] Code style linting
- [ ] Security vulnerability scanning

### Extended Knowledge Base
- [ ] Advanced DeFi patterns
- [ ] Cross-contract interactions
- [ ] Upgradability patterns
- [ ] Indexer integration
- [ ] Multi-sig patterns

---

## 📖 References

### Official Documentation
- **Aptos Docs**: https://aptos.dev/
- **Move Language**: https://aptos.dev/move/
- **Token Standards**: https://aptos.dev/standards/
- **Best Practices**: https://aptos.dev/guides/

### Community Resources
- **Aptos Discord**: https://discord.gg/aptoslabs
- **Move Examples**: https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples
- **Developer Forum**: https://forum.aptoslabs.com/

---

## 🆘 Troubleshooting

### Issue: Generated code has syntax errors
**Solution**: Check if `llms.txt` is properly loaded
```typescript
const context = await contextService.getRelevantContext(prompt);
console.log('Context length:', context.length);
```

### Issue: Security patterns not applied
**Solution**: Verify system prompt is prepended
```typescript
// In stream-text.ts
console.log('Final system prompt:', systemPrompt.substring(0, 500));
```

### Issue: Wrong framework imports
**Solution**: Update `llms.txt` with correct import paths

---

## ✅ Verification Checklist

Before deploying:
- [ ] `llms.txt` contains latest Move patterns
- [ ] `system_prompt.json` is up to date
- [ ] Aptos mode toggle works in UI
- [ ] Generated code compiles with `aptos move compile`
- [ ] Security checks are enforced
- [ ] Events are properly emitted
- [ ] Error codes are unique
- [ ] Tests pass

---

**Built with ❤️ for the Aptos Developer Community**

*Last Updated: [Current Date]*
