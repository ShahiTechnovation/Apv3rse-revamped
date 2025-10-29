/**
 * Registry of all available tools/integrations
 */

import type { Tool } from './types';
import { aptosTool } from './aptos-tool';
import { x402Tool } from './x402-tool';

export const AVAILABLE_TOOLS: Tool[] = [
  aptosTool,
  x402Tool,
  // Coming Soon Tools
  {
    id: 'rainbow-wallet',
    name: 'Rainbow Wallet Kit',
    description: 'Easy-to-use wallet integration for Web3 apps',
    category: 'wallet',
    icon: '🌈',
    enabled: false,
    comingSoon: true,
    contextPrompt: '', // Will be added when available
  },
  {
    id: 'thirdweb',
    name: 'Thirdweb',
    description: 'Complete Web3 development framework with smart contracts and SDKs',
    category: 'web3',
    icon: '⚡',
    enabled: false,
    comingSoon: true,
    contextPrompt: '', // Will be added when available
  },
  {
    id: 'tavily',
    name: 'Tavily',
    description: 'AI-powered search API for LLMs and research applications',
    category: 'api',
    icon: '🔍',
    enabled: false,
    comingSoon: true,
    contextPrompt: '', // Will be added when available
  },
  {
    id: 'privy',
    name: 'Privy',
    description: 'Simple authentication and wallet management for Web3 apps',
    category: 'wallet',
    icon: '🔐',
    enabled: false,
    comingSoon: true,
    contextPrompt: '', // Will be added when available
  },
  // Add more tools here as they're created
];

export function getToolById(id: string): Tool | undefined {
  return AVAILABLE_TOOLS.find(tool => tool.id === id);
}

export function getEnabledTools(enabledIds: string[]): Tool[] {
  return AVAILABLE_TOOLS.filter(tool => enabledIds.includes(tool.id));
}

export function getToolsContext(enabledIds: string[]): string {
  const enabledTools = getEnabledTools(enabledIds);
  console.log('🔧 Getting tools context for:', enabledIds);
  console.log('🔧 Found tools:', enabledTools.map(t => t.id));
  
  const context = enabledTools
    .map(tool => tool.contextPrompt)
    .join('\n\n');
  
  console.log('🔧 Total context length:', context.length);
  return context;
}
