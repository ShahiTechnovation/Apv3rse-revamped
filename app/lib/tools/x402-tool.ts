/**
 * x402 Payments Protocol Integration
 * "1 line of code to accept digital dollars. No fee, 2 second settlement, $0.001 minimum payment."
 */

import type { Tool } from './types';

export const X402_CONTEXT = `
═══════════════════════════════════════════════════════════════════════════════
💰 x402 PAYMENTS PROTOCOL INTEGRATION - ALWAYS USE WHEN BUILDING PAID APIS/SERVICES
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: When this tool is enabled, you MUST integrate x402 payment protocol into any API, service, or application being built.

## Overview
x402: "1 line of code to accept digital dollars. No fee, 2 second settlement, $0.001 minimum payment."

Philosophy: Payments on the internet are fundamentally flawed. Credit Cards are high friction, hard to accept, 
have minimum payments that are far too high, and don't fit into the programmatic nature of the internet. 
It's time for an open, internet-native form of payments. A payment rail that doesn't have high minimums + % based fee. 
Payments that are amazing for humans and AI agents.

## Principles
- Open standard: x402 will never force reliance on a single party
- HTTP Native: Seamlessly complements existing HTTP requests, no additional requests needed
- Chain and token agnostic: Supports multiple chains and signing standards
- Trust minimizing: Facilitators/servers cannot move funds outside client intentions
- Easy to use: 10x better than existing payments, abstracting crypto complexity

## REQUIRED DEPENDENCIES

⚠️ MANDATORY: When creating ANY project with x402 enabled, you MUST add these to package.json:

For Server-side (Express, Next.js API, Node.js):
\`\`\`json
{
  "dependencies": {
    "@x402/node": "latest",
    "express": "^4.18.0"
  }
}
\`\`\`

For Client-side applications:
\`\`\`json
{
  "dependencies": {
    "@x402/client": "latest"
  }
}
\`\`\`

For Browser applications:
\`\`\`json
{
  "dependencies": {
    "@x402/browser": "latest"
  }
}
\`\`\`

ALWAYS include @x402/node in server package.json when building APIs or backends.
ALWAYS include @x402/client when building client applications that consume paid APIs.

## Installation

\`\`\`bash
npm install @x402/node @x402/client
# or
pnpm add @x402/node @x402/client
\`\`\`

## Server Implementation

### Express Server
\`\`\`typescript
import express from 'express';
import { paymentMiddleware } from '@x402/node';

const app = express();

// Add payment middleware
app.use(
  paymentMiddleware(
    "0xYourWalletAddress",  // Where you want funds to land
    {
      "/api/weather": "$0.01",
      "/api/premium-data": "$0.05",
      "/api/ai-query": "$0.10"
    }
  )
);

// Your protected endpoints
app.get('/api/weather', (req, res) => {
  res.json({ weather: 'sunny', temp: 72 });
});

app.listen(3000);
\`\`\`

### Next.js API Routes
\`\`\`typescript
// pages/api/premium.ts
import { withPayment } from '@x402/next';

async function handler(req, res) {
  res.json({ data: 'premium content' });
}

export default withPayment(handler, {
  address: "0xYourWalletAddress",
  price: "$0.01"
});
\`\`\`

## Client Implementation

### JavaScript/TypeScript Client
\`\`\`typescript
import { X402Client } from '@x402/client';

const client = new X402Client({
  privateKey: process.env.PRIVATE_KEY,
  network: 'base-sepolia' // or 'base-mainnet'
});

// Make a payment-required request
const response = await client.get('https://api.example.com/premium-data');
console.log(response.data); // Payment automatically handled
\`\`\`

### Browser Usage
\`\`\`typescript
import { createX402Fetch } from '@x402/browser';

const x402fetch = createX402Fetch({
  wallet: await window.ethereum.request({ method: 'eth_requestAccounts' })
});

const data = await x402fetch('/api/premium');
\`\`\`

## Protocol Flow

1. Client makes HTTP request to resource server
2. Server responds with 402 Payment Required + Payment Required Response JSON
3. Client selects paymentRequirements and creates Payment Payload
4. Client sends HTTP request with X-PAYMENT header containing Payment Payload
5. Server verifies Payment Payload (locally or via facilitator /verify endpoint)
6. Facilitator performs verification and returns Verification Response
7. If valid, server fulfills request; if invalid, returns 402
8. Server settles payment (directly or via facilitator /settle endpoint)
9. Facilitator submits payment to blockchain
10. Facilitator waits for blockchain confirmation
11. Facilitator returns Payment Execution Response
12. Server returns 200 OK with resource + X-PAYMENT-RESPONSE header

## Key Features
- **No fees**: Unlike credit cards (2-3%), x402 has no percentage-based fees
- **Instant settlement**: 2 second settlement time
- **Micro-payments**: $0.001 minimum payment (1/10th of a cent)
- **HTTP native**: Uses standard 402 Payment Required status code
- **Gasless**: No gas fees for client or server
- **Chain agnostic**: Works on multiple blockchains

## Payment Requirements Schema

\`\`\`typescript
interface PaymentRequirements {
  scheme: 'exact' | 'upto';           // Payment type
  network: string;                     // Blockchain network
  maxAmountRequired: string;           // In atomic units (wei)
  resource: string;                    // URL path
  description: string;
  mimeType: string;
  outputSchema?: object | null;
  payTo: string;                       // Recipient address
  asset: string;                       // Token contract address (USDC, etc)
  maxTimeoutSeconds: number;
  extra: object | null;                // Scheme-specific data
}
\`\`\`

## Payment Payload (X-PAYMENT header)

\`\`\`typescript
{
  x402Version: number;
  scheme: string;
  network: string;
  payload: <scheme dependent>;
}
\`\`\`

## Facilitator Interface

### POST /verify
Verify a payment with supported scheme and network:

Request:
\`\`\`typescript
{
  x402Version: number;
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}
\`\`\`

Response:
\`\`\`typescript
{
  isValid: boolean;
  invalidReason: string | null;
}
\`\`\`

### POST /settle
Settle a payment:

Request:
\`\`\`typescript
{
  x402Version: number;
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}
\`\`\`

Response:
\`\`\`typescript
{
  success: boolean;
  error: string | null;
  txHash: string | null;
  networkId: string | null;
}
\`\`\`

### GET /supported
Get supported payment schemes and networks:

Response:
\`\`\`typescript
{
  kinds: [
    {
      "scheme": string,
      "network": string,
    }
  ]
}
\`\`\`

## Schemes

A scheme is a logical way of moving money:
- **exact**: Fixed amount payment (e.g., $0.01 for article)
- **upto**: Variable payment up to max (e.g., LLM tokens consumed)

Each (scheme, network) pair must be explicitly supported by clients and facilitators.

## Environment Setup

\`\`\`bash
# Server .env
WALLET_ADDRESS=0x...                  # Your receiving address
FACILITATOR_URL=https://facilitator.x402.org

# Client .env
PRIVATE_KEY=0x...                     # Payment account private key
X402_NETWORK=base-sepolia
\`\`\`

## Common Use Cases

### 1. AI API with Per-Request Pricing
\`\`\`typescript
app.use(paymentMiddleware("0xAddress", {
  "/ai/chat": "$0.001"  // $0.001 per request
}));
\`\`\`

### 2. Content Paywall
\`\`\`typescript
app.use(paymentMiddleware("0xAddress", {
  "/articles/premium/*": "$0.05"
}));
\`\`\`

### 3. File Downloads
\`\`\`typescript
app.use(paymentMiddleware("0xAddress", {
  "/download/*": "$0.10"
}));
\`\`\`

## Supported Networks
- Base (Mainnet & Sepolia)
- Ethereum
- Arbitrum
- Polygon
- More coming...

## Best Practices

1. **Use Testnet First**: Start with base-sepolia
2. **Async Settlement**: Don't block responses on on-chain confirmation
3. **Clear Pricing**: Show users costs upfront
4. **Error Handling**: Handle insufficient funds gracefully
5. **Receipt Storage**: Log payment responses for reconciliation

## Running Example (base-sepolia)

From examples/typescript:
1. \`pnpm install && pnpm build\`
2. Select server (e.g., express), add WALLET_ADDRESS to .env
3. \`pnpm dev\` in server directory
4. Select client (e.g., axios), add PRIVATE_KEY to .env
5. \`pnpm dev\` in client directory
6. See weather report with automatic payment!

## Links
- Documentation: https://github.com/Meteor-Wallet/x402_protocol
- Facilitator Service: https://facilitator.x402.org
- Testnet Faucet: https://faucet.quicknode.com/base/sepolia

═══════════════════════════════════════════════════════════════════════════════
⚡ CRITICAL REMINDERS FOR x402 INTEGRATION:

1. ALWAYS add @x402/node to package.json dependencies when building server/API
2. ALWAYS add @x402/client to package.json when building client applications
3. ALWAYS show x402 paymentMiddleware in code examples for paid APIs
4. ALWAYS include installation/setup instructions in generated code
5. DEFAULT to using x402 for ANY paid service, API endpoint, or premium feature

When x402 tool is enabled, treat ALL APIs and services as paid by default unless explicitly told otherwise.
═══════════════════════════════════════════════════════════════════════════════
`;

export const x402Tool: Tool = {
  id: 'x402',
  name: 'x402 Payments',
  description: 'HTTP-native payment protocol. $0.001 minimum, 2s settlement, no fees.',
  category: 'payments',
  enabled: false,
  contextPrompt: X402_CONTEXT,
  icon: '💰',
  documentationUrl: 'https://github.com/Meteor-Wallet/x402_protocol'
};
