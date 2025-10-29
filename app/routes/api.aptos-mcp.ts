/**
 * API Routes for Aptos MCP Tools
 * Provides endpoints to interact with Aptos MCP server
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { getAptosMCPService } from '~/lib/.server/aptos-mcp-service';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.aptos-mcp');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { action: mcpAction, params } = await request.json<{
      action: string;
      params: any;
    }>();

    logger.info(`MCP Action: ${mcpAction}`);

    const mcpService = await getAptosMCPService();

    switch (mcpAction) {
      case 'compile': {
        const { code, moduleName } = params;
        const result = await mcpService.compileMoveCode(code, moduleName);
        return Response.json(result);
      }

      case 'deploy': {
        const { bytecode, network, privateKey } = params;
        const result = await mcpService.deployMoveModule(bytecode, network, privateKey);
        return Response.json(result);
      }

      case 'createAccount': {
        const result = await mcpService.createAccount();
        return Response.json(result);
      }

      case 'getBalance': {
        const { address, network } = params;
        const result = await mcpService.getAccountBalance(address, network);
        return Response.json(result);
      }

      case 'executeFunction': {
        const { moduleAddress, moduleName, functionName, args, network } = params;
        const result = await mcpService.executeMoveFunction(
          moduleAddress,
          moduleName,
          functionName,
          args,
          network
        );
        return Response.json(result);
      }

      case 'getVersion': {
        const version = await mcpService.getVersion();
        return Response.json({ success: true, version });
      }

      case 'status': {
        const isReady = mcpService.isReady();
        return Response.json({ success: true, isReady });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${mcpAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('MCP API Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function loader() {
  try {
    const mcpService = await getAptosMCPService();
    const isReady = mcpService.isReady();
    const version = await mcpService.getVersion();

    return Response.json({
      success: true,
      isReady,
      version,
    });
  } catch (error) {
    logger.error('MCP Status Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
