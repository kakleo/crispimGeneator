import { buildConfig } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { Users } from './collections/Users';
import { Proposals } from './collections/Proposals';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function getDatabaseConfig() {
  if (process.env.DATABASE_URI) {
    return {
      url: process.env.DATABASE_URI,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    };
  }

  // On Vercel / AWS Lambda serverless functions, the root directory (/var/task) is read-only.
  // The only writable directory for local SQLite files is /tmp.
  if (process.env.VERCEL) {
    return {
      url: 'file:/tmp/payload.db',
    };
  }

  // Local development / server fallback
  return {
    url: 'file:./payload.db',
  };
}

const dbConfig = getDatabaseConfig();

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Proposals],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'nusa-flores-travel-payload-secret-at-least-32-chars',
  db: sqliteAdapter({
    client: {
      url: dbConfig.url,
      ...(dbConfig.authToken ? { authToken: dbConfig.authToken } : {}),
    },
    push: true,
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
