# Resume Match AI

Single-page React app to upload a resume and job description, choose an LLM provider/model, and send both PDFs to the analyzer API.

## Setup

```bash
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## API

The app posts `FormData` to:

```text
POST {VITE_API_BASE_URL}/api/analyze
```

Fields:

- `resume` PDF, max 3 MB
- `jobDescription` PDF, max 3 MB
- `provider`
- `model`
- `apiKey`

## Checks

```bash
npm run lint
npm run build
```
