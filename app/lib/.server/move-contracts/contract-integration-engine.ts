/**
 * Contract Integration Engine
 * Orchestrates the entire contract fetching, processing, and integration flow
 */

import { createScopedLogger } from '~/utils/logger';
import { getContractIntentClassifier } from './contract-intent-classifier';
import { getGitHubContractScraper } from './github-contract-scraper';
import { getContractDatabase } from './contract-database';
import { getContractProcessor } from './contract-processor';
import type { ContractIntent } from './contract-intent-classifier';
import type { GitHubContract } from './github-contract-scraper';
import type { StoredContract } from './contract-database';
import type { CustomizationOptions } from './contract-processor';

const logger = createScopedLogger('contract-integration-engine');

export interface IntegrationRequest {
  prompt: string;
  projectName: string;
  projectPath?: string;
  address?: string;
  githubToken?: string;
  useGitHub?: boolean;
  customOptions?: Partial<CustomizationOptions>;
}

export interface IntegrationResult {
  success: boolean;
  contracts: GeneratedContract[];
  moveToml?: string;
  frontendCode?: GeneratedFrontendCode[];
  errors: string[];
  warnings: string[];
  metadata: {
    intent: ContractIntent;
    sourcesUsed: string[];
    processingTime: number;
  };
}

export interface GeneratedContract {
  fileName: string;
  content: string;
  path: string;
  category: string;
  features: string[];
  dependencies: string[];
}

export interface GeneratedFrontendCode {
  fileName: string;
  content: string;
  path: string;
  type: 'hook' | 'component' | 'util' | 'type';
}

export class ContractIntegrationEngine {
  private classifier = getContractIntentClassifier();
  private scraper = getGitHubContractScraper();
  private database = getContractDatabase();
  private processor = getContractProcessor();

  /**
   * Main integration flow
   */
  async integrate(request: IntegrationRequest): Promise<IntegrationResult> {
    const startTime = Date.now();
    const result: IntegrationResult = {
      success: false,
      contracts: [],
      errors: [],
      warnings: [],
      metadata: {
        intent: {} as ContractIntent,
        sourcesUsed: [],
        processingTime: 0,
      },
    };

    try {
      logger.info(`Starting integration for prompt: ${request.prompt}`);

      // Step 1: Detect intent
      const intent = this.classifier.detectIntent(request.prompt);
      result.metadata.intent = intent;

      if (intent.categories.length === 0) {
        result.errors.push('Could not determine contract type from prompt');
        return result;
      }

      logger.info(`Detected intent: ${intent.categories.join(', ')}`);

      // Step 2: Fetch contracts
      const contracts = await this.fetchContracts(intent, request);
      
      if (contracts.length === 0) {
        result.errors.push('No suitable contracts found');
        return result;
      }

      result.metadata.sourcesUsed = contracts.map(c => 
        'path' in c ? c.path : (c as StoredContract).id
      );

      // Step 3: Process and customize contracts
      for (const contract of contracts) {
        const processed = await this.processAndCustomizeContract(
          contract,
          request
        );

        if (processed) {
          result.contracts.push(processed);
        }
      }

      // Step 4: Generate Move.toml
      if (result.contracts.length > 0) {
        const allDependencies = new Set<string>();
        result.contracts.forEach(c => {
          c.dependencies.forEach(d => allDependencies.add(d));
        });

        result.moveToml = this.processor.generateMoveToml(
          request.projectName,
          Array.from(allDependencies),
          request.address
        );
      }

      // Step 5: Generate frontend integration code
      result.frontendCode = this.generateFrontendCode(result.contracts, request);

      // Success!
      result.success = result.contracts.length > 0;
      result.metadata.processingTime = Date.now() - startTime;

      logger.info(`Integration completed in ${result.metadata.processingTime}ms`);

    } catch (error) {
      logger.error('Integration failed:', error);
      result.errors.push(`Integration error: ${error}`);
    }

    return result;
  }

  /**
   * Fetch contracts based on intent
   */
  private async fetchContracts(
    intent: ContractIntent,
    request: IntegrationRequest
  ): Promise<(GitHubContract | StoredContract)[]> {
    const contracts: (GitHubContract | StoredContract)[] = [];

    // First, check local database
    for (const category of intent.categories) {
      const dbContracts = this.database.getContractsByCategory(category);
      contracts.push(...dbContracts);
    }

    // If enabled and needed, fetch from GitHub
    if (request.useGitHub && contracts.length < 3) {
      if (request.githubToken) {
        this.scraper.updateConfig({ token: request.githubToken });
      }

      for (const suggestedPath of intent.suggestedContracts) {
        try {
          const githubContract = await this.scraper.fetchContract(suggestedPath);
          contracts.push(githubContract);
        } catch (error) {
          logger.warn(`Failed to fetch ${suggestedPath} from GitHub:`, error);
        }
      }
    }

    // Sort by relevance
    return contracts.slice(0, 5); // Limit to top 5
  }

  /**
   * Process and customize a single contract
   */
  private async processAndCustomizeContract(
    contract: GitHubContract | StoredContract,
    request: IntegrationRequest
  ): Promise<GeneratedContract | null> {
    try {
      const content = contract.content;
      
      // Process the contract
      const processed = this.processor.processContract(content);
      
      if (!processed.isValid) {
        logger.warn(`Contract validation failed: ${processed.validationErrors.join(', ')}`);
        
        // Try to fix errors
        const fixed = this.processor.fixCompilationErrors(
          content,
          processed.validationErrors
        );
        
        // Re-process
        const reprocessed = this.processor.processContract(fixed);
        if (!reprocessed.isValid) {
          return null;
        }
        
        processed.processedContent = fixed;
      }

      // Customize the contract
      const customOptions: CustomizationOptions = {
        projectName: request.projectName,
        moduleName: request.customOptions?.moduleName || 
                   this.generateModuleName(request.projectName, contract),
        address: request.address || request.projectName.toLowerCase(),
        ...request.customOptions,
      };

      const customized = this.processor.customizeContract(
        processed.processedContent,
        customOptions
      );

      // Generate file name
      const fileName = this.generateFileName(contract);

      return {
        fileName,
        content: customized,
        path: `move/sources/${fileName}`,
        category: 'category' in contract ? (contract as StoredContract).category : 'unknown',
        features: 'features' in contract ? (contract as StoredContract).features : [],
        dependencies: processed.dependencies,
      };

    } catch (error) {
      logger.error('Failed to process contract:', error);
      return null;
    }
  }

  /**
   * Generate module name for contract
   */
  private generateModuleName(
    projectName: string,
    contract: GitHubContract | StoredContract
  ): string {
    const baseName = 'name' in contract 
      ? contract.name.replace('.move', '')
      : (contract as GitHubContract).path.split('/').pop()?.replace('.move', '') || 'contract';
    
    return `${projectName}_${baseName}`.toLowerCase();
  }

  /**
   * Generate file name for contract
   */
  private generateFileName(contract: GitHubContract | StoredContract): string {
    if ('name' in contract) {
      return contract.name.endsWith('.move') ? contract.name : `${contract.name}.move`;
    }
    
    const pathParts = (contract as GitHubContract).path.split('/');
    return pathParts[pathParts.length - 1];
  }

  /**
   * Generate frontend integration code
   */
  private generateFrontendCode(
    contracts: GeneratedContract[],
    request: IntegrationRequest
  ): GeneratedFrontendCode[] {
    const frontendCode: GeneratedFrontendCode[] = [];

    for (const contract of contracts) {
      // Generate React hook
      const hookCode = this.generateReactHook(contract, request);
      if (hookCode) {
        frontendCode.push({
          fileName: `use${contract.fileName.replace('.move', '')}.ts`,
          content: hookCode,
          path: `frontend/src/hooks/use${contract.fileName.replace('.move', '')}.ts`,
          type: 'hook',
        });
      }

      // Generate component if it's an NFT or marketplace contract
      if (contract.category === 'nft' || contract.category === 'marketplace') {
        const componentCode = this.generateReactComponent(contract, request);
        if (componentCode) {
          frontendCode.push({
            fileName: `${contract.fileName.replace('.move', '')}Component.tsx`,
            content: componentCode,
            path: `frontend/src/components/${contract.fileName.replace('.move', '')}Component.tsx`,
            type: 'component',
          });
        }
      }

      // Generate types
      const typesCode = this.generateTypeDefinitions(contract);
      if (typesCode) {
        frontendCode.push({
          fileName: `${contract.fileName.replace('.move', '')}.types.ts`,
          content: typesCode,
          path: `frontend/src/types/${contract.fileName.replace('.move', '')}.types.ts`,
          type: 'type',
        });
      }
    }

    return frontendCode;
  }

  /**
   * Generate React hook for contract interaction
   */
  private generateReactHook(contract: GeneratedContract, request: IntegrationRequest): string {
    const moduleName = contract.fileName.replace('.move', '');
    const address = request.address || request.projectName.toLowerCase();

    return `import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useState, useCallback } from 'react';

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

export function use${moduleName}() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  ${contract.features.map(feature => this.generateFeatureFunction(feature, address, moduleName)).join('\n\n  ')}

  return {
    ${contract.features.map(f => this.camelCase(f)).join(',\n    ')},
    loading,
    error,
  };
}

${contract.features.map(feature => this.generateFeatureFunction(feature, address, moduleName)).join('\n\n')}`;
  }

  /**
   * Generate function for a contract feature
   */
  private generateFeatureFunction(feature: string, address: string, moduleName: string): string {
    const functionName = this.camelCase(feature);
    
    return `const ${functionName} = useCallback(async (params: any) => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: \`${address}::${moduleName}::${feature}\`,
          functionArguments: Object.values(params),
        },
      });

      await aptos.waitForTransaction({ transactionHash: transaction.hash });
      return transaction;
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [account, signAndSubmitTransaction]);`;
  }

  /**
   * Generate React component
   */
  private generateReactComponent(contract: GeneratedContract, request: IntegrationRequest): string {
    const moduleName = contract.fileName.replace('.move', '');
    
    return `import React from 'react';
import { use${moduleName} } from '../hooks/use${moduleName}';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ${moduleName}Component() {
  const { ${contract.features.map(f => this.camelCase(f)).join(', ')}, loading, error } = use${moduleName}();

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">${moduleName}</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        ${contract.features.map(feature => `
        <Button 
          onClick={() => ${this.camelCase(feature)}({})}
          disabled={loading}
        >
          ${this.humanize(feature)}
        </Button>`).join('')}
      </div>
    </Card>
  );
}`;
  }

  /**
   * Generate TypeScript type definitions
   */
  private generateTypeDefinitions(contract: GeneratedContract): string {
    return `// Type definitions for ${contract.fileName}

export interface ${contract.fileName.replace('.move', '')}Module {
  address: string;
  name: string;
  ${contract.features.map(f => `${this.camelCase(f)}: (params: any) => Promise<any>;`).join('\n  ')}
}

${contract.features.map(feature => `
export interface ${this.pascalCase(feature)}Params {
  // Add parameter types based on contract
  [key: string]: any;
}`).join('\n')}`;
  }

  /**
   * Helper: Convert to camelCase
   */
  private camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Helper: Convert to PascalCase
   */
  private pascalCase(str: string): string {
    const camel = this.camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  /**
   * Helper: Humanize string
   */
  private humanize(str: string): string {
    return str.replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Singleton instance
let instance: ContractIntegrationEngine | null = null;

export function getContractIntegrationEngine(): ContractIntegrationEngine {
  if (!instance) {
    instance = new ContractIntegrationEngine();
  }
  return instance;
}
