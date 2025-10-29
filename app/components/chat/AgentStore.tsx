import React from 'react';
import { classNames } from '~/utils/classNames';

export interface Agent {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  messages: any[]; // Store chat history
  files: any[]; // Store project files
}

interface AgentStoreProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onAgentSelect: (agent: Agent) => void;
  onAgentDelete: (agentId: string) => void;
}

export const AgentStore: React.FC<AgentStoreProps> = ({ isOpen, onClose, agents, onAgentSelect, onAgentDelete }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[80%] max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">My Agents</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <div className="i-ph:x text-xl" />
          </button>
        </div>

        {agents.length === 0 ? (
          <div className="text-center text-bolt-elements-textSecondary py-8">
            No saved agents yet. Create a project and save it as an agent!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-bolt-elements-borderColor rounded-lg p-4 hover:bg-bolt-elements-background-depth-2 transition-colors"
              >
                <h3 className="font-semibold text-bolt-elements-textPrimary mb-2">{agent.name}</h3>
                <p className="text-sm text-bolt-elements-textSecondary mb-4">{agent.description}</p>
                <div className="text-xs text-bolt-elements-textTertiary mb-4">
                  Created: {new Date(agent.createdAt).toLocaleDateString()}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => onAgentSelect(agent)}
                    className="text-sm px-3 py-1 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded hover:bg-bolt-elements-button-primary-backgroundHover"
                  >
                    Load Agent
                  </button>
                  <button
                    onClick={() => onAgentDelete(agent.id)}
                    className="text-sm px-3 py-1 bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text rounded hover:bg-bolt-elements-button-danger-backgroundHover"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
