# Apv3rse - AI-Powered Aptos Development Platform

> **Build Move smart contracts and Aptos dApps directly from AI prompts**

Apv3rse is a next-generation AI-powered development platform specifically designed for the Aptos blockchain ecosystem. It combines the power of large language models with deep Aptos/Move knowledge to enable developers to build, test, and deploy smart contracts through natural language conversations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Aptos](https://img.shields.io/badge/Aptos-Blockchain-00D4AA)](https://aptos.dev)
[![Move](https://img.shields.io/badge/Move-Language-4A90E2)](https://move-language.github.io/move/)

---

## 🌟 Key Features

### 🤖 **AI-Enhanced Development**
- **Natural Language to Move Code** - Describe what you want, get production-ready Move contracts
- **Aptos Documentation Context** - AI has access to official Aptos docs via llms.txt integration
- **Smart Code Generation** - Follows Aptos best practices and security guidelines
- **Interactive Debugging** - AI helps fix errors and optimize your code

### ⛓️ **Aptos Blockchain Integration**
- **Server-Side MCP Integration** - Direct blockchain interaction via Aptos Model Context Protocol
- **Multi-Network Support** - Deploy to devnet, testnet, or mainnet
- **Real-Time Compilation** - Compile Move code with syntax validation
- **Automated Deployment** - One-click deployment with progress tracking
- **Wallet Integration** - Petra wallet support for transactions

### 📚 **Intelligent Context System**
- **Cached Documentation** - 24-hour cache of official Aptos documentation
- **Topic Indexing** - Fast retrieval of relevant documentation sections
- **Smart File Selection** - Uses llms-small.txt for simple queries, llms-full.txt for complex ones
- **Token-Optimized** - Only includes relevant context to avoid overwhelming the LLM

### 🛠️ **Developer Tools**
- **In-Browser IDE** - Full-featured code editor with syntax highlighting
- **WebContainer Integration** - Run and test code directly in the browser
- **Git Integration** - Version control and collaboration features
- **File Management** - Complete file system operations
- **Terminal Access** - Built-in terminal for CLI operations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Remix)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat UI      │  │ Code Editor  │  │ Aptos Panel  │      │
│  │ (AI Prompts) │  │ (CodeMirror) │  │ (Deploy UI)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Remix Routes)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/chat    │  │ /api/aptos-  │  │ /api/aptos-  │      │
│  │              │  │ mcp          │  │ context      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Aptos Prompt Enhancer                            │       │
│  │ - Detects Aptos queries                          │       │
│  │ - Fetches relevant documentation                 │       │
│  │ - Injects context into prompts                   │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Aptos Context Service                            │       │
│  │ - Caches llms.txt from aptos.dev                │       │
│  │ - Indexes documentation by topics                │       │
│  │ - Smart context retrieval                        │       │
│  └──────────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Aptos MCP Service                                │       │
│  │ - Compile Move code                              │       │
│  │ - Deploy contracts                                │       │
│  │ - Manage accounts                                 │       │
│  │ - Execute transactions                            │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ LLM Providers│  │ Aptos Network│  │ aptos.dev    │      │
│  │ (OpenAI,     │  │ (devnet/     │  │ (llms.txt)   │      │
│  │  Anthropic)  │  │  testnet)    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
apv3rse/
├── app/
│   ├── components/          # React components
│   │   ├── chat/           # Chat interface components
│   │   │   ├── APIKeyManager.tsx
│   │   │   ├── BaseChat.tsx
│   │   │   ├── Chat.client.tsx
│   │   │   └── UserMessage.tsx
│   │   ├── editor/         # Code editor components
│   │   │   ├── codemirror/
│   │   │   └── EditorPanel.tsx
│   │   ├── git/            # Git integration
│   │   ├── header/         # Header and navigation
│   │   ├── settings/       # Settings UI
│   │   └── workbench/      # Main workbench
│   │
│   ├── lib/
│   │   ├── .server/        # Server-side code
│   │   │   ├── llm/        # LLM integration
│   │   │   │   ├── stream-text.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── switchable-stream.ts
│   │   │   ├── aptos-context-service.ts    # llms.txt caching
│   │   │   ├── aptos-mcp-service.ts        # MCP integration
│   │   │   └── aptos-prompt-enhancer.ts    # Prompt enhancement
│   │   │
│   │   ├── common/         # Shared utilities
│   │   │   ├── prompts/    # System prompts
│   │   │   └── prompt-library.ts
│   │   │
│   │   ├── hooks/          # React hooks
│   │   ├── modules/        # Feature modules
│   │   │   ├── llm/        # LLM manager
│   │   │   └── aptos/      # Aptos integration
│   │   └── stores/         # State management (Nanostores)
│   │
│   ├── routes/             # Remix routes (API + pages)
│   │   ├── _index.tsx      # Main application
│   │   ├── api.chat.ts     # Chat API with context enhancement
│   │   ├── api.aptos-mcp.ts       # MCP tools API
│   │   ├── api.aptos-context.ts   # Context management API
│   │   ├── api.check-env-key.ts
│   │   └── git.tsx         # Git operations
│   │
│   ├── styles/             # SCSS styles
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
│
├── public/                 # Static assets
│   └── icons/             # Provider icons
│
├── docs/                   # Documentation
│   ├── APTOS_INTEGRATION.md
│   ├── APTOS_TESTING_GUIDE.md
│   └── APTOS_QUICK_REFERENCE.md
│
├── APTOS_MCP_INTEGRATION.md      # MCP integration guide
├── APTOS_MCP_QUICKSTART.md       # Quick start guide
├── .env.example                   # Environment template
├── package.json
├── vite.config.ts
├── uno.config.ts                  # UnoCSS configuration
└── wrangler.toml                  # Cloudflare Pages config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.18.0
- **pnpm** (recommended) or npm
- **Aptos Bot Key** from [Geomi.dev](https://geomi.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd apv3rse
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Get your Geomi Bot Key**
   - Visit [https://geomi.dev/](https://geomi.dev/)
   - Navigate to **Bot Keys** section
   - Click **Create Bot Key**
   - Copy the generated key

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   # Required: Aptos MCP Bot Key
   APTOS_BOT_KEY=your-geomi-bot-key-here
   
   # Optional: Cache configuration
   APTOS_LLMS_CACHE_TTL=86400          # 24 hours
   APTOS_CONTEXT_MAX_TOKENS=4000       # Max context tokens
   ```

5. **Start development server**
   ```bash
   pnpm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

---

## 📜 Available Scripts

### Development
- **`pnpm run dev`** - Starts the development server with hot reload
- **`pnpm run typecheck`** - Runs TypeScript type checking
- **`pnpm run lint`** - Lints the codebase
- **`pnpm run lint:fix`** - Automatically fixes linting issues

### Testing
- **`pnpm test`** - Runs the test suite using Vitest
- **`pnpm run test:watch`** - Runs tests in watch mode

### Build & Deploy
- **`pnpm run build`** - Builds the project for production
- **`pnpm run preview`** - Builds and runs the production build locally
- **`pnpm run start`** - Runs the built application using Wrangler Pages
- **`pnpm run deploy`** - Deploys to Cloudflare Pages

### Docker
- **`pnpm run dockerbuild`** - Builds development Docker image
- **`pnpm run dockerbuild:prod`** - Builds production Docker image
- **`pnpm run dockerrun`** - Runs the Docker container

### Utilities
- **`pnpm run typegen`** - Generates TypeScript types using Wrangler

---

## 🔧 Technical Stack

### Frontend
- **Framework**: [Remix](https://remix.run/) - Full-stack React framework
- **UI Library**: React 18
- **Styling**: 
  - [UnoCSS](https://unocss.dev/) - Instant on-demand atomic CSS
  - SCSS for custom styles
- **Code Editor**: [CodeMirror 6](https://codemirror.net/)
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores)
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Components**: 
  - Radix UI primitives
  - Custom components

### Backend
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **AI Integration**: 
  - [Vercel AI SDK](https://sdk.vercel.ai/)
  - Multiple LLM providers (OpenAI, Anthropic, Google, Mistral, etc.)
- **Aptos Integration**:
  - [@aptos-labs/ts-sdk](https://www.npmjs.com/package/@aptos-labs/ts-sdk)
  - [@aptos-labs/aptos-mcp](https://www.npmjs.com/package/@aptos-labs/aptos-mcp)
  - [@aptos-labs/wallet-adapter-react](https://www.npmjs.com/package/@aptos-labs/wallet-adapter-react)

### Development Tools
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Vitest** - Unit testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

### Browser Features
- **WebContainer API** - Run Node.js in the browser
- **Xterm.js** - Terminal emulator
- **isomorphic-git** - Git operations in browser

---

## 🎯 Core Features Deep Dive

### 1. AI-Powered Chat Interface

The chat system uses advanced prompt engineering with Aptos-specific context:

```typescript
// Automatic context enhancement
User: "Create an NFT collection in Move"
  ↓
System detects Aptos query
  ↓
Fetches relevant docs from llms.txt cache
  ↓
Injects official Aptos documentation
  ↓
LLM generates accurate Move code
```

**Key Components:**
- `BaseChat.tsx` - Main chat interface
- `aptos-prompt-enhancer.ts` - Context injection
- `aptos-context-service.ts` - Documentation caching

### 2. Aptos MCP Integration

Server-side Model Context Protocol integration provides:

- **Compile Move Code**: Syntax validation and bytecode generation
- **Deploy Contracts**: Multi-network deployment (devnet/testnet/mainnet)
- **Account Management**: Create and manage Aptos accounts
- **Transaction Execution**: Execute Move functions on-chain
- **Blockchain Queries**: Get balances, account info, etc.

**API Endpoints:**
```typescript
POST /api/aptos-mcp
{
  "action": "compile",
  "params": { "code": "...", "moduleName": "..." }
}
```

### 3. Documentation Context System

Intelligent caching and retrieval of Aptos documentation:

- **Sources**: 
  - `https://aptos.dev/llms.txt` (index)
  - `https://aptos.dev/llms-small.txt` (compact)
  - `https://aptos.dev/llms-full.txt` (complete)

- **Features**:
  - 24-hour cache with auto-refresh
  - Topic-based indexing
  - Smart file selection based on query complexity
  - Token-limited context (default 4000 tokens)

**Cache Statistics:**
```typescript
GET /api/aptos-context
{
  "isCached": true,
  "topicCount": 150,
  "cacheAge": 3600000,
  "lastFetch": 1234567890
}
```

### 4. Multi-Provider LLM Support

Supports multiple AI providers with dynamic model selection:

- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus)
- **Google** (Gemini Pro, Gemini Flash)
- **Mistral AI**
- **Cohere**
- **Amazon Bedrock**
- **OpenRouter**
- **Ollama** (local models)

### 5. In-Browser Development Environment

Full-featured IDE running entirely in the browser:

- **WebContainer**: Run Node.js and npm in browser
- **File System**: Complete file operations
- **Terminal**: Interactive shell
- **Git Integration**: Version control
- **Code Editor**: Syntax highlighting, autocomplete, linting

---

## 🔐 Environment Variables

### Required

```env
# Aptos MCP Bot Key (from geomi.dev)
APTOS_BOT_KEY=your-bot-key-here
```

### Optional

```env
# Context Service Configuration
APTOS_LLMS_CACHE_TTL=86400          # Cache TTL in seconds (default: 24h)
APTOS_CONTEXT_MAX_TOKENS=4000       # Max context tokens (default: 4000)

# LLM Provider API Keys (add as needed)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
```

---

## 📖 Documentation

- **[Aptos MCP Integration Guide](./APTOS_MCP_INTEGRATION.md)** - Complete MCP setup and usage
- **[Quick Start Guide](./APTOS_MCP_QUICKSTART.md)** - Get started in 3 steps
- **[Aptos Integration](./docs/APTOS_INTEGRATION.md)** - Original Aptos features
- **[Testing Guide](./docs/APTOS_TESTING_GUIDE.md)** - How to test Aptos features
- **[Quick Reference](./docs/APTOS_QUICK_REFERENCE.md)** - Common operations

---

## 🧪 Testing

### Run Tests
```bash
pnpm test
```

### Watch Mode
```bash
pnpm run test:watch
```

### Type Checking
```bash
pnpm run typecheck
```

---

## 🐳 Docker Deployment

### Build Development Image
```bash
pnpm run dockerbuild
```

### Build Production Image
```bash
pnpm run dockerbuild:prod
```

### Run Container
```bash
pnpm run dockerrun
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Aptos Labs** - For the amazing blockchain platform and MCP integration
- **Vercel** - For the AI SDK
- **Remix Team** - For the excellent full-stack framework
- **Cloudflare** - For Workers and Pages hosting

---

## 📞 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Aptos Discord**: [Join the community](https://discord.gg/aptosnetwork)

---

## 🗺️ Roadmap

- [ ] Enhanced Move code analysis and suggestions
- [ ] Multi-file project support
- [ ] Collaborative editing
- [ ] Move Prover integration
- [ ] Advanced debugging tools
- [ ] Template library for common patterns
- [ ] CI/CD integration for automated testing
- [ ] Mainnet deployment support with KMS

---

**Built with ❤️ for the Aptos ecosystem**

