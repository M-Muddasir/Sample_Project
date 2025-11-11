import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Sample Project API',
      version: '1.0.0',
      description: 'Interactive API docs for the app endpoints.'
    },
    servers: [{ url: '/' }],
    paths: {
      '/api/jobs': {
        get: {
          summary: 'List jobs',
          parameters: [
            { name: 'id', in: 'query', schema: { type: 'string' }, required: false, description: 'Optional job ID to fetch a single record' }
          ],
          responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
        },
        put: {
          summary: 'Update a job',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' }, data: { type: 'object' } }, required: ['id','data'] } } }
          },
          responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
        },
        delete: {
          summary: 'Delete a job',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } }
          },
          responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
        }
      },
      '/api/generate-openapi': {
        post: {
          summary: 'Generate OpenAPI specs from docs URLs',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { urls: { type: 'array', items: { type: 'string' } }, model: { type: 'string' } }, required: ['urls'] } } }
          },
          responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
        }
      },
      '/api/auth/register': {
        post: {
          summary: 'Register user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username','password'] } } }
          },
          responses: { '200': { description: 'OK' }, '409': { description: 'Conflict' } }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username','password'] } } }
          },
          responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } }
        }
      },
      '/api/auth/logout': {
        post: {
          summary: 'Logout user',
          responses: { '200': { description: 'OK' } }
        }
      }
    }
  };
  return NextResponse.json(spec);
}