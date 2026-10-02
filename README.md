# tendermcp-mcp

Open-source MCP server for the [TenderMCP desk](https://tender.bitscorp.co). It searches recent EU TED notices and Spanish PLACSP notices through that site. It does not keep its own copy of the data.

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

- `search_tenders` searches by keywords, country, and source.
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
