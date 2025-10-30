import React, { useState } from 'react';
import { useWallet } from '~/lib/contexts/WalletContext';
import * as Dialog from '@radix-ui/react-dialog';
import { classNames } from '~/utils/classNames';

interface WalletOption {
  name: string;
  icon: React.ReactNode;
  downloadUrl: string;
  description: string;
}

const walletOptions: WalletOption[] = [
  {
    name: 'Petra',
    downloadUrl: 'https://petra.app/',
    description: 'Most popular Aptos wallet',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M17.7 7.7C19.2 9.2 20 11.1 20 13.2C20 17.6 16.4 21.2 12 21.2C7.6 21.2 4 17.6 4 13.2C4 11.1 4.8 9.2 6.3 7.7L12 2L17.7 7.7Z"
          fill="#667eea"
          opacity="0.9"
        />
        <path d="M12 2L6.3 7.7C4.8 9.2 4 11.1 4 13.2C4 17.6 7.6 21.2 12 21.2V2Z" fill="#764ba2" />
      </svg>
    ),
  },
  {
    name: 'Martian',
    downloadUrl: 'https://martianwallet.xyz/',
    description: 'Feature-rich Aptos wallet',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF5F5F" />
        <path d="M12 7L15 13L12 11L9 13L12 7Z" fill="white" />
        <path d="M12 17L15 11L12 13L9 11L12 17Z" fill="white" opacity="0.7" />
      </svg>
    ),
  },
  {
    name: 'Pontem',
    downloadUrl: 'https://pontem.network/',
    description: 'Wallet with DeFi integration',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="8" fill="#00D4AA" />
        <path d="M8 12L11 9L14 12L11 15L8 12Z" fill="white" />
        <path d="M14 12L17 9L14 6L11 9L14 12Z" fill="white" opacity="0.7" />
      </svg>
    ),
  },
  {
    name: 'MSafe',
    downloadUrl: 'https://msafe.io/',
    description: 'Multisig wallet solution',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="#4F46E5" />
        <path
          d="M12 8L15 11L12 14L9 11L12 8Z"
          fill="white"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="10" y="14" width="4" height="3" fill="white" />
      </svg>
    ),
  },
];

export const MultiWalletSelector: React.FC = () => {
  const { connect, availableWallets } = useWallet();
  const [open, setOpen] = useState(false);

  const handleConnect = async (walletName: string) => {
    const wallet = availableWallets.find((w) => w.name === walletName);
    
    if (!wallet?.installed) {
      const option = walletOptions.find((w) => w.name === walletName);
      if (option) {
        window.open(option.downloadUrl, '_blank');
      }
      return;
    }

    await connect(walletName);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={classNames(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white',
            'hover:from-[#764ba2] hover:to-[#f093fb]',
            'shadow-md hover:shadow-lg'
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.7 7.7C19.2 9.2 20 11.1 20 13.2C20 17.6 16.4 21.2 12 21.2C7.6 21.2 4 17.6 4 13.2C4 11.1 4.8 9.2 6.3 7.7L12 2L17.7 7.7Z"
              fill="currentColor"
              opacity="0.9"
            />
            <path
              d="M12 2L6.3 7.7C4.8 9.2 4 11.1 4 13.2C4 17.6 7.6 21.2 12 21.2V2Z"
              fill="currentColor"
            />
          </svg>
          <span>Connect Wallet</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content
          className={classNames(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md p-6 rounded-xl',
            'bg-bolt-elements-background-depth-2',
            'border border-bolt-elements-borderColor',
            'shadow-2xl animate-in fade-in zoom-in-95'
          )}
        >
          <Dialog.Title className="text-xl font-bold text-bolt-elements-textPrimary mb-2">
            Connect Wallet
          </Dialog.Title>
          <Dialog.Description className="text-sm text-bolt-elements-textSecondary mb-6">
            Choose your preferred Aptos wallet to connect
          </Dialog.Description>

          <div className="space-y-3">
            {walletOptions.map((wallet) => {
              const isInstalled = availableWallets.find((w) => w.name === wallet.name)?.installed;

              return (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  className={classNames(
                    'w-full flex items-center gap-4 p-4 rounded-lg transition-all',
                    'bg-bolt-elements-background-depth-3',
                    'hover:bg-bolt-elements-background-depth-4',
                    'border border-bolt-elements-borderColor',
                    'hover:border-[#667eea] hover:shadow-md'
                  )}
                >
                  <div className="flex-shrink-0">{wallet.icon}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-bolt-elements-textPrimary">{wallet.name}</span>
                      {isInstalled ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                          Installed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
                          Not Installed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-bolt-elements-textSecondary mt-0.5">{wallet.description}</p>
                  </div>
                  {isInstalled ? (
                    <div className="i-ph:arrow-right text-xl text-bolt-elements-textSecondary" />
                  ) : (
                    <div className="i-ph:download-simple text-xl text-bolt-elements-textSecondary" />
                  )}
                </button>
              );
            })}
          </div>

          <Dialog.Close asChild>
            <button
              className={classNames(
                'absolute top-4 right-4 p-2 rounded-lg',
                'text-bolt-elements-textSecondary',
                'hover:bg-bolt-elements-background-depth-3',
                'transition-colors'
              )}
              aria-label="Close"
            >
              <div className="i-ph:x text-xl" />
            </button>
          </Dialog.Close>

          <div className="mt-6 pt-4 border-t border-bolt-elements-borderColor">
            <p className="text-xs text-bolt-elements-textSecondary text-center">
              New to Aptos?{' '}
              <a
                href="https://aptos.dev/guides/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#667eea] hover:underline"
              >
                Learn more
              </a>
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
