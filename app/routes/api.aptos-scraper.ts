/**
 * API Route for Aptos Web Scraper
 * Fetches latest documentation and verifies contracts
 */

import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { getAptosWebScraper } from '~/lib/.server/aptos-web-scraper';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.aptos-scraper');

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { action: scraperAction, params } = await request.json<{
      action: string;
      params?: any;
    }>();

    logger.info(`Scraper Action: ${scraperAction}`);

    const scraper = getAptosWebScraper();

    switch (scraperAction) {
      case 'scrapeDocumentation': {
        const { urls } = params;
        const results = await scraper.scrapeDocumentation(urls);
        return Response.json({
          success: true,
          results,
        });
      }

      case 'scrapeExamples': {
        const examples = await scraper.scrapeContractExamples();
        return Response.json({
          success: true,
          examples,
        });
      }

      case 'verifyContract': {
        const { code } = params;
        const verification = scraper.verifyContract(code);
        return Response.json({
          success: true,
          verification,
        });
      }

      case 'fetchBestPractices': {
        const bestPractices = await scraper.fetchBestPractices();
        return Response.json({
          success: true,
          bestPractices,
        });
      }

      case 'generateEnhancedPrompt': {
        const enhancedPrompt = await scraper.generateEnhancedPrompt();
        return Response.json({
          success: true,
          enhancedPrompt,
        });
      }

      case 'clearCache': {
        scraper.clearCache();
        return Response.json({
          success: true,
          message: 'Cache cleared successfully',
        });
      }

      default:
        return Response.json(
          { success: false, error: `Unknown action: ${scraperAction}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Scraper API Error:', error);
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
    const scraper = getAptosWebScraper();
    const stats = scraper.getCacheStats();

    return Response.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Scraper Stats Error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
