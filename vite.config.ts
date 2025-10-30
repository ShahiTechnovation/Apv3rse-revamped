import { vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

// Get git hash with fallback
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'no-git-info';
  }
};




export default defineConfig((config) => {
  return {
    define: {
      __COMMIT_HASH: JSON.stringify(getGitHash()),
      __APP_VERSION: JSON.stringify(process.env.npm_package_version),
      __VERCEL_ENV: JSON.stringify(process.env.VERCEL_ENV || 'development'),
      // 'process.env': JSON.stringify(process.env)
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: config.mode === 'production' ? (id) => {
            // Only apply manual chunking for client build (not SSR)
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('@remix-run/react')) {
                return 'vendor-react';
              }
              if (id.includes('@codemirror')) {
                return 'vendor-codemirror';
              }
              if (id.includes('@ai-sdk') || id.includes('/ai/')) {
                return 'vendor-ai';
              }
              if (id.includes('@aptos-labs')) {
                return 'vendor-aptos';
              }
            }
          } : undefined,
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      sourcemap: config.mode !== 'production',
    },
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    plugins: [
      nodePolyfills({
        include: ['path', 'buffer', 'process'],
      }),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true
        },
        serverBuildFile: 'index.js',
        buildDirectory: 'build',
        serverModuleFormat: 'esm',
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config.mode === 'production' && optimizeCssModules({ apply: 'build' }),
    ],
    envPrefix: ["VITE_","OPENAI_LIKE_API_BASE_URL", "OLLAMA_API_BASE_URL", "LMSTUDIO_API_BASE_URL","TOGETHER_API_BASE_URL"],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
  };
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw) {
          const version = parseInt(raw[2], 10);

          if (version === 129) {
            res.setHeader('content-type', 'text/html');
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development.</p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>',
            );

            return;
          }
        }

        next();
      });
    },
  };
}
