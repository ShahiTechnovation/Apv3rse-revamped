import React from 'react';
import { useStore } from '@nanostores/react';
import { tokenBalanceStore, formatTokenAmount } from '~/lib/stores/token';
import { isWalletConnected } from '~/lib/stores/wallet';
import * as Tooltip from '@radix-ui/react-tooltip';
import { classNames } from '~/utils/classNames';

export const TokenBalance: React.FC = () => {
  const tokenBalance = useStore(tokenBalanceStore);
  const connected = useStore(isWalletConnected);

  // Only show when wallet is connected
  if (!connected) {
    return null;
  }

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className={classNames(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              'bg-gradient-to-r from-purple-500/10 to-pink-500/10',
              'border border-purple-500/30',
              'transition-all duration-200',
              'hover:from-purple-500/20 hover:to-pink-500/20',
              'hover:border-purple-500/50',
              'cursor-pointer'
            )}
          >
            {/* Token Icon */}
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              {/* Pulse animation for showcase */}
              <div className="absolute inset-0 w-6 h-6 rounded-full bg-purple-500/50 animate-ping" />
            </div>

            {/* Balance Display */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-bolt-elements-textPrimary">
                  {formatTokenAmount(tokenBalance.apv)}
                </span>
                <span className="text-xs font-medium text-purple-500">$APV</span>
              </div>
            </div>

            {/* Testnet Badge */}
            <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
              TESTNET
            </div>
          </div>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            className={classNames(
              'max-w-[280px] bg-bolt-elements-background-depth-2 rounded-lg p-3',
              'border border-bolt-elements-borderColor shadow-xl',
              'animate-in fade-in-0 zoom-in-95'
            )}
            sideOffset={5}
          >
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <div className="font-semibold text-bolt-elements-textPrimary">
                    $APV Token Balance
                  </div>
                  <div className="text-xs text-bolt-elements-textSecondary mt-0.5">
                    Pay-as-you-go AI payments
                  </div>
                </div>
              </div>

              <div className="h-px bg-bolt-elements-borderColor" />

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-bolt-elements-textSecondary">$APV Balance</span>
                  <span className="text-sm font-semibold text-bolt-elements-textPrimary">
                    {formatTokenAmount(tokenBalance.apv)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-bolt-elements-textSecondary">Network</span>
                  <span className="text-sm text-yellow-500 font-medium">Testnet</span>
                </div>
              </div>

              <div className="h-px bg-bolt-elements-borderColor" />

              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                <div className="text-xs text-bolt-elements-textSecondary leading-relaxed">
                  <span className="text-blue-500 font-semibold">🚀 Showcase Feature</span>
                  <br />
                  This is a testnet preview. When mainnet launches, you'll be able to:
                  <ul className="mt-1 ml-3 space-y-0.5 list-disc">
                    <li>Pay for LLM usage with $APV, $APT, or $USDC</li>
                    <li>No subscriptions - pay only for what you use</li>
                    <li>Transparent on-chain transactions</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  className={classNames(
                    'flex-1 px-3 py-1.5 rounded text-xs font-medium',
                    'bg-purple-500/20 text-purple-500 border border-purple-500/30',
                    'hover:bg-purple-500/30 transition-colors',
                    'cursor-not-allowed opacity-60'
                  )}
                  disabled
                >
                  Top Up (Soon)
                </button>
                <button
                  className={classNames(
                    'flex-1 px-3 py-1.5 rounded text-xs font-medium',
                    'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary',
                    'border border-bolt-elements-borderColor',
                    'hover:bg-bolt-elements-background-depth-4 transition-colors',
                    'cursor-not-allowed opacity-60'
                  )}
                  disabled
                >
                  History (Soon)
                </button>
              </div>
            </div>

            <Tooltip.Arrow className="fill-bolt-elements-background-depth-2" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
