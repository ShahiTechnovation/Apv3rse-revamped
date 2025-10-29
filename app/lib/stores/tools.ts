/**
 * Store for managing enabled tools state
 */

import { atom } from 'nanostores';

// Load from localStorage on initialization
const loadEnabledTools = (): string[] => {
  if (typeof window === 'undefined') return ['aptos'];
  const stored = localStorage.getItem('enabledTools');
  const tools = stored ? JSON.parse(stored) : ['aptos'];
  // Always ensure aptos is included
  if (!tools.includes('aptos')) {
    tools.push('aptos');
  }
  return tools;
};

// Store for enabled tools
export const enabledToolsStore = atom<string[]>(loadEnabledTools());

// Subscribe to changes and persist to localStorage
if (typeof window !== 'undefined') {
  enabledToolsStore.subscribe((value) => {
    localStorage.setItem('enabledTools', JSON.stringify(value));
  });
}

export function toggleTool(toolId: string) {
  // Prevent disabling aptos
  if (toolId === 'aptos') return;
  
  const current = enabledToolsStore.get();
  if (current.includes(toolId)) {
    enabledToolsStore.set(current.filter((id: string) => id !== toolId));
  } else {
    enabledToolsStore.set([...current, toolId]);
  }
}

export function enableTool(toolId: string) {
  const current = enabledToolsStore.get();
  if (!current.includes(toolId)) {
    enabledToolsStore.set([...current, toolId]);
  }
}

export function disableTool(toolId: string) {
  // Prevent disabling aptos
  if (toolId === 'aptos') return;
  
  const current = enabledToolsStore.get();
  enabledToolsStore.set(current.filter((id: string) => id !== toolId));
}
