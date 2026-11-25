# tendermcp-mcp

Open-source MCP server for the [TenderMCP desk](https://tender.bitscorp.co). It searches TED, Spanish PLACSP (including regional aggregation), Catalonia PSCP, French BOAMP, and Portuguese BASE notices through that site. It does not keep its own copy of the data.

## Connect Claude or Cursor

```json
{
  "mcpServers": {
    "tendermcp": {
      "command": "npx",
      "args": ["-y", "github:oivoodoo/tendermcp-mcp"],
      "env": {
        "TENDERMCP_URL": "https://tender.bitscorp.co",
        "TENDERMCP_API_KEY": "tm_your_key"
      }
    }
  }
}
```

Leave `TENDERMCP_API_KEY` empty for the free desk: five notices, without source links. A Desk pass on https://tender.bitscorp.co issues the key that opens every notice.

## Tools

- `search_tenders` searches by keywords, country, source (`TED`, `PLACSP`, `CATALONIA`, `BOAMP`, `BASE`), CPV, min/max value, open-call filter, and notice kind. Example: software in Spain, still open, under €100k.
- `get_tender` loads one notice by id. The desk requires a pass for that call.

## Run it yourself

```bash
git clone https://github.com/oivoodoo/tendermcp-mcp.git
cd tendermcp-mcp
npm install
TENDERMCP_URL=https://tender.bitscorp.co node index.js
```

The process speaks MCP on stdin and stdout.

MIT licensed.
