/**
 * Aptos Blockchain Integration Tool
 */

import type { Tool } from './types';
import { APTOS_INTEGRATION_PROMPT } from '../common/prompts/aptos-context';

export const aptosTool: Tool = {
  id: 'aptos',
  name: 'Aptos Blockchain',
  description: 'Integrate Aptos wallet connectivity and blockchain features',
  category: 'blockchain',
  enabled: true, // Enabled by default since it was already in the system
  alwaysEnabled: true,
  contextPrompt: APTOS_INTEGRATION_PROMPT,
  icon: '⚡',
  documentationUrl: 'https://aptos.dev'
};
