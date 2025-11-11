import type { CollectionConfig } from 'payload';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';

const ApiSpecJobs: CollectionConfig = {
  slug: 'api-spec-jobs',
  labels: { singular: 'Api Spec Job', plural: 'Api Spec Jobs' },
  admin: { useAsTitle: 'url' },
  fields: [
    { name: 'url', type: 'text', required: true },
    { name: 'status', type: 'select', options: [
      { label: 'done', value: 'done' },
      { label: 'error', value: 'error' }
    ], defaultValue: 'done', required: true },
    { name: 'result', type: 'textarea' },
    { name: 'error', type: 'textarea' }
  ]
};

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret',
  serverURL: process.env.PAYLOAD_SERVER_URL || 'http://localhost:3000',
  collections: [
    ApiSpecJobs,
    {
      slug: 'app-users',
      labels: { singular: 'User', plural: 'Users' },
      admin: { useAsTitle: 'username' },
      fields: [
        { name: 'username', type: 'text', required: true },
        { name: 'passwordHash', type: 'text', required: true },
      ],
    } as CollectionConfig,
  ],
  plugins: [],
  endpoints: [],
  globals: [],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || ''
    }
  }),
  typescript: {
    outputFile: process.env.PAYLOAD_TYPES_OUTPUT || 'payload-types.ts'
  },
  admin: { disable: true, user: undefined as any }
});