/**
 * Tools Tab - UI for enabling/disabling integrations
 */

import { useStore } from '@nanostores/react';
import { enabledToolsStore, toggleTool } from '~/lib/stores/tools';
import { AVAILABLE_TOOLS } from '~/lib/tools/registry';

export function ToolsTab() {
  const enabledTools = useStore(enabledToolsStore);

  const groupedTools = AVAILABLE_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_TOOLS>);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-bolt-elements-textPrimary mb-2">
          Integration Tools
        </h3>
        <p className="text-sm text-bolt-elements-textSecondary">
          Enable tools to add context and capabilities to your AI assistant
        </p>
      </div>

      {Object.entries(groupedTools).map(([category, tools]) => (
        <div key={category} className="mb-6">
          <h4 className="text-md font-medium text-bolt-elements-textPrimary mb-3 capitalize">
            {category}
          </h4>
          <div className="space-y-3">
            {tools.map((tool) => {
              const isEnabled = enabledTools.includes(tool.id);
              const isAlwaysEnabled = tool.alwaysEnabled || tool.id === 'aptos';
              const isComingSoon = tool.comingSoon;
              
              return (
                <div
                  key={tool.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    isComingSoon 
                      ? 'bg-bolt-elements-background-depth-1 opacity-60' 
                      : isAlwaysEnabled 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3'
                  }`}
                >
                  <div className="text-2xl">{tool.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-bolt-elements-textPrimary">
                        {tool.name}
                      </h5>
                      {isComingSoon && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                          Coming Soon
                        </span>
                      )}
                      {isAlwaysEnabled && !isComingSoon && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                          Always On
                        </span>
                      )}
                      {tool.documentationUrl && !isComingSoon && (
                        <a
                          href={tool.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-bolt-elements-link hover:underline"
                        >
                          Docs
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-bolt-elements-textSecondary">
                      {tool.description}
                    </p>
                  </div>
                  {!isComingSoon && (
                    <button
                      onClick={() => !isAlwaysEnabled && toggleTool(tool.id)}
                      disabled={isAlwaysEnabled}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isEnabled
                          ? isAlwaysEnabled
                            ? 'bg-green-500 text-white cursor-not-allowed'
                            : 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover'
                          : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-4'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 rounded-lg bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor">
        <p className="text-xs text-bolt-elements-textSecondary">
          💡 <strong>Tip:</strong> Enabled tools add specific knowledge and capabilities to Apv3rse's responses.
          For example, enabling x402 will make Apv3rse automatically integrate payment functionality into APIs.
        </p>
      </div>
    </div>
  );
}
