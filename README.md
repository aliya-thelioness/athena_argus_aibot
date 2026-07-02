# Athena — EuroSchool Argus assistant

Athena is a dependency-free full-stack demo of a student-aware assistant embedded in the Argus learning ecosystem. It includes a Rohit-specific dashboard, marks, attendance, notices, recent notes, school almanac, conversational responses, and a Meta WhatsApp Cloud API webhook.

## Run locally

1. Install [Node.js 18 or newer](https://nodejs.org/).
2. In this folder, run `npm start`.
3. Open `http://localhost:3000`.

No `npm install` is required because the project uses only Node's built-in modules.

## Enable generative AI

Athena works without an API key using its built-in NLP rules. To enable generative answers, create a `.env` file in this folder:

```env
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Restart the Node server after saving it. The backend detects the question topic and sends only relevant Rohit data to Claude. Never put the API key in HTML, `public/argus.js`, or any browser file.

## WhatsApp Business setup

1. Create a Meta developer app and add the WhatsApp product.
2. Copy `.env.example` to `.env` and fill in the access token, phone-number ID, and a private verify token.
3. Expose the local server over HTTPS (for example with Cloudflare Tunnel or ngrok).
4. In Meta's WhatsApp configuration, set the callback URL to `https://your-domain/webhooks/whatsapp`, enter the same verify token, and subscribe to `messages`.

Without WhatsApp credentials, webhook replies are printed to the backend console as demo messages.

## API

- `GET /api/dashboard` — Rohit's profile, notices, notes and holidays
- `POST /api/chat` with `{ "message": "Show my marks" }` — personalised assistant reply
- `POST /api/notices/:id/read` — mark a notice as read
- `GET/POST /webhooks/whatsapp` — Meta webhook verification and inbound messages

The demo assistant is deterministic and keeps all student data in `data.js`. For production, replace it with authenticated Argus services, a database, per-user access controls, and an approved language-model provider.
