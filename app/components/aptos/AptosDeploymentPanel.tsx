/**
 * Aptos Deployment Panel
 * Shows real-time deployment status and execution steps
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileCode, 
  Database,
  Globe,
  Terminal,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
  Package,
  Code2
} from 'lucide-react';
import type { PipelineStatus, ExecutionStep } from '~/lib/.server/aptos-execution-pipeline';
import type { DeploymentResult } from '~/lib/.server/aptos-deployment-service';

interface AptosDeploymentPanelProps {
  isDeploying: boolean;
  pipelineStatus?: PipelineStatus;
  deploymentResult?: DeploymentResult;
  onClose?: () => void;
}

const stageIcons: Record<string, React.ReactNode> = {
  analyzing: <Terminal className="w-5 h-5" />,
  'fetching-context': <Database className="w-5 h-5" />,
  generating: <FileCode className="w-5 h-5" />,
  building: <Package className="w-5 h-5" />,
  deploying: <Rocket className="w-5 h-5" />,
  completed: <CheckCircle className="w-5 h-5" />,
  failed: <XCircle className="w-5 h-5" />,
};

const stageColors: Record<string, string> = {
  analyzing: 'text-blue-500',
  'fetching-context': 'text-purple-500',
  generating: 'text-indigo-500',
  building: 'text-yellow-500',
  deploying: 'text-orange-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
};

export function AptosDeploymentPanel({
  isDeploying,
  pipelineStatus,
  deploymentResult,
  onClose,
}: AptosDeploymentPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (!isDeploying && !deploymentResult) {
    return null;
  }

  const currentStage = pipelineStatus?.stage || 'analyzing';
  const progress = pipelineStatus?.progress || 0;
  const executionSteps = pipelineStatus?.allSteps || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold">Aptos Deployment Pipeline</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className={`${stageColors[currentStage]} animate-pulse`}>
              {stageIcons[currentStage]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {pipelineStatus?.message || 'Initializing...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Stage: {currentStage.replace('-', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {progress}% Complete
          </p>
        </div>

        {/* Execution Steps */}
        {executionSteps.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setExpandedSteps(!expandedSteps)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Execution Steps ({executionSteps.filter(s => s.status === 'completed').length}/{executionSteps.length})
              </span>
              {expandedSteps ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            <AnimatePresence>
              {expandedSteps && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                    {executionSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        {step.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        )}
                        {step.status === 'running' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin mt-0.5" />
                        )}
                        {step.status === 'failed' && (
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        )}
                        {step.status === 'pending' && (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-300">{step.message}</p>
                          {step.details && (
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                              {JSON.stringify(step.details).substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Deployment Result */}
        {deploymentResult && deploymentResult.success && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Deployment Successful!</span>
            </div>

            {deploymentResult.transactionHash && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Transaction Hash:</span>
                  <button
                    onClick={() => copyToClipboard(deploymentResult.transactionHash!)}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    {copiedHash ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block truncate">
                  {deploymentResult.transactionHash}
                </code>
              </div>
            )}

            {deploymentResult.moduleAddress && (
              <div className="space-y-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Module Address:</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block truncate">
                  {deploymentResult.moduleAddress}
                </code>
              </div>
            )}

            {deploymentResult.explorerUrl && (
              <a
                href={deploymentResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Globe className="w-4 h-4" />
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {deploymentResult.gasUsed && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Gas Used: {deploymentResult.gasUsed.toLocaleString()} Octas
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {deploymentResult && !deploymentResult.success && (
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Deployment Failed</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {deploymentResult.error || 'An unknown error occurred'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">Powered by Aptos</span>
            </div>
            {currentStage === 'deploying' && (
              <span className="text-xs text-gray-500 animate-pulse">
                Please wait, do not close...
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
