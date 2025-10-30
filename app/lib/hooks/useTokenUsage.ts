import { useEffect } from 'react';
import { simulateTokenUsage } from '~/lib/stores/token';
import { isWalletConnected } from '~/lib/stores/wallet';

/**
 * Hook to simulate token usage for LLM calls (showcase feature)
 * Deducts a small amount from $APV balance on each message
 */
export function useTokenUsage() {
  const handleTokenUsage = (estimatedTokens?: number) => {
    // Only simulate if wallet is connected
    if (!isWalletConnected.get()) {
      return;
    }

    // Calculate cost based on estimated tokens
    // Using rough estimate: $0.01 per 1000 tokens
    // Convert to $APV (assuming 1 $APV = ~$0.01 for showcase)
    const tokens = estimatedTokens || 1000; // Default to 1000 tokens
    const costInDollars = (tokens / 1000) * 0.01; // $0.01 per 1k tokens
    const costInAPV = costInDollars * 100; // Convert to APV (1 APV = $0.01)

    // Simulate the deduction
    simulateTokenUsage(costInAPV);
  };

  return { handleTokenUsage };
}

/**
 * Calculate estimated cost for a message
 * @param messageLength - Length of the message in characters
 * @returns Estimated cost in $APV tokens
 */
export function estimateMessageCost(messageLength: number): number {
  // Rough estimate: 1 token ≈ 4 characters
  const estimatedTokens = messageLength / 4;
  const costInDollars = (estimatedTokens / 1000) * 0.01;
  const costInAPV = costInDollars * 100;
  
  return Math.max(0.1, Math.min(costInAPV, 5)); // Min 0.1, Max 5 APV per message
}
