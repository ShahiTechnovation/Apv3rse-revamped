/**
 * Tool system types for selectable integrations
 */

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'blockchain' | 'payments' | 'ai' | 'infrastructure' | 'wallet' | 'web3' | 'api' | 'other';
  enabled: boolean;
  contextPrompt: string;
  icon?: string;
  documentationUrl?: string;
  comingSoon?: boolean;
  alwaysEnabled?: boolean;
}

export interface ToolsState {
  availableTools: Tool[];
  enabledToolIds: string[];
}
