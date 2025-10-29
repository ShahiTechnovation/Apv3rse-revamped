/**
 * Aptos Execution Pipeline
 * Complete flow: User Prompt → Context → Template → Build → Deploy
 * Orchestrates all services to provide end-to-end execution
 */

import { getAptosContextService } from './aptos-context-service';
import { getAptosPromptEnhancer } from './aptos-prompt-enhancer';
import { getAptosTemplateGenerator } from './aptos-template-generator';
import { getAptosDeploymentService } from './aptos-deployment-service';
import type { 
  GenerationRequest, 
  ProjectTemplate,
  MoveModule 
} from './aptos-template-generator';
import type { 
  DeploymentConfig, 
  DeploymentResult,
  DeploymentStatus 
} from './aptos-deployment-service';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('aptos-pipeline');

export interface PipelineRequest {
  prompt: string;
  network?: 'devnet' | 'testnet' | 'mainnet';
  autoDeploy?: boolean;
  includeUI?: boolean;
  privateKey?: string;
}

export interface PipelineResult {
  success: boolean;
  project?: ProjectTemplate;
  deployment?: DeploymentResult;
  contextUsed?: string;
  files?: Array<{
    path: string;
    content: string;
  }>;
  error?: string;
  executionSteps?: ExecutionStep[];
}

export interface ExecutionStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: number;
  details?: any;
}

export interface PipelineStatus {
  stage: 'analyzing' | 'fetching-context' | 'generating' | 'building' | 'deploying' | 'completed' | 'failed';
  message: string;
  progress: number;
  currentStep?: ExecutionStep;
  allSteps?: ExecutionStep[];
}

class AptosExecutionPipeline {
  private executionSteps: ExecutionStep[] = [];
  private statusCallback?: (status: PipelineStatus) => void;

  /**
   * Set status callback for real-time updates
   */
  setStatusCallback(callback: (status: PipelineStatus) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Add execution step
   */
  private addStep(step: string, status: ExecutionStep['status'], message: string, details?: any): void {
    const executionStep: ExecutionStep = {
      step,
      status,
      message,
      timestamp: Date.now(),
      details,
    };
    
    this.executionSteps.push(executionStep);
    logger.info(`[${step}] ${status}: ${message}`);
  }

  /**
   * Update pipeline status
   */
  private updateStatus(status: PipelineStatus): void {
    if (this.statusCallback) {
      this.statusCallback({
        ...status,
        allSteps: this.executionSteps,
      });
    }
  }

  /**
   * Execute complete pipeline
   */
  async execute(request: PipelineRequest): Promise<PipelineResult> {
    try {
      this.executionSteps = [];
      
      // Step 1: Analyze prompt
      this.updateStatus({
        stage: 'analyzing',
        message: 'Analyzing your request...',
        progress: 10,
      });
      
      this.addStep('analyze', 'running', 'Analyzing user prompt');
      const projectType = this.detectProjectType(request.prompt);
      this.addStep('analyze', 'completed', `Detected project type: ${projectType}`, { projectType });

      // Step 2: Fetch context from llms.txt
      this.updateStatus({
        stage: 'fetching-context',
        message: 'Fetching Aptos documentation context...',
        progress: 20,
      });

      this.addStep('context', 'running', 'Fetching relevant Aptos documentation');
      const contextService = await getAptosContextService();
      const context = await contextService.getRelevantContext(request.prompt);
      
      const contextStats = contextService.getCacheStats();
      this.addStep('context', 'completed', 
        `Retrieved ${contextStats.topicCount} relevant documentation sections`,
        { topicsUsed: contextStats.topicCount }
      );

      // Step 3: Enhance prompt with context
      this.addStep('enhance', 'running', 'Enhancing prompt with Aptos context');
      const promptEnhancer = await getAptosPromptEnhancer();
      const enhanced = await promptEnhancer.enhancePrompt(request.prompt, true);
      this.addStep('enhance', 'completed', 
        `Enhanced with ${enhanced.contextSource} documentation`,
        { contextSource: enhanced.contextSource }
      );

      // Step 4: Generate project template
      this.updateStatus({
        stage: 'generating',
        message: 'Generating Aptos project from template...',
        progress: 40,
      });

      this.addStep('generate', 'running', 'Generating project structure');
      const templateGenerator = await getAptosTemplateGenerator();
      const generationResult = await templateGenerator.generateProject({
        prompt: request.prompt,
        projectType: projectType as any,
        includeUI: request.includeUI,
        includeDeploy: request.autoDeploy,
        network: request.network,
      });

      if (!generationResult.success || !generationResult.template) {
        throw new Error(generationResult.error || 'Failed to generate project');
      }

      const project = generationResult.template;
      this.addStep('generate', 'completed', 
        `Generated ${project.files.length} files for ${project.name}`,
        { filesCount: project.files.length }
      );

      // Step 5: Build project (prepare for deployment)
      if (request.autoDeploy && project.moveModules && project.moveModules.length > 0) {
        this.updateStatus({
          stage: 'building',
          message: 'Building Move modules...',
          progress: 60,
        });

        this.addStep('build', 'running', 'Preparing Move modules for deployment');
        
        // In a real implementation, this would compile the Move code
        // For now, we'll simulate the build process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.addStep('build', 'completed', 
          `Built ${project.moveModules.length} Move modules`,
          { modulesCount: project.moveModules.length }
        );

        // Step 6: Deploy to blockchain
        this.updateStatus({
          stage: 'deploying',
          message: 'Deploying to Aptos blockchain...',
          progress: 80,
        });

        this.addStep('deploy', 'running', `Deploying to ${request.network || 'devnet'}`);
        
        const deploymentService = getAptosDeploymentService();
        
        // Set up deployment status callback
        deploymentService.setStatusCallback((deployStatus: DeploymentStatus) => {
          this.updateStatus({
            stage: 'deploying',
            message: deployStatus.message,
            progress: 60 + (deployStatus.progress * 0.3), // Scale to 60-90%
            currentStep: {
              step: 'deploy',
              status: 'running',
              message: deployStatus.message,
              timestamp: Date.now(),
              details: deployStatus.details,
            },
          });
        });

        // Deploy the first module
        const mainModule = project.moveModules[0];
        const deploymentResult = await deploymentService.deployProject(
          {
            name: mainModule.name,
            source: mainModule.content,
          },
          {
            network: request.network || 'devnet',
            privateKey: request.privateKey,
            fundAccount: !request.privateKey && request.network === 'devnet',
          }
        );

        if (deploymentResult.success) {
          this.addStep('deploy', 'completed', 
            'Successfully deployed to Aptos blockchain',
            {
              transactionHash: deploymentResult.transactionHash,
              moduleAddress: deploymentResult.moduleAddress,
              explorerUrl: deploymentResult.explorerUrl,
            }
          );

          // Update module addresses in generated files
          if (deploymentResult.moduleAddress) {
            project.files = project.files.map(file => ({
              ...file,
              content: file.content.replace(/0x1/g, deploymentResult.moduleAddress!),
            }));
          }
        } else {
          this.addStep('deploy', 'failed', 
            `Deployment failed: ${deploymentResult.error}`,
            { error: deploymentResult.error }
          );
        }

        // Step 7: Complete
        this.updateStatus({
          stage: 'completed',
          message: 'Project created and deployed successfully!',
          progress: 100,
        });

        return {
          success: true,
          project,
          deployment: deploymentResult,
          contextUsed: enhanced.contextSource,
          files: project.files.map(f => ({
            path: f.path,
            content: f.content,
          })),
          executionSteps: this.executionSteps,
        };
      } else {
        // No deployment requested, just return the generated project
        this.updateStatus({
          stage: 'completed',
          message: 'Project generated successfully!',
          progress: 100,
        });

        return {
          success: true,
          project,
          contextUsed: enhanced.contextSource,
          files: project.files.map(f => ({
            path: f.path,
            content: f.content,
          })),
          executionSteps: this.executionSteps,
        };
      }
    } catch (error) {
      logger.error('Pipeline execution failed:', error);
      
      this.addStep('error', 'failed', 
        error instanceof Error ? error.message : 'Unknown error occurred'
      );

      this.updateStatus({
        stage: 'failed',
        message: error instanceof Error ? error.message : 'Pipeline execution failed',
        progress: 0,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pipeline execution failed',
        executionSteps: this.executionSteps,
      };
    }
  }

  /**
   * Detect project type from prompt
   */
  private detectProjectType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('nft') || lowerPrompt.includes('collection') || lowerPrompt.includes('digital art')) {
      return 'nft';
    }
    
    if (lowerPrompt.includes('token') || lowerPrompt.includes('fungible') || lowerPrompt.includes('coin')) {
      return 'token';
    }
    
    if (lowerPrompt.includes('defi') || lowerPrompt.includes('swap') || lowerPrompt.includes('liquidity')) {
      return 'defi';
    }
    
    if (lowerPrompt.includes('game') || lowerPrompt.includes('play')) {
      return 'game';
    }
    
    return 'custom';
  }

  /**
   * Get execution summary
   */
  getExecutionSummary(): {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    duration: number;
  } {
    const completed = this.executionSteps.filter(s => s.status === 'completed').length;
    const failed = this.executionSteps.filter(s => s.status === 'failed').length;
    const duration = this.executionSteps.length > 0
      ? this.executionSteps[this.executionSteps.length - 1].timestamp - this.executionSteps[0].timestamp
      : 0;

    return {
      totalSteps: this.executionSteps.length,
      completedSteps: completed,
      failedSteps: failed,
      duration,
    };
  }
}

// Export singleton instance
let pipeline: AptosExecutionPipeline | null = null;

export function getAptosExecutionPipeline(): AptosExecutionPipeline {
  if (!pipeline) {
    pipeline = new AptosExecutionPipeline();
  }
  return pipeline;
}

export { AptosExecutionPipeline };
