#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const base = (process.env.TENDERMCP_URL || 'https://tender.bitscorp.co').replace(/\/$/, '');
const apiKey = (process.env.TENDERMCP_API_KEY || '').trim();

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value == null || value === '') continue;
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

async function desk(path) {
  const headers = { accept: 'application/json' };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const response = await fetch(`${base}${path}`, { headers });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text.slice(0, 300) };
  }
  if (!response.ok) {
    throw new Error(body.error || `TenderMCP returned ${response.status}`);
  }
  return body;
}

const server = new Server(
  { name: 'tendermcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_tenders',
      description: 'Search recent EU TED and Spanish PLACSP notices on tender.bitscorp.co. Without an API key the desk returns five notices and hides source links.',
      inputSchema: {
        type: 'object',
        properties: {
          keywords: { type: 'string', description: 'Words to match in the notice' },
          country: { type: 'string', description: 'ISO country code, for example ES' },
          source: { type: 'string', enum: ['TED', 'PLACSP'], description: 'Notice source' },
          limit: { type: 'number', description: 'How many notices to return. Free search is capped at 5.' },
          offset: { type: 'number', description: 'Skip this many notices. Requires a Desk pass key.' }
        }
      }
    },
    {
      name: 'get_tender',
      description: 'Fetch one notice by id. Requires a Desk pass key.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Tender id' }
        },
        required: ['id']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments || {};
  try {
    if (request.params.name === 'search_tenders') {
      const result = await desk(`/tenders${query({
        keywords: args.keywords,
        country: args.country,
        source: args.source,
        limit: args.limit,
        offset: args.offset
      })}`);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    if (request.params.name === 'get_tender') {
      const id = String(args.id || '').trim();
      if (!id) throw new Error('id is required');
      const tender = await desk(`/tenders/${encodeURIComponent(id)}`);
      return { content: [{ type: 'text', text: JSON.stringify(tender, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: error instanceof Error ? error.message : 'Request failed' }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
