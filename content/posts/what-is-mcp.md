---
title: "What is MCP? The Model Context Protocol, explained"
description: "MCP lets AI apps plug into tools and data through one shared protocol. Click through a live request and watch the client and server talk."
date: 2026-07-15
tags:
  - explorable
  - llm
  - tools
---

Modern AI assistants are only as useful as what they can reach. **MCP (the Model Context Protocol)** is an open standard that lets an AI app plug into outside tools and data through one shared interface, instead of a bespoke integration for every service.

It is a simple client-server idea. An **MCP client** (Claude, Cursor, VS Code) connects to an **MCP server** that exposes three kinds of thing: **tools** (functions the model can call), **resources** (data it can read), and **prompts** (reusable templates). Click a capability below and watch a request travel across and back.

<div class="explorable" data-explorable="mcp"></div>

## What just happened

Every message is **JSON-RPC 2.0**: a `method` (like `tools/call`), some `params`, and an `id` that ties each response back to its request. The server runs the call and returns a `result`. The model never needs to know *how* the server fetches data, only the shared shape of the conversation.

## Two transports, same messages

The identical messages ride over one of two channels:

- **stdio**: the client launches the server as a local process and talks over standard input and output. Best for local tools on your own machine.
- **Streamable HTTP**: the server runs somewhere remote and speaks over HTTP (this replaced the older HTTP-plus-SSE transport). Best for hosted services many people can share.

Flip the transport toggle above and notice the messages don't change, only where the server lives.

## Why it matters

Before MCP, every AI app wired up every tool by hand. MCP makes tools **portable**: build one server, and any MCP-compatible client can use it. It is the same "standard socket" idea that made USB useful, a shared plug between models and the world's data.

## Connect your AI to this garden

The diagram above is a simulation, but this garden runs a **real MCP server** too. You can plug it into your own AI and ask it directly. It exposes two tools (`search_notes`, `get_note`) and every note as a `note://` resource, over Streamable HTTP:

```
https://explorable-ai.vercel.app/api/mcp
```

**Cursor** (and other clients that speak HTTP), add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "recandle-garden": {
      "url": "https://explorable-ai.vercel.app/api/mcp"
    }
  }
}
```

**Claude Desktop** bridges a remote server through a local command:

```json
{
  "mcpServers": {
    "recandle-garden": {
      "command": "npx",
      "args": ["mcp-remote", "https://explorable-ai.vercel.app/api/mcp"]
    }
  }
}
```

Then ask your assistant to *search the garden for attention* or *read the note on embeddings*, and it will call this server. That is a [[thoughts/rag|retrieval]] idea with a standard plug.
