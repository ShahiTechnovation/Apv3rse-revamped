/**
 * API Route for Aptos Execution Pipeline
 * Handles the complete flow from prompt to deployment
 */

import { type ActionFunctionArgs } from '@remix-run/node';
import { getAptosExecutionPipeline } from '~/lib/.server/aptos-execution-pipeline';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.aptos-pipeline');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { action: pipelineAction, params } = await request.json<{
      action: string;
      params: any;
    }>();

    logger.info(`Pipeline Action: ${pipelineAction}`);

    const pipeline = getAptosExecutionPipeline();

    switch (pipelineAction) {
      case 'execute': {
        const { prompt, network, autoDeploy, includeUI, privateKey } = params;
        
        // Set up SSE response for real-time updates
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Set up status callback for real-time updates
        pipeline.setStatusCallback(async (status) => {
          const data = JSON.stringify({
            type: 'status',
            data: status,
          });
          
          try {
            await writer.write(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            logger.error('Failed to write status update:', error);
          }
        });

        // Execute pipeline in background
        (async () => {
          try {
            const result = await pipeline.execute({
              prompt,
              network: network || 'devnet',
              autoDeploy: autoDeploy !== false,
              includeUI: includeUI !== false,
              privateKey,
            });

            // Send final result
            const data = JSON.stringify({
              type: 'complete',
              data: result,
            });
            
            await writer.write(encoder.encode(`data: ${data}\n\n`));
            await writer.close();
          } catch (error) {
            logger.error('Pipeline execution error:', error);
            
            const data = JSON.stringify({
              type: 'error',
              data: {
                error: error instanceof Error ? error.message : 'Pipeline execution failed',
              },
            });
            
            await writer.write(encoder.encode(`data: ${data}\n\n`));
            await writer.close();
          }
        })();

        // Return SSE response
        return new Response(stream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      case 'executeSync': {
        // Synchronous execution (no real-time updates)
        const result = await pipeline.execute(params);
        return Response.json(result);
      }

      case 'summary': {
        // Get execution summary
        const summary = pipeline.getExecutionSummary();
        return Response.json({
          success: true,
          summary,
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${pipelineAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Pipeline API Error:', error);
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
  return Response.json({
    success: true,
    message: 'Aptos Execution Pipeline API',
    endpoints: {
      execute: 'Execute complete pipeline with SSE updates',
      executeSync: 'Execute pipeline synchronously',
      summary: 'Get execution summary',
    },
  });
}
