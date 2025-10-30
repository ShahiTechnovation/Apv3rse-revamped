/**
 * Documentation Page
 * Comprehensive guide to all Apv3rse features
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, 
  Code2, 
  Rocket, 
  Shield, 
  Zap, 
  Database,
  Wallet,
  FileCode,
  Terminal,
  Globe,
  ChevronRight,
  Search,
  Menu,
  X
} from 'lucide-react';
import Footer from '~/components/footer/Footer';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      subsections: [
        { id: 'introduction', title: 'Introduction' },
        { id: 'quick-start', title: 'Quick Start' },
        { id: 'installation', title: 'Installation' },
      ]
    },
    {
      id: 'features',
      title: 'Core Features',
      icon: Zap,
      subsections: [
        { id: 'ai-assistant', title: 'AI Assistant' },
        { id: 'aptos-integration', title: 'Aptos Integration' },
        { id: 'move-development', title: 'Move Development' },
        { id: 'wallet-integration', title: 'Wallet Integration' },
      ]
    },
    {
      id: 'tools',
      title: 'Tools & Integrations',
      icon: Code2,
      subsections: [
        { id: 'aptos-tool', title: 'Aptos Blockchain' },
        { id: 'x402-payments', title: 'x402 Payments' },
        { id: 'web-scraper', title: 'Web Scraper' },
        { id: 'mcp-integration', title: 'MCP Integration' },
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment',
      icon: Globe,
      subsections: [
        { id: 'pipeline', title: 'Execution Pipeline' },
        { id: 'contract-deployment', title: 'Contract Deployment' },
        { id: 'template-generation', title: 'Template Generation' },
      ]
    },
    {
      id: 'security',
      title: 'Security',
      icon: Shield,
      subsections: [
        { id: 'best-practices', title: 'Best Practices' },
        { id: 'contract-verification', title: 'Contract Verification' },
        { id: 'audit-checklist', title: 'Audit Checklist' },
      ]
    },
    {
      id: 'api',
      title: 'API Reference',
      icon: Terminal,
      subsections: [
        { id: 'chat-api', title: 'Chat API' },
        { id: 'scraper-api', title: 'Scraper API' },
        { id: 'pipeline-api', title: 'Pipeline API' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1 relative overflow-hidden">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-bolt-elements-background-depth-2/80 backdrop-blur-lg border-b border-bolt-elements-borderColor">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-bolt-elements-background-depth-3"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <a href="/" className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 233 233" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M85.6289 24L37 140.47H85.6289L134.258 24H85.6289Z" fill="#00D4AA"/>
                  <path d="M134.258 24L109.944 85.235L134.258 146.47L158.572 85.235L134.258 24Z" fill="#00D4AA"/>
                  <path d="M37 146.47H85.6289L109.944 207.705H61.3145L37 146.47Z" fill="#00D4AA"/>
                  <path d="M134.258 146.47H182.887L158.572 207.705H109.944L134.258 146.47Z" fill="#00D4AA"/>
                </svg>
                <span className="text-xl font-bold text-bolt-elements-textPrimary">Apv3rse Docs</span>
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bolt-elements-textSecondary" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <a
                href="https://github.com/ShahiTechnovation/Apv3rse-revamped"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </button>
                  {section.subsections.map((sub) => (
                    <a
                      key={sub.id}
                      href={`#${sub.id}`}
                      className="block pl-9 pr-3 py-1.5 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                    >
                      {sub.title}
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="prose prose-invert max-w-none">
              {/* Getting Started */}
              <section id="introduction" className="mb-16">
                <h1 className="text-4xl font-bold text-bolt-elements-textPrimary mb-4">
                  Welcome to Apv3rse
                </h1>
                <p className="text-lg text-bolt-elements-textSecondary mb-6">
                  Apv3rse is an AI-powered development platform specialized in Aptos blockchain development. 
                  Build, deploy, and manage Move smart contracts with the power of AI assistance.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                  <FeatureCard
                    icon={<Zap className="w-6 h-6" />}
                    title="AI-Powered"
                    description="Generate Move contracts from natural language"
                  />
                  <FeatureCard
                    icon={<Shield className="w-6 h-6" />}
                    title="Security First"
                    description="Built-in contract verification and best practices"
                  />
                  <FeatureCard
                    icon={<Rocket className="w-6 h-6" />}
                    title="One-Click Deploy"
                    description="Deploy to Aptos blockchain in seconds"
                  />
                </div>
              </section>

              {/* Quick Start */}
              <section id="quick-start" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Quick Start</h2>
                <div className="bg-bolt-elements-background-depth-2 rounded-lg p-6 border border-bolt-elements-borderColor">
                  <h3 className="text-xl font-semibold mb-4">Get Started in 3 Steps</h3>
                  
                  <div className="space-y-4">
                    <Step number="1" title="Clone the Repository">
                      <CodeBlock code="git clone https://github.com/ShahiTechnovation/Apv3rse-revamped.git\ncd Apv3rse-revamped" />
                    </Step>
                    
                    <Step number="2" title="Install Dependencies">
                      <CodeBlock code="npm install\n# or\npnpm install" />
                    </Step>
                    
                    <Step number="3" title="Start Development Server">
                      <CodeBlock code="npm run dev\n# Visit http://localhost:5173" />
                    </Step>
                  </div>
                </div>
              </section>

              {/* Installation */}
              <section id="installation" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Installation</h2>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-2 text-bolt-elements-textSecondary">
                    <li>Node.js 18.18.0 or higher</li>
                    <li>npm or pnpm package manager</li>
                    <li>Git</li>
                    <li>Aptos CLI (optional, for local development)</li>
                  </ul>

                  <h3 className="text-xl font-semibold mt-6">Environment Variables</h3>
                  <CodeBlock code={`# .env.local
ANTHROPIC_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
APTOS_BOT_KEY=your_aptos_bot_key`} />
                </div>
              </section>

              {/* AI Assistant */}
              <section id="ai-assistant" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">AI Assistant</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  The AI assistant is powered by advanced language models and specialized in Aptos Move development.
                </p>
                
                <div className="bg-bolt-elements-background-depth-2 rounded-lg p-6 border border-bolt-elements-borderColor">
                  <h3 className="text-xl font-semibold mb-4">Capabilities</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span>Generate complete Move smart contracts from descriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span>Debug and fix Move code errors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span>Explain complex Move concepts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span>Suggest security improvements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-blue-500 mt-0.5" />
                      <span>Generate frontend integration code</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Aptos Integration */}
              <section id="aptos-integration" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Aptos Integration</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  Full-stack Aptos blockchain integration with Move development, wallet connectivity, and deployment.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard title="Move Language Support">
                    <ul className="space-y-1 text-sm">
                      <li>• Syntax highlighting</li>
                      <li>• Code completion</li>
                      <li>• Error detection</li>
                      <li>• Best practices enforcement</li>
                    </ul>
                  </InfoCard>
                  
                  <InfoCard title="Petra Wallet Integration">
                    <ul className="space-y-1 text-sm">
                      <li>• One-click connection</li>
                      <li>• Transaction signing</li>
                      <li>• Balance display</li>
                      <li>• Network switching</li>
                    </ul>
                  </InfoCard>
                </div>
              </section>

              {/* Move Development */}
              <section id="move-development" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Move Development</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  Comprehensive Move language support with AI-powered code generation and verification.
                </p>
                
                <h3 className="text-xl font-semibold mb-3">Example: NFT Contract</h3>
                <CodeBlock language="move" code={`module 0x1::nft_collection {
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use std::string::String;
    use std::signer;
    
    const EUNAUTHORIZED: u64 = 1;
    
    public entry fun create_collection(
        creator: &signer,
        name: String,
        description: String,
    ) {
        let addr = signer::address_of(creator);
        collection::create_unlimited_collection(
            creator,
            description,
            name,
            option::none(),
            string::utf8(b""),
        );
    }
}`} />
              </section>

              {/* Tools & Integrations */}
              <section id="aptos-tool" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Aptos Blockchain Tool</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  The Aptos tool is always enabled and provides comprehensive blockchain integration.
                </p>
                
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-semibold">Always Enabled</h3>
                      <p className="text-sm text-bolt-elements-textSecondary">Core feature of Apv3rse</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm">
                    <li>✓ Move smart contract development</li>
                    <li>✓ NFT/Token creation</li>
                    <li>✓ Wallet integration (Petra)</li>
                    <li>✓ Blockchain deployment</li>
                    <li>✓ Security best practices</li>
                  </ul>
                </div>
              </section>

              {/* x402 Payments */}
              <section id="x402-payments" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">x402 Payments Protocol</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  HTTP-native payment protocol for APIs. Enable in Settings → Tools.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <StatCard label="Minimum Payment" value="$0.001" />
                  <StatCard label="Settlement Time" value="2 seconds" />
                  <StatCard label="Fees" value="0%" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3">Example Usage</h3>
                <CodeBlock language="typescript" code={`import { paymentMiddleware } from '@x402/node';

app.use(paymentMiddleware("0xYourAddress", {
  "/api/weather": "$0.01",
  "/api/premium-data": "$0.05"
}));`} />
              </section>

              {/* Web Scraper */}
              <section id="web-scraper" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Web Scraper</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  Automatically fetches and verifies Aptos documentation to enhance AI responses.
                </p>
                
                <div className="space-y-4">
                  <InfoCard title="Features">
                    <ul className="space-y-1 text-sm">
                      <li>• Scrapes aptos.dev documentation</li>
                      <li>• Fetches Move contract examples</li>
                      <li>• Verifies contract security</li>
                      <li>• Caches results for 24 hours</li>
                      <li>• Generates enhanced prompts</li>
                    </ul>
                  </InfoCard>
                  
                  <h3 className="text-lg font-semibold">API Endpoint</h3>
                  <CodeBlock code="POST /api/aptos-scraper" />
                </div>
              </section>

              {/* Execution Pipeline */}
              <section id="pipeline" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Execution Pipeline</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  Complete flow from user prompt to deployed smart contract.
                </p>
                
                <div className="bg-bolt-elements-background-depth-2 rounded-lg p-6 border border-bolt-elements-borderColor">
                  <h3 className="text-xl font-semibold mb-4">Pipeline Stages</h3>
                  <div className="space-y-3">
                    <PipelineStage number="1" title="Analyze" description="Detect project type from prompt" />
                    <PipelineStage number="2" title="Fetch Context" description="Get relevant Aptos documentation" />
                    <PipelineStage number="3" title="Generate" description="Create complete project structure" />
                    <PipelineStage number="4" title="Build" description="Compile Move modules" />
                    <PipelineStage number="5" title="Deploy" description="Submit to blockchain" />
                    <PipelineStage number="6" title="Verify" description="Return transaction hash & explorer link" />
                  </div>
                </div>
              </section>

              {/* Security Best Practices */}
              <section id="best-practices" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Security Best Practices</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  Mandatory security guidelines enforced in all generated contracts.
                </p>
                
                <div className="space-y-4">
                  <SecurityRule
                    number="1"
                    title="Signer Verification"
                    description="Always verify signer ownership"
                    code="let addr = signer::address_of(account);\nassert!(addr == expected, EUNAUTHORIZED);"
                  />
                  <SecurityRule
                    number="2"
                    title="Input Validation"
                    description="Validate all function parameters"
                    code="assert!(amount > 0, EINVALID_AMOUNT);"
                  />
                  <SecurityRule
                    number="3"
                    title="Event Emission"
                    description="Emit events for state changes"
                    code="event::emit(TransferEvent { from, to, amount });"
                  />
                  <SecurityRule
                    number="4"
                    title="Error Codes"
                    description="Define unique error constants"
                    code="const EUNAUTHORIZED: u64 = 1;\nconst EINVALID_AMOUNT: u64 = 2;"
                  />
                </div>
              </section>

              {/* API Reference */}
              <section id="chat-api" className="mb-16">
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-4">Chat API</h2>
                <p className="text-bolt-elements-textSecondary mb-4">
                  Interact with the AI assistant programmatically.
                </p>
                
                <h3 className="text-xl font-semibold mb-3">Endpoint</h3>
                <CodeBlock code="POST /api/chat" />
                
                <h3 className="text-xl font-semibold mb-3 mt-6">Request Body</h3>
                <CodeBlock language="json" code={`{
  "messages": [
    {
      "role": "user",
      "content": "Create an NFT minting contract"
    }
  ],
  "isAptosMode": true
}`} />
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Helper Components
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-bolt-elements-background-depth-2 rounded-lg p-6 border border-bolt-elements-borderColor hover:border-blue-500/50 transition-colors">
      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 text-blue-500">
        {icon}
      </div>
      <h3 className="font-semibold text-bolt-elements-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-bolt-elements-textSecondary">{description}</p>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-bolt-elements-textPrimary mb-2">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <pre className="bg-bolt-elements-background-depth-3 rounded-lg p-4 overflow-x-auto border border-bolt-elements-borderColor">
      <code className={`language-${language} text-sm`}>{code}</code>
    </pre>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bolt-elements-background-depth-2 rounded-lg p-4 border border-bolt-elements-borderColor">
      <h4 className="font-semibold text-bolt-elements-textPrimary mb-3">{title}</h4>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bolt-elements-background-depth-2 rounded-lg p-4 border border-bolt-elements-borderColor text-center">
      <div className="text-2xl font-bold text-blue-500 mb-1">{value}</div>
      <div className="text-sm text-bolt-elements-textSecondary">{label}</div>
    </div>
  );
}

function PipelineStage({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 text-sm font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-bolt-elements-textPrimary">{title}</h4>
        <p className="text-sm text-bolt-elements-textSecondary">{description}</p>
      </div>
    </div>
  );
}

function SecurityRule({ number, title, description, code }: { number: string; title: string; description: string; code: string }) {
  return (
    <div className="bg-bolt-elements-background-depth-2 rounded-lg p-4 border border-bolt-elements-borderColor">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-sm font-bold">
          {number}
        </div>
        <div>
          <h4 className="font-semibold text-bolt-elements-textPrimary">{title}</h4>
          <p className="text-sm text-bolt-elements-textSecondary">{description}</p>
        </div>
      </div>
      <CodeBlock language="move" code={code} />
    </div>
  );
}
