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
      description: 'Search public tenders on tender.bitscorp.co. Use country ES, maxValue 100000, open true, and keywords like software to find small open IT calls. Sources: TED (EU), PLACSP (Spain including regional aggregation and minor contracts), CATALONIA (PSCP open calls and awards), BOAMP (France, including MAPA below €90k), BASE (Portugal notices). Without an API key the desk returns five notices and hides source links.',
      inputSchema: {
        type: 'object',
        properties: {
          keywords: { type: 'string', description: 'Words to match in the notice' },
          country: { type: 'string', description: 'ISO country code, for example ES, FR, or PT' },
          source: { type: 'string', enum: ['TED', 'PLACSP', 'CATALONIA', 'BOAMP', 'BASE'], description: 'Notice source' },
          cpv: { type: 'string', description: 'CPV code or prefix, for example 72000000' },
          minValue: { type: 'number', description: 'Minimum estimated value in EUR' },
          maxValue: { type: 'number', description: 'Maximum estimated value in EUR, for example 100000' },
          noticeKind: { type: 'string', enum: ['call', 'award'], description: 'Open call or award' },
          open: { type: 'boolean', description: 'Only open calls (deadline today or later, or no deadline yet)' },
          buyerType: { type: 'string', description: 'Buyer type label, for example local' },
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
        cpv: args.cpv,
        minValue: args.minValue,
        maxValue: args.maxValue,
        noticeKind: args.noticeKind,
        open: args.open,
        buyerType: args.buyerType,
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
