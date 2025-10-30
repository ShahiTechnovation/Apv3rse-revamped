/**
 * API Route for Move Contract Fetching and Integration
 */

import { type ActionFunctionArgs } from '@remix-run/node';
import { getContractIntegrationEngine } from '~/lib/.server/move-contracts/contract-integration-engine';
import { getGitHubContractScraper } from '~/lib/.server/move-contracts/github-contract-scraper';
import { getContractDatabase } from '~/lib/.server/move-contracts/contract-database';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.move-contracts');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { action: contractAction, params } = await request.json<{
      action: string;
      params: any;
    }>();

    logger.info(`Contract Action: ${contractAction}`);

    switch (contractAction) {
      case 'integrate': {
        // Main integration flow
        const engine = getContractIntegrationEngine();
        const result = await engine.integrate(params);
        
        return Response.json({
          success: result.success,
          data: result,
        });
      }

      case 'detectIntent': {
        // Just detect intent without fetching contracts
        const { getContractIntentClassifier } = await import('~/lib/.server/move-contracts/contract-intent-classifier');
        const classifier = getContractIntentClassifier();
        const intent = classifier.detectIntent(params.prompt);
        
        return Response.json({
          success: true,
          data: { intent },
        });
      }

      case 'searchGitHub': {
        // Search GitHub for contracts
        const scraper = getGitHubContractScraper(params.githubConfig);
        const contracts = await scraper.searchContracts(params.pattern || '');
        
        return Response.json({
          success: true,
          data: { contracts },
        });
      }

      case 'fetchContract': {
        // Fetch specific contract from GitHub
        const scraper = getGitHubContractScraper(params.githubConfig);
        const contract = await scraper.fetchContract(params.path);
        
        return Response.json({
          success: true,
          data: { contract },
        });
      }

      case 'searchDatabase': {
        // Search local contract database
        const database = getContractDatabase();
        const results = database.searchContracts(params.query);
        
        return Response.json({
          success: true,
          data: { contracts: results },
        });
      }

      case 'getContractsByCategory': {
        // Get contracts by category
        const database = getContractDatabase();
        const contracts = database.getContractsByCategory(params.category);
        
        return Response.json({
          success: true,
          data: { contracts },
        });
      }

      case 'getDatabaseStats': {
        // Get database statistics
        const database = getContractDatabase();
        const stats = database.getStats();
        
        return Response.json({
          success: true,
          data: { stats },
        });
      }

      case 'updateGitHubConfig': {
        // Update GitHub configuration
        const scraper = getGitHubContractScraper();
        scraper.updateConfig(params.config);
        
        return Response.json({
          success: true,
          message: 'GitHub configuration updated',
        });
      }

      case 'validateContract': {
        // Validate a Move contract
        const { getContractProcessor } = await import('~/lib/.server/move-contracts/contract-processor');
        const processor = getContractProcessor();
        const processed = processor.processContract(params.content);
        
        return Response.json({
          success: processed.isValid,
          data: {
            isValid: processed.isValid,
            errors: processed.validationErrors,
            moduleName: processed.moduleName,
            functions: processed.functions,
            dependencies: processed.dependencies,
          },
        });
      }

      case 'generateMoveToml': {
        // Generate Move.toml file
        const { getContractProcessor } = await import('~/lib/.server/move-contracts/contract-processor');
        const processor = getContractProcessor();
        const toml = processor.generateMoveToml(
          params.projectName,
          params.dependencies || [],
          params.address
        );
        
        return Response.json({
          success: true,
          data: { moveToml: toml },
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${contractAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Move Contracts API Error:', error);
    
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
