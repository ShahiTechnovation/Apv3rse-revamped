/**
 * Aptos MCP Service
 * Server-side integration with Aptos Model Context Protocol
 * Provides tools for compiling, deploying, and managing Move contracts
 */

import { spawn, type ChildProcess } from 'child_process';

interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface CompileResult {
  success: boolean;
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
}

interface DeployResult {
  success: boolean;
  transactionHash?: string;
  address?: string;
  error?: string;
}

class AptosMCPService {
  private mcpProcess: ChildProcess | null = null;
  private isInitialized: boolean = false;
  private botKey: string;

  constructor() {
    this.botKey = process.env.APTOS_BOT_KEY || '';
    if (!this.botKey) {
      console.warn('[AptosMCP] Warning: APTOS_BOT_KEY not set. MCP functionality will be limited.');
    }
  }

  /**
   * Initialize the MCP service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('[AptosMCP] Initializing Aptos MCP Service...');

    try {
      // Start MCP server process
      await this.startMCPServer();
      this.isInitialized = true;
      console.log('[AptosMCP] Initialization complete');
    } catch (error) {
      console.error('[AptosMCP] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start the MCP server process
   */
  private async startMCPServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start MCP server using npx
        this.mcpProcess = spawn('npx', ['-y', '@aptos-labs/aptos-mcp'], {
          env: {
            ...process.env,
            APTOS_BOT_KEY: this.botKey,
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.mcpProcess.on('error', (error) => {
          console.error('[AptosMCP] Process error:', error);
          reject(error);
        });

        this.mcpProcess.stdout?.on('data', (data) => {
          console.log('[AptosMCP]', data.toString());
        });

        this.mcpProcess.stderr?.on('data', (data) => {
          console.error('[AptosMCP Error]', data.toString());
        });

        // Give it a moment to start
        setTimeout(() => resolve(), 2000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Call an MCP tool
   */
  private async callMCPTool(toolName: string, params: any): Promise<MCPToolResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Send JSON-RPC request to MCP server
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: `tools/${toolName}`,
        params,
      };

      return new Promise((resolve, reject) => {
        if (!this.mcpProcess || !this.mcpProcess.stdin) {
          reject(new Error('MCP process not available'));
          return;
        }

        this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

        const timeout = setTimeout(() => {
          reject(new Error('MCP tool call timeout'));
        }, 30000); // 30 second timeout

        const handleResponse = (data: Buffer) => {
          try {
            const response = JSON.parse(data.toString());
            clearTimeout(timeout);
            this.mcpProcess?.stdout?.off('data', handleResponse);

            if (response.error) {
              resolve({
                success: false,
                error: response.error.message || 'Unknown error',
              });
            } else {
              resolve({
                success: true,
                data: response.result,
              });
            }
          } catch (error) {
            // Not a complete JSON response yet, wait for more data
          }
        };

        this.mcpProcess.stdout?.on('data', handleResponse);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Compile Move code
   */
  async compileMoveCode(code: string, moduleName: string): Promise<CompileResult> {
    console.log(`[AptosMCP] Compiling Move module: ${moduleName}`);

    try {
      const result = await this.callMCPTool('compile', {
        code,
        moduleName,
      });

      if (!result.success) {
        return {
          success: false,
          errors: [result.error || 'Compilation failed'],
        };
      }

      return {
        success: true,
        bytecode: result.data?.bytecode,
        warnings: result.data?.warnings || [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown compilation error'],
      };
    }
  }

  /**
   * Deploy Move module
   */
  async deployMoveModule(
    bytecode: string,
    network: 'devnet' | 'testnet' | 'mainnet',
    accountPrivateKey?: string
  ): Promise<DeployResult> {
    console.log(`[AptosMCP] Deploying Move module to ${network}`);

    try {
      const result = await this.callMCPTool('deploy', {
        bytecode,
        network,
        privateKey: accountPrivateKey,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Deployment failed',
        };
      }

      return {
        success: true,
        transactionHash: result.data?.transactionHash,
        address: result.data?.address,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  /**
   * Create Aptos account
   */
  async createAccount(): Promise<MCPToolResult> {
    console.log('[AptosMCP] Creating new Aptos account');

    try {
      return await this.callMCPTool('createAccount', {});
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Account creation failed',
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address: string, network: string): Promise<MCPToolResult> {
    console.log(`[AptosMCP] Getting balance for ${address} on ${network}`);

    try {
      return await this.callMCPTool('getBalance', {
        address,
        network,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      };
    }
  }

  /**
   * Execute Move function
   */
  async executeMoveFunction(
    moduleAddress: string,
    moduleName: string,
    functionName: string,
    args: any[],
    network: string
  ): Promise<MCPToolResult> {
    console.log(`[AptosMCP] Executing ${moduleAddress}::${moduleName}::${functionName}`);

    try {
      return await this.callMCPTool('executeFunction', {
        moduleAddress,
        moduleName,
        functionName,
        args,
        network,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Function execution failed',
      };
    }
  }

  /**
   * Get MCP version
   */
  async getVersion(): Promise<string> {
    try {
      const result = await this.callMCPTool('version', {});
      return result.data?.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Shutdown the MCP service
   */
  async shutdown(): Promise<void> {
    if (this.mcpProcess) {
      console.log('[AptosMCP] Shutting down MCP service...');
      this.mcpProcess.kill();
      this.mcpProcess = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.mcpProcess !== null;
  }
}

// Singleton instance
let aptosMCPService: AptosMCPService | null = null;

/**
 * Get or create the Aptos MCP Service instance
 */
export async function getAptosMCPService(): Promise<AptosMCPService> {
  if (!aptosMCPService) {
    aptosMCPService = new AptosMCPService();
    await aptosMCPService.initialize();
  }
  return aptosMCPService;
}

// Cleanup on process exit
process.on('exit', () => {
  if (aptosMCPService) {
    aptosMCPService.shutdown();
  }
});

export { AptosMCPService };
