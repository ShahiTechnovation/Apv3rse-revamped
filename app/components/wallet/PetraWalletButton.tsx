import React from 'react';
import { useWallet } from '~/lib/contexts/WalletContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { classNames } from '~/utils/classNames';

export const PetraWalletButton: React.FC = () => {
  const { account, isConnected, isConnecting, network, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkBadgeColor = (network: string | null) => {
    if (!network) return 'bg-gray-500';
    if (network.toLowerCase().includes('mainnet')) return 'bg-green-500';
    if (network.toLowerCase().includes('testnet')) return 'bg-yellow-500';
    if (network.toLowerCase().includes('devnet')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getNetworkName = (network: string | null) => {
    if (!network) return 'Unknown';
    if (network.toLowerCase().includes('mainnet')) return 'Mainnet';
    if (network.toLowerCase().includes('testnet')) return 'Testnet';
    if (network.toLowerCase().includes('devnet')) return 'Devnet';
    return network;
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className={classNames(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
          'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white',
          'hover:from-[#764ba2] hover:to-[#f093fb]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'shadow-md hover:shadow-lg'
        )}
      >
        {isConnecting ? (
          <>
            <div className="i-svg-spinners:90-ring-with-bg text-lg animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
            <span>Connect Petra</span>
          </>
        )}
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={classNames(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
            'bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary',
            'hover:bg-bolt-elements-background-depth-3',
            'border border-bolt-elements-borderColor',
            'shadow-sm hover:shadow-md'
          )}
        >
          <div className="flex items-center gap-2">
            <div className={classNames('w-2 h-2 rounded-full', getNetworkBadgeColor(network))} />
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#667eea]"
            >
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
            <span>{formatAddress(account || '')}</span>
            <div className="i-ph:caret-down text-xs" />
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={classNames(
            'min-w-[200px] bg-bolt-elements-background-depth-2 rounded-lg p-2',
            'border border-bolt-elements-borderColor shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
          sideOffset={5}
        >
          <div className="px-2 py-1.5 text-xs text-bolt-elements-textSecondary">
            Connected to Petra
          </div>
          
          <DropdownMenu.Separator className="h-[1px] bg-bolt-elements-borderColor my-1" />
          
          <div className="px-2 py-1.5">
            <div className="text-xs text-bolt-elements-textSecondary">Network</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={classNames('w-2 h-2 rounded-full', getNetworkBadgeColor(network))} />
              <span className="text-sm text-bolt-elements-textPrimary">{getNetworkName(network)}</span>
            </div>
          </div>
          
          <div className="px-2 py-1.5">
            <div className="text-xs text-bolt-elements-textSecondary">Address</div>
            <div className="text-sm text-bolt-elements-textPrimary mt-0.5 font-mono">
              {formatAddress(account || '')}
            </div>
          </div>
          
          <DropdownMenu.Separator className="h-[1px] bg-bolt-elements-borderColor my-1" />
          
          <DropdownMenu.Item
            className={classNames(
              'flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer',
              'text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
              'outline-none'
            )}
            onClick={() => {
              if (account) {
                navigator.clipboard.writeText(account);
              }
            }}
          >
            <div className="i-ph:copy text-base" />
            Copy Address
          </DropdownMenu.Item>
          
          <DropdownMenu.Item
            className={classNames(
              'flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer',
              'text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
              'outline-none'
            )}
            onClick={() => {
              if (account) {
                window.open(`https://explorer.aptoslabs.com/account/${account}?network=${network?.toLowerCase()}`, '_blank');
              }
            }}
          >
            <div className="i-ph:arrow-square-out text-base" />
            View on Explorer
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="h-[1px] bg-bolt-elements-borderColor my-1" />
          
          <DropdownMenu.Item
            className={classNames(
              'flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer',
              'text-red-500 hover:bg-red-500/10',
              'outline-none'
            )}
            onClick={disconnect}
          >
            <div className="i-ph:sign-out text-base" />
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
