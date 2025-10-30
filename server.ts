import { createRequestHandler } from '@remix-run/vercel';

export default createRequestHandler({
  // @ts-expect-error - Build will be available at runtime
  build: async () => import('./build/server/index.js'),
  mode: process.env.NODE_ENV,
});
