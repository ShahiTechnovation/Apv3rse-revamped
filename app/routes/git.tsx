import type { LoaderFunctionArgs } from '@remix-run/node';
import { json, type MetaFunction } from '@remix-run/node';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { GitUrlImport } from '~/components/git/GitUrlImport.client';
import { Header } from '~/components/header/Header';
import AetherFlowBackgroundAdaptive from '~/components/ui/aether-flow-background-adaptive';

export const meta: MetaFunction = () => {
  return [{ title: 'Apv3rse' }, { name: 'description', content: 'Apv3rse - AI-Powered Development Platform for Aptos Ecosystem' }];
};

export async function loader(args: LoaderFunctionArgs) {
  return json({ url: args.params.url });
}

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full relative">
      <ClientOnly fallback={null}>
        {() => <AetherFlowBackgroundAdaptive />}
      </ClientOnly>
      <div className="relative z-10 flex flex-col h-full w-full">
        <Header />
        <ClientOnly fallback={<BaseChat />}>{() => <GitUrlImport />}</ClientOnly>
      </div>
    </div>
  );
}
