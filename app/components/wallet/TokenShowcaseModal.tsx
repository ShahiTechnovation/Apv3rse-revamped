import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';
import { isWalletConnected } from '~/lib/stores/wallet';
import { useStore } from '@nanostores/react';

export const TokenShowcaseModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const connected = useStore(isWalletConnected);

  useEffect(() => {
    // Show modal once when wallet is first connected
    if (connected) {
      const hasSeenShowcase = localStorage.getItem('apv-token-showcase-seen');
      if (!hasSeenShowcase) {
        setTimeout(() => {
          setOpen(true);
          localStorage.setItem('apv-token-showcase-seen', 'true');
        }, 1000); // Delay for smoother UX
      }
    }
  }, [connected]);

  const handleManualOpen = () => {
    setOpen(true);
  };

  return (
    <>
      {/* Hidden trigger for manual opening */}
      <button
        onClick={handleManualOpen}
        className="hidden"
        data-token-showcase-trigger
      />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={classNames(
              'fixed inset-0 bg-black/50 backdrop-blur-sm',
              'animate-in fade-in-0',
              'z-50'
            )}
          />
          <Dialog.Content
            className={classNames(
              'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
              'w-full max-w-lg max-h-[85vh] overflow-y-auto',
              'bg-bolt-elements-background-depth-1 rounded-xl shadow-2xl',
              'border border-bolt-elements-borderColor',
              'animate-in fade-in-0 zoom-in-95',
              'p-6 z-50'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">A</span>
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold text-bolt-elements-textPrimary">
                    Introducing $APV Token
                  </Dialog.Title>
                  <p className="text-sm text-bolt-elements-textSecondary">
                    The future of AI payments is here
                  </p>
                </div>
              </div>
              <Dialog.Close
                className={classNames(
                  'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
                  'transition-colors p-1 rounded hover:bg-bolt-elements-background-depth-2'
                )}
              >
                <div className="i-ph:x text-xl" />
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Feature Banner */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🚀</span>
                  <h3 className="font-semibold text-bolt-elements-textPrimary">
                    Pay-As-You-Go AI
                  </h3>
                </div>
                <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">
                  Say goodbye to subscriptions! With $APV tokens, you only pay for what you use.
                  Every LLM request is transparently billed on the Aptos blockchain.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-bolt-elements-textPrimary">
                  What You Can Do:
                </h4>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="i-ph:check text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-bolt-elements-textPrimary">
                      View Your Balance
                    </div>
                    <div className="text-sm text-bolt-elements-textSecondary">
                      See your $APV balance in the navbar (top right)
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="i-ph:currency-circle-dollar text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-bolt-elements-textPrimary">
                      Track Your Usage
                    </div>
                    <div className="text-sm text-bolt-elements-textSecondary">
                      Watch your balance update as you use AI features
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <div className="i-ph:coins text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium text-bolt-elements-textPrimary">
                      Multi-Token Support
                    </div>
                    <div className="text-sm text-bolt-elements-textSecondary">
                      Future: Pay with $APV, $APT, or $USDC (coming soon)
                    </div>
                  </div>
                </div>
              </div>

              {/* Testnet Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="i-ph:warning text-yellow-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-500 mb-1">
                      Testnet Preview
                    </div>
                    <p className="text-sm text-bolt-elements-textSecondary leading-relaxed">
                      This is a <strong>showcase feature</strong> on testnet. The tokens shown are mock data
                      for demonstration purposes. When we launch on mainnet, you'll be able to purchase
                      and use real $APV tokens!
                    </p>
                  </div>
                </div>
              </div>

              {/* Coming Soon */}
              <div className="space-y-2">
                <h4 className="font-semibold text-bolt-elements-textPrimary">
                  Coming to Mainnet:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
                    <div className="i-ph:credit-card text-purple-500" />
                    <span>Top-up balance</span>
                  </div>
                  <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
                    <div className="i-ph:chart-line text-purple-500" />
                    <span>Transaction history</span>
                  </div>
                  <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
                    <div className="i-ph:percent text-purple-500" />
                    <span>Token discounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
                    <div className="i-ph:trophy text-purple-500" />
                    <span>Staking rewards</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setOpen(false)}
                  className={classNames(
                    'flex-1 px-4 py-2.5 rounded-lg font-medium',
                    'bg-gradient-to-r from-purple-500 to-pink-500',
                    'text-white hover:from-purple-600 hover:to-pink-600',
                    'transition-all shadow-md hover:shadow-lg'
                  )}
                >
                  Got It! Let's Go 🚀
                </button>
                <a
                  href="https://github.com/your-repo/APV_TOKEN_SHOWCASE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classNames(
                    'px-4 py-2.5 rounded-lg font-medium',
                    'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary',
                    'border border-bolt-elements-borderColor',
                    'hover:bg-bolt-elements-background-depth-3',
                    'transition-all'
                  )}
                >
                  Learn More
                </a>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
