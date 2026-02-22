# Rursor - Return of Agents

**Rursor** (Read Cursor) is an AI-powered research and document reader. Think Cursor, but for reading: select any text and get instant explanations, summaries, and follow-up answers from intelligent agents.

Built for the **Afore Capital Hackathon**.

---

## Features

- **Dual research search** - Search with [Tavily](https://tavily.com) and [Seda](https://getseda.com) side-by-side
- **Reader** - Save articles, PDFs, and research results to a reading list; edit titles and content
- **Explain panel** - Select text to open an AI chatbot that explains in context, with follow-up Q&A
- **Sophistication slider** - Adjust explanation depth (ELI5 to expert)
- **Cartoon mode** - Generate visual explanations for AI responses via [Gemini](https://ai.google.dev)
- **Voice** - Speech-to-text input and text-to-speech output ([ElevenLabs](https://elevenlabs.io))
- **PDF support** - Upload PDFs; extract and read as Markdown
- **Theme toggle** - Light and dark mode

---

## Tech Stack

- **Next.js 15** (App Router)
- **React 18** + TypeScript
- **APIs**: Tavily (search + extract), Seda (search), MiniMax (chat), ElevenLabs (TTS), Gemini (images)
- **Storage**: `localStorage` (reader items, chat history)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` with:

| Variable | Required | Description |
|----------|----------|-------------|
| `TAVILY_API_KEY` | Yes (for search) | [Tavily](https://tavily.com) API key for web search and page extraction |
| `SEDA_AUTH_TOKEN` | Yes (for Seda search) | [Seda](https://getseda.com) auth token for research search |
| `MINIMAX_API_KEY` | Yes (for explain) | [MiniMax](https://api.minimax.chat) API key for chat/explanations |
| `ELEVENLABS_API_KEY` | No (for TTS) | [ElevenLabs](https://elevenlabs.io) API key for text-to-speech |
| `GEMINI_API_KEY` | No (for cartoons) | [Google AI](https://ai.google.dev) API key for cartoon generation |
| `NUTRIENT_API_KEY` | No | Optional for nutrient extraction |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
├── page.tsx          # Main home: research search, sidebar, reader entry
├── reader/
│   └── page.tsx      # Reader: saved items, explain panel, voice, cartoons
├── api/
│   ├── tavily/       # Search + extract
│   ├── seda/         # Search + chain
│   ├── minimax/      # Chat/explanations
│   ├── elevenlabs/   # TTS
│   ├── gemini/       # Image generation (cartoons)
│   └── nutrient/     # Extract (optional)
lib/
├── reader-storage.ts # Reader items, chat history (localStorage)
└── voice.ts         # Speech recognition + TTS
components/
├── research-results.tsx  # Tavily/Seda results UI
├── voice-waveform.tsx
└── ...
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Next.js with Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

Private - Afore Capital Hackathon.
