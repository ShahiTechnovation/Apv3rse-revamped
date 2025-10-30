/**
 * API Routes for Aptos Context Management
 * Provides endpoints to manage llms.txt cache and retrieve context
 */

import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { getAptosContextService } from '~/lib/.server/aptos-context-service';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.aptos-context');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { action: contextAction, params } = await request.json<{
      action: string;
      params?: any;
    }>();

    logger.info(`Context Action: ${contextAction}`);

    const contextService = await getAptosContextService();

    switch (contextAction) {
      case 'getContext': {
        const { query } = params;
        const context = await contextService.getRelevantContext(query);
        return Response.json({
          success: true,
          context,
        });
      }

      case 'refreshCache': {
        await contextService.refreshCache();
        return Response.json({
          success: true,
          message: 'Cache refreshed successfully',
        });
      }

      case 'isAptosQuery': {
        const { query } = params;
        const isAptos = contextService.isAptosQuery(query);
        return Response.json({
          success: true,
          isAptosQuery: isAptos,
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${contextAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Context API Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const contextService = await getAptosContextService();
    const stats = contextService.getCacheStats();

    return Response.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Context Stats Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
