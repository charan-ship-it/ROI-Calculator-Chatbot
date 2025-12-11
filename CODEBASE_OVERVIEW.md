# ROI Chatbot - Codebase Overview

## Project Summary

The ROI Chatbot is a Next.js-based AI chatbot application that integrates with n8n workflows to provide business function-specific responses. It's built using the Vercel AI SDK and supports multiple business functions (Sales, Marketing, Customer Service) with chat history persistence.

---

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **UI**: React with shadcn/ui components and Tailwind CSS
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: NextAuth.js (Auth.js)
- **AI Integration**: Vercel AI SDK
- **External Integration**: n8n webhooks for business logic
- **State Management**: SWR for data fetching, React hooks for local state

---

## Core Components & Functions

### 1. Authentication System (`app/(auth)/`)

**Location**: `app/(auth)/auth.ts`, `app/(auth)/actions.ts`

**Functions**:
- **User Types**: Supports two user types:
  - `regular`: Registered users with email/password
  - `guest`: Temporary users for quick access
- **Authentication Methods**:
  - Credentials-based login (email/password)
  - Guest mode (automatic user creation)
- **Session Management**: Uses NextAuth.js with JWT tokens
- **Route Protection**: Middleware in `proxy.ts` protects routes and redirects unauthenticated users

**Key Functions**:
- `auth()`: Get current session
- `signIn()`: Authenticate user
- `signOut()`: End user session
- `createGuestUser()`: Create temporary guest account

---

### 2. Chat API (`app/(chat)/api/chat/route.ts`)

**Main Endpoints**:

#### POST `/api/chat`
Handles chat message processing and streaming responses.

**Flow**:
1. **Request Validation**: Validates request body using Zod schema
2. **Authentication Check**: Verifies user session
3. **Rate Limiting**: Checks message count per day based on user type
4. **Chat Management**:
   - Creates new chat if doesn't exist (with auto-generated title)
   - Validates chat ownership
5. **Message Persistence**: Saves user message to database
6. **n8n Integration**:
   - Constructs webhook URL: `${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}/${businessFunction}`
   - Sends request with: `message`, `sessionId`, `userId`, `functions`
   - Receives response from n8n
7. **Streaming Response**: 
   - Creates UI message stream
   - Simulates word-by-word streaming (30ms delay between words)
   - Saves assistant response to database on completion

**Request Schema** (`schema.ts`):
```typescript
{
  id: string (UUID),
  message: {
    id: string (UUID),
    role: "user",
    parts: Array<{type: "text" | "file", ...}>
  },
  selectedChatModel: "chat-model" | "chat-model-reasoning",
  selectedVisibilityType: "public" | "private",
  businessFunction: "Sales" | "Marketing" | "Customer Service" (optional, default: "Sales")
}
```

#### DELETE `/api/chat?id={chatId}`
Deletes a chat conversation (with ownership validation).

---

### 3. Chat UI Component (`components/chat.tsx`)

**Main Features**:
- **Message Management**: Uses `useChat` hook from AI SDK
- **Business Function Selector**: Allows switching between Sales/Marketing/Customer Service
- **Visibility Control**: Public/Private chat visibility
- **Streaming Support**: Real-time message streaming
- **Error Handling**: Displays errors and credit card alerts
- **Auto-resume**: Can resume interrupted streams
- **Query Parameter Support**: Can auto-send message from URL query param

**State Management**:
- `messages`: Chat message history
- `input`: Current input text
- `status`: Loading/idle/error states
- `businessFunction`: Selected business function
- `attachments`: File attachments

**Key Functions**:
- `sendMessage()`: Send new message
- `regenerate()`: Regenerate last response
- `stop()`: Stop current generation
- `resumeStream()`: Resume interrupted stream

---

### 4. Database Schema (`lib/db/schema.ts`)

**Tables**:

1. **User**
   - `id`: UUID (primary key)
   - `email`: varchar(64)
   - `password`: varchar(64) (nullable for guests)

2. **Chat**
   - `id`: UUID (primary key)
   - `userId`: UUID (foreign key to User)
   - `title`: text
   - `createdAt`: timestamp
   - `visibility`: "public" | "private"
   - `lastContext`: JSONB (usage data)

3. **Message_v2** (Current)
   - `id`: UUID (primary key)
   - `chatId`: UUID (foreign key to Chat)
   - `role`: varchar (user/assistant)
   - `parts`: JSON (message parts array)
   - `attachments`: JSON (attachments array)
   - `createdAt`: timestamp

4. **Vote_v2**
   - `chatId`: UUID (composite key)
   - `messageId`: UUID (composite key)
   - `isUpvoted`: boolean

5. **Document** (for artifacts)
   - `id`: UUID + `createdAt` (composite key)
   - `title`: text
   - `content`: text
   - `kind`: "text" | "code" | "image" | "sheet"
   - `userId`: UUID

6. **Stream**
   - `id`: UUID
   - `chatId`: UUID
   - `createdAt`: timestamp

---

### 5. Database Queries (`lib/db/queries.ts`)

**Key Functions**:
- `getUser(email)`: Get user by email
- `createGuestUser()`: Create guest user
- `getChatById({id})`: Retrieve chat by ID
- `saveChat({id, userId, title, visibility})`: Create/update chat
- `saveMessages({messages})`: Save messages to database
- `getMessagesByChatId({id})`: Get all messages for a chat
- `getMessageCountByUserId({id, differenceInHours})`: Count messages for rate limiting
- `deleteChatById({id})`: Delete chat
- `voteMessage({chatId, messageId, type})`: Vote on messages

---

### 6. Business Function Integration

**Component**: `components/business-function-selector.tsx`

**Functions**:
- **Sales**: Sales-related queries and assistance
- **Marketing**: Marketing campaigns and strategies
- **Customer Service**: Customer support and inquiries

**Integration**:
- Selected function is passed to n8n webhook as part of the URL path
- Format: `/webhook/{webhookId}/{businessFunction}`
- Included in request body as `functions: [businessFunction]`

---

### 7. n8n Integration

**Configuration** (Environment Variables):
- `N8N_BASE_URL`: Base URL of n8n instance (default: `http://localhost:5678`)
- `N8N_WEBHOOK_ID`: Webhook identifier (default: `0a7ad9c6-bec1-45ff-9c4a-0884f6725583`)

**Webhook URL Format**:
```
${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}/${businessFunction}
```

**Request Payload**:
```json
{
  "body": {
    "message": "user message text",
    "sessionId": "chat-id",
    "userId": "user-id",
    "functions": ["Sales"] // or "Marketing" or "Customer Service"
  }
}
```

**Expected Response** (supports both formats):

**Format 1 - Wrapped in `json` property (n8n default):**
```json
{
  "json": {
    "success": true,
    "response": "assistant response text",
    "sessionId": "chat-id",
    "userId": "user-id",
    "timestamp": "2025-01-10T17:58:00.000Z",
    "metadata": {
      "model": "gpt-4o-mini",
      "provider": "OpenAI"
    }
  }
}
```

**Format 2 - Direct format:**
```json
{
  "success": true,
  "response": "assistant response text"
}
```

The code automatically handles both response formats.

**Error Handling**:
- Network errors return `offline:chat` error
- Non-200 responses return `offline:chat` error
- Missing `success` or `response` fields return `offline:chat` error

---

### 8. Rate Limiting (`lib/ai/entitlements.ts`)

**User Type Limits**:
- Based on `entitlementsByUserType` configuration
- Checks `maxMessagesPerDay` per user type
- Calculates messages in last 24 hours
- Returns `rate_limit:chat` error if exceeded

---

### 9. Message Streaming

**Implementation** (`route.ts` lines 176-217):
- Uses `createUIMessageStream` from AI SDK
- Simulates streaming by splitting response into words
- 30ms delay between words for smooth effect
- Streams `text-delta` events
- Saves complete message on `onFinish` callback

**Stream Format**:
- Server-Sent Events (SSE) via `JsonToSseTransformStream`
- Events include message deltas and metadata

---

### 10. Error Handling (`lib/errors.ts`)

**Error Types**:
- `bad_request:api`: Invalid request format
- `unauthorized:chat`: User not authenticated
- `forbidden:chat`: User doesn't own the chat
- `rate_limit:chat`: Message limit exceeded
- `offline:chat`: n8n service unavailable
- `bad_request:database`: Database operation failed

**Error Response Format**:
- Standardized error responses with appropriate HTTP status codes
- User-friendly error messages

---

### 11. Route Protection (`proxy.ts`)

**Middleware Function**:
- Checks authentication for protected routes
- Redirects unauthenticated users to guest login
- Prevents authenticated users from accessing login/register pages
- Handles `/ping` endpoint for health checks

**Protected Routes**:
- `/` (home)
- `/chat/:id` (chat pages)
- `/api/*` (API routes, except auth)
- `/login`, `/register` (redirects if authenticated)

---

### 12. Chat History (`components/sidebar-history.tsx`)

**Features**:
- Displays list of user's chats
- Pagination support via SWR infinite
- Shows chat titles and timestamps
- Click to navigate to chat

---

### 13. Auto-Scroll Behavior (`hooks/use-scroll-to-bottom.tsx`, `hooks/use-messages.tsx`)

**Overview**:
The chat interface implements intelligent auto-scroll behavior that automatically follows AI responses while preserving user control.

**Components**:

1. **`useScrollToBottom` Hook** (`hooks/use-scroll-to-bottom.tsx`)
   - Core scroll management logic
   - Tracks user scroll position and intent
   - Manages auto-scroll during AI activity

2. **`useMessages` Hook** (`hooks/use-messages.tsx`)
   - Integrates scroll behavior with chat status
   - Connects AI streaming state to auto-scroll

**Behavior Rules**:

**Auto-Scroll Triggers**:
- Auto-scroll is **ENABLED** when:
  1. AI is actively responding (`status === "streaming"`)
  2. AI is thinking/processing (`status === "submitted"`)
  3. User is at the bottom of the scroll container (within 30px)
  4. User has NOT manually scrolled recently

**User Control**:
- Auto-scroll is **DISABLED** when:
  1. User manually scrolls up or down
  2. User uses mouse wheel or trackpad
  3. User touches/swipes on mobile
  4. AI finishes responding (`status !== "streaming" && status !== "submitted"`)

**Implementation Details**:

**Scroll Detection**:
```typescript
// User scroll is detected via:
- 'scroll' event: Updates isAtBottom state
- 'wheel' event: Immediate user interaction detection (2s cooldown)
- 'touchstart'/'touchmove': Mobile gesture detection (2s cooldown)

// User scroll flag persists for:
- 1 second after scroll event
- 2 seconds after wheel/touch events
```

**Auto-Scroll Logic**:
```typescript
// Auto-scroll only when ALL conditions are met:
isStreamingRef.current === true  // AI is active
&& isAtBottomRef.current === true  // User at bottom
&& !isUserScrollingRef.current  // User hasn't scrolled
&& endElement  // DOM element exists

// Streaming status is set to true when:
status === "streaming" || status === "submitted"
```

**Performance Optimizations**:
1. **Debouncing**: 100ms debounce on scroll operations
2. **RAF Batching**: Uses `requestAnimationFrame` for smooth scrolling
3. **Observer Pattern**:
   - `MutationObserver`: Watches for DOM changes (new messages, content updates)
   - `ResizeObserver`: Watches for container/element size changes
4. **Instant Scrolling**: Uses `behavior: "instant"` during streaming for immediate feedback
5. **Smooth Scrolling**: Manual scroll-to-bottom button uses `behavior: "smooth"`

**Scroll Button**:
- Appears when user scrolls up from bottom
- Click to manually scroll to bottom with smooth animation
- Automatically hides when at bottom

**Edge Cases Handled**:
1. **Rapid Message Updates**: Debouncing prevents scroll jitter
2. **Long Responses**: Continuous scrolling during streaming
3. **User Interrupt**: Immediate stop of auto-scroll on user action
4. **Mobile Touch**: Touch events disable auto-scroll for 2 seconds
5. **Browser Navigation**: Preserves scroll position on forward/back

**Key State Variables**:
```typescript
isAtBottom: boolean  // Current scroll position
isAtBottomRef: React.MutableRefObject<boolean>  // Ref for immediate access
isUserScrollingRef: React.MutableRefObject<boolean>  // User activity flag
isStreamingRef: React.MutableRefObject<boolean>  // AI streaming status
```

**Usage in Components**:
```typescript
// In Messages component:
const { containerRef, endRef, isAtBottom, scrollToBottom } = useMessages({ status });

// containerRef: Attach to scrollable container
// endRef: Attach to end-of-messages element
// isAtBottom: Show/hide scroll button
// scrollToBottom: Manual scroll function
```

---

## Data Flow

### Sending a Message:

1. **User Input** → `Chat` component
2. **Validation** → `MultimodalInput` component
3. **API Call** → `POST /api/chat`
4. **Authentication** → Verify session
5. **Rate Limit Check** → Validate message count
6. **Save User Message** → Database
7. **n8n Webhook Call** → External service
8. **Receive Response** → From n8n
9. **Stream Response** → Client via SSE
10. **Auto-Scroll Triggered** → Messages component scrolls to bottom (if user at bottom)
11. **Save Assistant Message** → Database on completion
12. **Update UI** → Display messages

### Loading a Chat:

1. **Navigate** → `/chat/[id]`
2. **Server Component** → Fetch chat and messages
3. **Database Query** → `getChatById`, `getMessagesByChatId`
4. **Render** → `Chat` component with initial data
5. **Hydration** → Client-side state management

---

## Environment Variables

Required environment variables (`.env.local`):

```env
# Database
POSTGRES_URL=postgresql://user:password@host:port/database

# Authentication
AUTH_SECRET=random-secret-key

# n8n Integration
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_ID=0a7ad9c6-bec1-45ff-9c4a-0884f6725583

# Optional: AI Gateway (for Vercel deployments)
AI_GATEWAY_API_KEY=your-api-key
```

---

## Key Design Patterns

1. **Server Components**: Next.js App Router with server/client component separation
2. **Streaming**: Real-time response streaming via SSE
3. **Type Safety**: Full TypeScript with Zod validation
4. **Error Boundaries**: Centralized error handling
5. **Rate Limiting**: User-type-based message limits
6. **Multi-tenancy**: User isolation via ownership checks
7. **Guest Mode**: Temporary user accounts for quick access

---

## File Structure Summary

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

---

## Testing

- **E2E Tests**: Playwright tests in `tests/e2e/`
- **Test Routes**: `/ping` endpoint for health checks
- **Fixtures**: Test data and helpers in `tests/`

---

## Deployment Considerations

1. **Database**: Requires PostgreSQL (Neon, Supabase, or self-hosted)
2. **n8n**: External n8n instance must be accessible
3. **Environment Variables**: Must be configured in deployment platform
4. **Vercel**: Optimized for Vercel deployments with AI Gateway support
5. **Migrations**: Run `pnpm db:migrate` before deployment

---

## Future Enhancements (Potential)

- Direct LLM integration (currently uses n8n)
- File upload support (schema supports it)
- Artifact generation (code, images, sheets)
- Message voting system (schema exists)
- Public chat sharing (visibility field exists)
- Multi-model support (selectedChatModel in schema)

