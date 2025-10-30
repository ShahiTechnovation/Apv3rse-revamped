# Message Content Structure Fix

## Problem Description

Users were experiencing a validation error when generating code with the AI:

```
Invalid prompt: message must be a CoreMessage or a UI message
Validation error: Type validation failed
Error: Expected string, received array at path [0]["content"][0]["text"]
```

The error indicated that message content had a **double-nested structure** where `text` fields contained arrays instead of strings:

```javascript
// INCORRECT (double-nested):
content: [{ type: "text", text: [{ type: "text", text: "actual text" }] }]

// CORRECT:
content: [{ type: "text", text: "actual text" }]
```

## Root Cause

The issue was in `/app/lib/.server/llm/stream-text.ts`:

1. **Type Mismatch**: The `Message` interface declared `content: string` but the code was handling array content
2. **No Validation**: There was no sanitization of malformed message structures
3. **Unsafe Nesting**: The `extractPropertiesFromMessage` function didn't handle accidentally nested arrays in text fields

## Solutions Implemented

### 1. Updated Message Interface
**File**: `app/lib/.server/llm/stream-text.ts`

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image?: string }>;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
  model?: string;
}
```

### 2. Added Content Sanitization Function
**File**: `app/lib/.server/llm/stream-text.ts`

Created `sanitizeMessageContent()` function that:
- Validates message content structure
- Detects and fixes nested arrays in text fields
- Ensures text fields are always strings
- Preserves image and other content types correctly

```typescript
function sanitizeMessageContent(content: any): string | Array<{ type: string; text?: string; image?: string }> {
  if (typeof content === 'string') return content;
  
  if (Array.isArray(content)) {
    return content.map((item) => {
      if (item.type === 'text') {
        let textValue = item.text;
        
        // Fix nested array structure
        if (Array.isArray(textValue) && textValue.length > 0) {
          const nested = textValue[0];
          textValue = typeof nested === 'object' && nested?.text 
            ? nested.text 
            : String(textValue[0] || '');
        }
        
        return {
          type: 'text',
          text: typeof textValue === 'string' ? textValue : String(textValue || ''),
        };
      }
      return item;
    });
  }
  
  return String(content);
}
```

### 3. Applied Sanitization to All Messages
**File**: `app/lib/.server/llm/stream-text.ts`

```typescript
// Sanitize all incoming messages before processing
const sanitizedMessages = messages.map((message, index) => {
  const originalContent = message.content;
  const sanitizedContent = sanitizeMessageContent(message.content);
  
  // Log if content was modified
  if (JSON.stringify(originalContent) !== JSON.stringify(sanitizedContent)) {
    logger.warn(`Message ${index} content was sanitized.`);
  }
  
  return { ...message, content: sanitizedContent };
});
```

### 4. Enhanced Error Handling
**File**: `app/routes/api.chat.ts`

- Replaced `null` error responses with structured JSON
- Added specific error messages for different error types
- Included both `error` and `details` fields in error responses

**File**: `app/components/chat/Chat.client.tsx`

- Improved client-side error parsing
- Added async error handler to properly read Response objects
- Displays detailed error messages to users

### 5. Fixed Type Safety
**File**: `app/lib/.server/llm/stream-text.ts`

- Updated `extractPropertiesFromMessage` return type
- Added type guards before calling string-only functions
- Improved text extraction from array content

## Testing

To verify the fix works:

1. **Simple Text Prompt**: Try "create an nft minting app"
2. **Aptos Mode**: Use the Aptos toggle and test Move contract generation
3. **With Images**: Upload an image and send a prompt
4. **Different Providers**: Test with Google, Anthropic, OpenAI

## Files Modified

1. `app/lib/.server/llm/stream-text.ts` - Core message processing fixes
2. `app/routes/api.chat.ts` - Enhanced error handling
3. `app/components/chat/Chat.client.tsx` - Better error display

## Prevention

The sanitization function now runs on **all** messages before they reach the AI provider, catching and fixing malformed structures automatically. Detailed logging helps identify when and where malformed messages originate.

## Monitoring

Check server logs for messages like:
```
[stream-text] Message X content was sanitized. Original structure may have been malformed.
```

This indicates a message had incorrect structure that was automatically fixed.
