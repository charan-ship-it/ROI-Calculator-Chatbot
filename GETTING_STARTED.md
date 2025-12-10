# Getting Started - Running Locally

This guide will help you set up and run the ROI Chatbot application locally.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **pnpm** (v9.12.3 or compatible) - Install with `npm install -g pnpm@9.12.3`
3. **PostgreSQL Database** - You'll need a PostgreSQL database running. Options:
   - Local PostgreSQL installation
   - [Neon](https://neon.tech) (free tier available)
   - [Supabase](https://supabase.com) (free tier available)
   - Any other PostgreSQL provider
4. **n8n** - Your n8n instance should be running (you mentioned it's already set up)

## Step 1: Install Dependencies

Navigate to the `ai-chatbot` directory and install dependencies:

```bash
cd ai-chatbot
pnpm install
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the `ai-chatbot` directory with the following variables:

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/database_name

# Authentication
AUTH_SECRET=your-random-secret-key-here

# n8n Configuration
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_ID=0a7ad9c6-bec1-45ff-9c4a-0884f6725583
```

### Generating AUTH_SECRET

You can generate a random secret key using one of these methods:

**Option 1: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online generator**
Visit https://generate-secret.vercel.app/32

### Database Connection String Format

Your `POSTGRES_URL` should follow this format:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/roi_chatbot`
- Neon: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`
- Supabase (Recommended - Transaction Pooler): `postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`
- Supabase (Direct - Not recommended): `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`

**Note for Supabase users**: Use the **Transaction Pooler** connection (port 6543) instead of the direct connection. The pooler is more reliable, handles connection limits better, and works better with migrations. You can find your pooler connection string in your Supabase project settings under Database → Connection Pooling.

## Step 3: Set Up the Database

Run the database migrations to create the necessary tables:

```bash
pnpm db:migrate
```

This will:
- Create all required tables (users, chats, messages, etc.)
- Set up the database schema

## Step 4: Verify n8n is Running

Make sure your n8n instance is running and accessible at the URL specified in `N8N_BASE_URL`.

Your n8n webhook should be accessible at:
```
http://localhost:5678/webhook/0a7ad9c6-bec1-45ff-9c4a-0884f6725583/{businessFunction}
```

Where `{businessFunction}` is one of: `Sales`, `Marketing`, or `Customer Service`

## Step 5: Start the Development Server

Run the development server:

```bash
pnpm dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000)

## Step 6: Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. You can either:
   - **Register a new account** - Click "Register" and create an account
   - **Use Guest Mode** - Click "Continue as Guest" to use the app without an account

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify your `POSTGRES_URL` is correct
2. Make sure PostgreSQL is running
3. Check that the database exists
4. Verify network/firewall settings if using a remote database
5. **For Supabase**: If you see `ENOTFOUND` errors with `db.xxx.supabase.co`, switch to the **Transaction Pooler** connection (port 6543) instead of the direct connection. The pooler connection format is: `postgresql://postgres.xxx:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`

### Password Authentication Failed

If you see `password authentication failed for user "postgres"`:

1. **For Supabase**: 
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **Database**
   - Find the **Connection Pooling** section or **Connection String** section
   - Copy the connection string from there (it will have the correct password)
   - Or reset your database password: **Settings** → **Database** → **Reset Database Password**
   - Make sure to URL-encode special characters in your password (e.g., `@` becomes `%40`, `#` becomes `%23`)

2. **For other providers**: Verify your password is correct and properly URL-encoded in the connection string

### n8n Connection Issues

If chat messages aren't working:

1. Verify n8n is running: `curl http://localhost:5678`
2. Check `N8N_BASE_URL` matches your n8n instance URL
3. Verify `N8N_WEBHOOK_ID` matches your webhook ID
4. Test the webhook directly:
   ```bash
   curl -X POST http://localhost:5678/webhook/0a7ad9c6-bec1-45ff-9c4a-0884f6725583/Sales \
     -H "Content-Type: application/json" \
     -d '{"body":{"message":"test","sessionId":"test","userId":"test","functions":["Sales"]}}'
   ```

### Port Already in Use

If port 3000 is already in use:

1. Kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill
   ```

2. Or use a different port:
   ```bash
   PORT=3001 pnpm dev
   ```

### Module Not Found Errors

If you see module not found errors:

1. Delete `node_modules` and `pnpm-lock.yaml`
2. Run `pnpm install` again
3. Clear Next.js cache: `rm -rf .next`

## Additional Commands

- **View database in Drizzle Studio**: `pnpm db:studio`
- **Generate new migration**: `pnpm db:generate`
- **Run linting**: `pnpm lint`
- **Format code**: `pnpm format`
- **Build for production**: `pnpm build`
- **Start production server**: `pnpm start`

## Next Steps

Once everything is running:

1. Test the chat functionality by sending a message
2. Try switching between different business functions (Sales/Marketing/Customer Service)
3. Check that messages are being sent to your n8n webhook correctly
4. Verify responses are coming back from n8n

## Need Help?

- Check the [README.md](./README.md) for more information
- Review the n8n workflow to ensure it's configured correctly
- Check browser console and terminal for error messages

