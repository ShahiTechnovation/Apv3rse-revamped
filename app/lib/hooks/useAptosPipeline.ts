/**
 * Hook for Aptos Pipeline Execution
 * Handles the complete flow from prompt to deployment
 */

import { useState, useCallback, useRef } from 'react';
import type { PipelineStatus, PipelineResult } from '~/lib/.server/aptos-execution-pipeline';
import type { DeploymentResult } from '~/lib/.server/aptos-deployment-service';

export interface UseAptosPipelineOptions {
  onStatusUpdate?: (status: PipelineStatus) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string) => void;
}

export function useAptosPipeline(options: UseAptosPipelineOptions = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; content: string }>>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const executePipeline = useCallback(async (
    prompt: string,
    config: {
      network?: 'devnet' | 'testnet' | 'mainnet';
      autoDeploy?: boolean;
      includeUI?: boolean;
      privateKey?: string;
    } = {}
  ) => {
    setIsExecuting(true);
    setPipelineStatus(null);
    setDeploymentResult(null);
    setGeneratedFiles([]);

    try {
      const response = await fetch('/api/aptos-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'execute',
          params: {
            prompt,
            network: config.network || 'devnet',
            autoDeploy: config.autoDeploy !== false,
            includeUI: config.includeUI !== false,
            privateKey: config.privateKey,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start pipeline execution');
      }

      // Set up SSE for real-time updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                setPipelineStatus(data.data);
                options.onStatusUpdate?.(data.data);
              } else if (data.type === 'complete') {
                const result = data.data as PipelineResult;
                
                if (result.deployment) {
                  setDeploymentResult(result.deployment);
                }
                
                if (result.files) {
                  setGeneratedFiles(result.files);
                }
                
                options.onComplete?.(result);
                setIsExecuting(false);
              } else if (data.type === 'error') {
                options.onError?.(data.data.error);
                setIsExecuting(false);
              }
            } catch (error) {
              console.error('Failed to parse SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Pipeline execution error:', error);
      options.onError?.(error instanceof Error ? error.message : 'Pipeline execution failed');
      setIsExecuting(false);
    }
  }, [options]);

  const cancelExecution = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsExecuting(false);
  }, []);

  const isAptosPrompt = useCallback((prompt: string): boolean => {
    const aptosKeywords = [
      'move', 'aptos', 'smart contract', 'nft', 'token', 'fungible',
      'deploy', 'blockchain', 'module', 'dapp', 'web3', 'defi',
      'collection', 'mint', 'transfer', 'burn'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    return aptosKeywords.some(keyword => lowerPrompt.includes(keyword));
  }, []);

  return {
    executePipeline,
    cancelExecution,
    isAptosPrompt,
    isExecuting,
    pipelineStatus,
    deploymentResult,
    generatedFiles,
  };
}
