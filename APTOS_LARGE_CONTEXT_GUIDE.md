# Aptos Large Context Management Guide

## Best Practices for 700KB+ Move Contract Contexts

### 1. **Context Chunking Strategy**
Break your large Move contracts into semantic chunks:

```typescript
// Use the AptosContextManager
import { aptosContextManager } from '~/lib/aptos-context-manager';

const processedContext = await aptosContextManager.processLargeContext(
  largeContractCode,
  {
    projectType: 'nft', // or 'defi', 'gaming', 'social'
    priorityModules: ['token_module', 'marketplace_module'],
    includeTests: false
  }
);
```

### 2. **Incremental Development Approach**
Instead of sending entire 700KB at once, build incrementally:

#### Step 1: Core Module Structure
```move
module addr::my_contract {
    // Start with imports and constants
    use std::signer;
    use aptos_framework::coin;
    
    const E_NOT_INITIALIZED: u64 = 1;
}
```

#### Step 2: Add Data Structures
```move
    // Add one struct at a time
    struct State has key {
        admin: address,
        total_supply: u64,
    }
```

#### Step 3: Implement Core Functions
```move
    // Add functions incrementally
    public entry fun initialize(admin: &signer) {
        // Implementation
    }
```

### 3. **Use Reference Patterns**
Instead of full code, use references:

```typescript
// Reference existing patterns
const context = `
// Using NFT pattern from aptos_token_objects
// Similar to: aptos-core/aptos-move/framework/aptos-token-objects
// Key functions: create_collection, mint_token, transfer, burn
// Implement with modifications for: [specific requirements]
`;
```

### 4. **Context Compression Techniques**

#### A. Remove Redundancy
```typescript
// Before: 700KB with repeated patterns
// After: 150KB with pattern references

const compressedContext = `
// PATTERN: Standard NFT Collection
// USE: aptos_token_objects::collection template
// MODIFY: Add batch minting, whitelist, dynamic pricing

// PATTERN: Marketplace
// USE: Standard escrow pattern
// MODIFY: Add royalties, auction mechanism
`;
```

#### B. Use Summaries for Non-Critical Parts
```typescript
const summarizedContext = `
// Module: nft_marketplace (full implementation needed)
// - Functions: list_token (10 lines), buy_token (15 lines), cancel_listing (8 lines)
// - Events: ListingCreated, TokenSold, ListingCancelled
// - Storage: Listings table with price, seller, token_id

// Focus on implementing: auction mechanism with these requirements...
`;
```

### 5. **Smart Context Prioritization**

```typescript
// Prioritize by importance
const prioritizedContext = {
  critical: `
    // Must implement exactly as specified
    public entry fun mint_nft(...) { 
      // Full implementation
    }
  `,
  
  important: `
    // Standard implementation with noted modifications
    // transfer_nft: Standard + add freeze capability
    // burn_nft: Standard + emit custom event
  `,
  
  standard: `
    // Use default implementations from framework
    // View functions: get_balance, get_owner, get_metadata
  `
};
```

### 6. **API-Friendly Formatting**

#### For Move Contracts:
```move
// Compact format for API efficiency
module addr::contract{use std::signer;use std::vector;
struct S has key{a:address,b:u64}
public entry fun f(s:&signer){/*impl*/}}
```

#### With Context Manager:
```typescript
const optimized = await aptosContextManager.processLargeContext(
  fullContract,
  {
    removeComments: true,
    removeTests: true,
    compressWhitespace: true,
    extractOnlySignatures: false
  }
);
```

### 7. **Handling Syntax Errors**

#### Common Move Syntax Issues:
1. **Missing semicolons**: Always end statements with `;`
2. **Incorrect generics**: Use `<T>` not `[T]`
3. **Resource abilities**: Must have at least `key` or `store`
4. **Borrow checking**: Use `&` and `&mut` correctly

#### Validation Before Sending:
```bash
# Validate Move syntax locally first
aptos move compile --package-dir .
aptos move test --package-dir .
```

### 8. **Template-Based Generation**

Use templates to reduce context size:

```typescript
const nftTemplate = {
  base: 'aptos_token_objects',
  modifications: [
    'Add whitelist mechanism',
    'Implement Dutch auction',
    'Add reveal mechanism'
  ],
  skipFeatures: [
    'Soulbound tokens',
    'Composable NFTs'
  ]
};

// This is 1KB instead of 100KB
```

### 9. **Progressive Context Loading**

```typescript
class ProgressiveContextLoader {
  async loadContext(stage: number) {
    switch(stage) {
      case 1:
        return this.loadImportsAndStructs();
      case 2:
        return this.loadCoreFunctions();
      case 3:
        return this.loadEntryFunctions();
      case 4:
        return this.loadViewFunctions();
      case 5:
        return this.loadTests();
    }
  }
}
```

### 10. **Error Recovery Strategy**

If you hit token limits:

1. **Immediate Recovery**:
```typescript
// Reduce context to essentials
const essential = extractEssentials(fullContext);
// Retry with reduced context
```

2. **Chunked Processing**:
```typescript
// Process in multiple requests
const chunks = splitIntoChunks(fullContext, 100000);
for (const chunk of chunks) {
  await processChunk(chunk);
}
```

3. **Use References**:
```typescript
// Reference instead of include
const reference = {
  useModule: 'aptos_framework::coin',
  likeContract: '0x1::aptos_coin',
  withChanges: ['different decimals', 'add freeze']
};
```

## Recommended Workflow for Large Contracts

1. **Start with high-level design** (1KB)
2. **Define core structures** (5KB)
3. **Implement critical functions** (20KB)
4. **Add remaining functions** (50KB)
5. **Include events and errors** (10KB)
6. **Add view functions** (10KB)
7. **Write tests separately** (process later)

## Token Limits by Provider

| Provider | Context Limit | Output Limit | Total |
|----------|--------------|--------------|-------|
| GPT-4 | 128K | 4K | 132K |
| Claude 3 | 200K | 4K | 204K |
| Gemini 1.5 | 1M | 8K | 1M+ |
| OpenRouter | Varies | Varies | Check model |

## Quick Tips

1. **Always validate Move syntax locally first**
2. **Use compression for non-critical sections**
3. **Prioritize implementation over boilerplate**
4. **Reference standard patterns instead of including them**
5. **Break complex contracts into modules**
6. **Use incremental building for large projects**
7. **Cache processed contexts for reuse**
8. **Monitor token usage in responses**

## Example: Processing 700KB NFT Marketplace Contract

```typescript
// Instead of sending 700KB at once:
const processed = await aptosContextManager.processLargeContext(
  largeMarketplaceContract,
  {
    projectType: 'nft',
    priorityModules: ['marketplace', 'auction'],
    includeTests: false
  }
);

// Results in ~150KB optimized context
// Maintains all critical functionality
// Removes redundancy and boilerplate
// Preserves syntax correctness
```

This approach ensures you can work with large Move contracts without hitting API limits or syntax errors.
