import { atom, map } from 'nanostores';

export interface TokenBalance {
  apv: number;
  apt: number;
  usdc: number;
}

// Create a store for token balances
export const tokenBalanceStore = map<TokenBalance>({
  apv: 1247.5, // Mock balance for showcase
  apt: 0,
  usdc: 0,
});

// Helper atoms
export const apvBalance = atom<number>(1247.5);
export const aptBalance = atom<number>(0);
export const usdcBalance = atom<number>(0);

// Subscribe to token balance changes
tokenBalanceStore.subscribe((state) => {
  apvBalance.set(state.apv);
  aptBalance.set(state.apt);
  usdcBalance.set(state.usdc);
});

// Helper functions
export const updateTokenBalance = (updates: Partial<TokenBalance>) => {
  const currentState = tokenBalanceStore.get();
  tokenBalanceStore.set({ ...currentState, ...updates });
};

export const setApvBalance = (balance: number) => {
  updateTokenBalance({ apv: balance });
};

export const formatTokenAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Simulate token usage (for showcase)
export const simulateTokenUsage = (cost: number) => {
  const currentBalance = tokenBalanceStore.get();
  if (currentBalance.apv >= cost) {
    updateTokenBalance({ apv: currentBalance.apv - cost });
  }
};

// Reset to mock balance (for testing)
export const resetMockBalance = () => {
  tokenBalanceStore.set({
    apv: 1247.5,
    apt: 0,
    usdc: 0,
  });
};
