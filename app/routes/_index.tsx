import { json, type MetaFunction } from '@remix-run/node';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import AetherFlowBackgroundAdaptive from '~/components/ui/aether-flow-background-adaptive';
import Footer from '~/components/footer/Footer';

export const meta: MetaFunction = () => {
  return [{ title: 'Apv3rse' }, { name: 'description', content: 'Apv3rse - AI-Powered Development Platform for Aptos Ecosystem' }];
};

export const loader = () => json({});

export default function Index() {
  return (
    <>
      <ClientOnly fallback={null}>
        {() => <AetherFlowBackgroundAdaptive />}
      </ClientOnly>
      <div className="flex flex-col h-full w-full relative z-10">
        <Header />
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      </div>
      <div className="relative z-20">
        <Footer />
      </div>
    </>
  );
}
