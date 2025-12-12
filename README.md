# ChatBranch

A chatbot application that supports **branching conversations** - allowing users to create alternate conversation timelines with their own memory, without corrupting the main chat's memory.

Built for the "AI Partner Catalyst: Accelerate Innovation" hackathon (Google Cloud + Datadog Challenge).

## Tech Stack

### Frontend
- **React** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)

### Backend
- **Node.js** + **TypeScript**
- **Express** (HTTP API server)
- **Google Cloud Vertex AI / Gemini** (LLM)

### Future Integrations (Planned)
- **Google Cloud Firestore** (database for conversations, branches, and memory)
- **Datadog** (APM, LLM Observability, logs, metrics, monitors)
- **Google Cloud Run** (deployment target)

## Project Structure

```
chatbranch/
├── frontend/          # React + TypeScript + Vite app
├── backend/           # Node.js + TypeScript + Express API
├── README.md          # This file
├── LICENSE            # MIT License
└── .gitignore         # Git ignore rules
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud account with Vertex AI enabled
- GCP project with Gemini API access

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with your Google Cloud credentials:
   ```env
   GCP_PROJECT_ID=your-gcp-project-id
   GCP_LOCATION=us-central1
   GEMINI_MODEL_NAME=gemini-pro
   PORT=3000
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```

   **Note:** You can use either:
   - Service account key file (`GOOGLE_APPLICATION_CREDENTIALS`)
   - Or API key (`GEMINI_API_KEY`) - if supported by your setup

5. Start the development server:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173` (or the next available port)

## Usage

1. Start both the backend and frontend servers (see above)
2. Open your browser to the frontend URL (typically `http://localhost:5173`)
3. Type a message in the chat input and press Enter (or click Send)
4. The message will be sent to the backend, which calls Gemini, and the AI response will appear in the chat

## Current Features (Phase 1 - MVP)

- ✅ Basic chat interface with message history
- ✅ Integration with Google Cloud Vertex AI / Gemini
- ✅ Responsive UI (desktop and mobile-friendly)
- ✅ Loading states and error handling
- ✅ Auto-scroll to latest message

## Planned Features

### Phase 2: Branching Conversations
- "Branch from here" functionality to create alternate conversation paths
- Branch navigation sidebar
- Independent memory per branch

### Phase 3: Persistence
- Google Cloud Firestore integration
- Conversation and branch persistence
- Message history storage

### Phase 4: Observability
- Datadog APM integration
- LLM observability (token usage, latency, quality metrics)
- Custom dashboards for app health and security signals
- Detection rules for anomalies

## Development

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled server

### Frontend Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

### Backend (`.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `GCP_PROJECT_ID` | Your Google Cloud project ID | Yes |
| `GCP_LOCATION` | GCP region (e.g., `us-central1`) | Yes |
| `GEMINI_MODEL_NAME` | Gemini model name (e.g., `gemini-pro`) | Yes |
| `PORT` | Server port (default: `3000`) | No |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key file | Yes* |
| `GEMINI_API_KEY` | Alternative: API key for Gemini | Yes* |

*Either `GOOGLE_APPLICATION_CREDENTIALS` or `GEMINI_API_KEY` is required.

### Frontend (`.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

This is a hackathon project. Contributions and feedback are welcome!

## TODO / Roadmap

See TODO comments throughout the codebase for:
- Firestore integration points
- Datadog observability integration points
- Branching feature implementation details


