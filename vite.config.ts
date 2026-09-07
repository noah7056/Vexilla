import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function bakeFlagsPlugin(): Plugin {
  return {
    name: 'bake-flags-api',
    configureServer(server) {
      server.middlewares.use('/api/bake-flags', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer | string) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const {
                customFlags = [],
                permanentlyDeletedIds = [],
                trash = []
              } = payload;

              const dataFilePath = path.resolve(__dirname, 'src/data/customFlagsData.ts');

              // Collect all flags to add/override
              const flagsToSave: any[] = [];
              const seenIds = new Set<string>();

              if (Array.isArray(customFlags)) {
                customFlags.forEach((f: any) => {
                  if (f && f.id && !seenIds.has(f.id)) {
                    flagsToSave.push(f);
                    seenIds.add(f.id);
                  }
                });
              }

              // Collect all deleted flag IDs
              const deletedIdsToSave = new Set<string>();

              if (Array.isArray(permanentlyDeletedIds)) {
                permanentlyDeletedIds.forEach((id: string) => {
                  if (typeof id === 'string' && id.trim()) {
                    deletedIdsToSave.add(id.trim());
                  }
                });
              }

              if (Array.isArray(trash)) {
                trash.forEach((t: any) => {
                  const id = t?.flag?.id;
                  if (typeof id === 'string' && id.trim()) {
                    deletedIdsToSave.add(id.trim());
                  }
                });
              }

              // Filter out any custom flag that was also deleted
              const finalFlags = flagsToSave.filter(f => !deletedIdsToSave.has(f.id));
              const finalDeletedIds = Array.from(deletedIdsToSave);

              const fileContent = `import { Flag } from '../types';

/**
 * Custom and user-edited flags baked directly into the codebase.
 * Any flag here is permanently incorporated into the application's built-in flags.
 */
export const BUILTIN_CUSTOM_FLAGS: Flag[] = ${JSON.stringify(finalFlags, null, 2)};

/**
 * Flag IDs permanently deleted by user, baked directly into the codebase.
 * Any flag ID here is permanently excluded from the application's built-in flags.
 */
export const BUILTIN_DELETED_FLAG_IDS: string[] = ${JSON.stringify(finalDeletedIds, null, 2)};
`;

              fs.writeFileSync(dataFilePath, fileContent, 'utf-8');

              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  customCount: finalFlags.length,
                  deletedCount: finalDeletedIds.length
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Failed to bake flags' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), bakeFlagsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion', 'lucide-react'],
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
