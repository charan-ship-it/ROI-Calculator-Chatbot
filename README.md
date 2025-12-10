# ROI Chatbot

A Next.js-based AI chatbot application that integrates with n8n workflows to provide business function-specific responses. Built with the Vercel AI SDK, featuring chat history persistence, user authentication, and support for multiple business functions (Sales, Marketing, Customer Service).

## Features

- **Next.js 16** with App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering
- **AI Integration**
  - Vercel AI SDK for streaming chat responses
  - n8n webhook integration for business logic processing
  - Real-time message streaming with word-by-word display
- **Business Functions**
  - Sales, Marketing, and Customer Service support
  - Function-specific responses via n8n workflows
- **Authentication**
  - NextAuth.js (Auth.js) for secure authentication
  - Support for registered users and guest mode
  - Session management with JWT tokens
- **Data Persistence**
  - PostgreSQL database (via Drizzle ORM)
  - Chat history and message storage
  - User management and chat ownership
- **UI Components**
  - shadcn/ui components with Tailwind CSS
  - Responsive design with mobile support
  - Dark/light theme support
- **Rate Limiting**
  - User-type-based message limits
  - Daily message quotas per user type

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v9.12.3 or compatible)
- PostgreSQL database (Neon, Supabase, or self-hosted)
- n8n instance (for webhook integration)

## Quick Start

1. **Install dependencies:**
   ```bash
   cd ai-chatbot
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   # Database
   POSTGRES_URL=postgresql://user:password@host:port/database
   
   # Authentication
   AUTH_SECRET=your-random-secret-key-here
   
   # n8n Configuration
   N8N_BASE_URL=http://localhost:5678
   N8N_WEBHOOK_ID=0a7ad9c6-bec1-45ff-9c4a-0884f6725583
   ```

3. **Run database migrations:**
   ```bash
   pnpm db:migrate
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

For detailed setup instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md).

## Project Structure

```
ai-chatbot/
├── app/
│   ├── (auth)/          # Authentication routes
│   │   ├── auth.ts      # NextAuth configuration
│   │   ├── actions.ts   # Login/register actions
│   │   └── api/auth/    # Auth API routes
│   └── (chat)/          # Chat routes
│       ├── api/chat/    # Chat API endpoint
│       └── chat/[id]/   # Chat page
├── components/          # React components
│   ├── chat.tsx         # Main chat component
│   ├── business-function-selector.tsx
│   └── ...
├── lib/
│   ├── db/              # Database layer
│   │   ├── schema.ts    # Drizzle schema
│   │   └── queries.ts   # Database queries
│   ├── types.ts         # TypeScript types
│   └── errors.ts        # Error handling
└── proxy.ts             # Route middleware
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Secret key for NextAuth.js | Yes |
| `N8N_BASE_URL` | Base URL of n8n instance | Yes |
| `N8N_WEBHOOK_ID` | n8n webhook identifier | Yes |
| `AI_GATEWAY_API_KEY` | Optional: AI Gateway API key for Vercel deployments | No |

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:generate` - Generate new migration
- `pnpm lint` - Run linter
- `pnpm format` - Format code
- `pnpm test` - Run E2E tests

## n8n Integration

The chatbot integrates with n8n workflows via webhooks. Each business function (Sales, Marketing, Customer Service) has its own webhook endpoint:

```
${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}/${businessFunction}
```

The webhook receives:
```json
{
  "body": {
    "message": "user message text",
    "sessionId": "chat-id",
    "userId": "user-id",
    "functions": ["Sales"]
  }
}
```

And should return:
```json
{
  "success": true,
  "response": "assistant response text"
}
```

## Documentation

- [Getting Started Guide](./GETTING_STARTED.md) - Detailed setup instructions
- [Codebase Overview](./CODEBASE_OVERVIEW.md) - Architecture and implementation details

## Deployment

This application is optimized for Vercel deployments but can be deployed to any platform that supports Next.js:

1. Set up environment variables in your deployment platform
2. Run database migrations: `pnpm db:migrate`
3. Ensure your n8n instance is accessible from the deployment
4. Deploy the application

## License

See [LICENSE](./LICENSE) for details.
