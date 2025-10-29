import { atom } from 'nanostores';
import type { Agent } from '~/components/chat/AgentStore';

// Load agents from localStorage on initialization
const loadAgents = (): Agent[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const savedAgents = localStorage.getItem('bolt_agents');

  if (!savedAgents) {
    return [];
  }

  try {
    return JSON.parse(savedAgents);
  } catch (e) {
    console.error('Error loading agents:', e);
    return [];
  }
};

export const agentsStore = atom<Agent[]>(loadAgents());

// Save agents to localStorage whenever the store updates
agentsStore.subscribe((agents) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('bolt_agents', JSON.stringify(agents));
});

export const saveAgent = (name: string, description: string, messages: any[], files: any[]) => {
  const newAgent: Agent = {
    id: Date.now().toString(),
    name,
    description,
    createdAt: new Date(),
    messages,
    files,
  };

  agentsStore.set([...agentsStore.get(), newAgent]);

  return newAgent;
};

export const deleteAgent = (agentId: string) => {
  const agents = agentsStore.get();
  agentsStore.set(agents.filter((agent) => agent.id !== agentId));
};

export const loadAgent = (agentId: string): Agent | undefined => {
  const agents = agentsStore.get();
  return agents.find((agent) => agent.id === agentId);
};
