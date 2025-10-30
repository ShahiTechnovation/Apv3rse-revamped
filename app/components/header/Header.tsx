import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { PetraWalletButton } from '~/components/wallet/PetraWalletButton';
import { TokenBalance } from '~/components/wallet/TokenBalance';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center p-5 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/" className="text-2xl font-semibold text-accent flex items-center gap-2">
          <img src="/icons/apverse.svg" alt="Apv3rse Logo" width="40" height="40" className="flex-shrink-0" />
          <span className="hidden sm:inline">Apv3rse</span>
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-3 mr-1">
                <TokenBalance />
                <PetraWalletButton />
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      {!chat.started && (
        <div className="ml-auto">
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-3">
                <TokenBalance />
                <PetraWalletButton />
              </div>
            )}
          </ClientOnly>
        </div>
      )}
    </header>
  );
}
