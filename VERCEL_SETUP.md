# Vercel Deployment Setup for n8n Webhook Integration

This guide explains how to configure your Vercel deployment to send chat messages to your n8n webhook.

## Current Webhook Configuration

Based on your n8n setup, your webhook URL format is:
```
https://n8n.srv838270.hstgr.cloud/webhook/0a7ad9c6-bec1-45ff-9c4a-0884f6725583/{businessFunction}
```

Where `{businessFunction}` is one of: `Sales`, `Marketing`, or `Customer Service`

## How It Works

When a user sends a chat message:

1. The message is validated and authenticated
2. The system constructs the webhook URL using:
   - `N8N_BASE_URL` environment variable
   - `N8N_WEBHOOK_ID` environment variable  
   - The selected business function (Sales/Marketing/Customer Service)

3. The webhook URL is constructed as:
   ```
   ${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}/${businessFunction}
   ```

4. A POST request is sent to n8n with this payload:
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

5. The system expects a response from n8n (supports both formats):
   
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
   
   The code automatically handles both formats.

## Setting Up Environment Variables in Vercel

### Step 1: Access Vercel Project Settings

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your ROI Chatbot project
3. Click on **Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add the following environment variables for **Production**, **Preview**, and **Development** environments:

#### Required Variables:

1. **N8N_BASE_URL**
   - **Value**: `https://n8n.srv838270.hstgr.cloud`
   - **Description**: Base URL of your n8n instance

2. **N8N_WEBHOOK_ID**
   - **Value**: `0a7ad9c6-bec1-45ff-9c4a-0884f6725583`
   - **Description**: Your n8n webhook identifier

3. **POSTGRES_URL**
   - **Value**: Your PostgreSQL connection string
   - **Description**: Database connection for storing chats and messages

4. **AUTH_SECRET**
   - **Value**: A random secret key (generate with `openssl rand -base64 32`)
   - **Description**: Secret key for NextAuth.js authentication

### Step 3: Deploy or Redeploy

After adding the environment variables:

1. If you haven't deployed yet, push your code to trigger a deployment
2. If already deployed, go to **Deployments** tab and click **Redeploy** on the latest deployment
3. Make sure to select **Use existing Build Cache** if you want faster redeploy

## Verifying the Configuration

### Test the Webhook Connection

You can test if the webhook is accessible from Vercel by:

1. **Using Vercel Functions Logs:**
   - Go to your deployment in Vercel
   - Click on **Functions** tab
   - Look for `/api/chat` function logs
   - Send a test message and check for any errors

2. **Check n8n Webhook Logs:**
   - In your n8n workflow, check if requests are being received
   - The webhook should show incoming requests when chats are sent

### Expected Behavior

When everything is configured correctly:

- ✅ Chat messages are sent to: `https://n8n.srv838270.hstgr.cloud/webhook/0a7ad9c6-bec1-45ff-9c4a-0884f6725583/Sales` (or Marketing/Customer Service)
- ✅ n8n receives the request with the message, sessionId, userId, and functions array
- ✅ n8n returns a response with `success: true` and `response: "..."` 
- ✅ The chatbot displays the streaming response to the user

## Troubleshooting

### Issue: "offline:chat" Error

If you see this error, it means the webhook call failed. Check:

1. **Environment Variables:**
   - Verify `N8N_BASE_URL` is set correctly (should be `https://n8n.srv838270.hstgr.cloud`)
   - Verify `N8N_WEBHOOK_ID` matches your webhook ID

2. **Network Access:**
   - Ensure your n8n instance is publicly accessible
   - Check if there are any firewall rules blocking Vercel's IPs
   - Verify SSL certificate is valid for your n8n domain

3. **Webhook URL Format:**
   - The code constructs: `${N8N_BASE_URL}/webhook/${N8N_WEBHOOK_ID}/${businessFunction}`
   - Make sure this matches your n8n webhook configuration

4. **n8n Response Format:**
   - Ensure your n8n workflow returns:
     ```json
     {
       "success": true,
       "response": "your response text here"
     }
     ```

### Issue: CORS Errors

If you see CORS errors, ensure your n8n instance allows requests from Vercel domains.

### Issue: Timeout Errors

If requests timeout:
- Check your n8n workflow execution time
- The API route has `maxDuration = 60` seconds
- Optimize your n8n workflow if it takes longer

## Testing Locally Before Deploying

Before deploying to Vercel, test locally:

1. Set up `.env.local` with:
   ```env
   N8N_BASE_URL=https://n8n.srv838270.hstgr.cloud
   N8N_WEBHOOK_ID=0a7ad9c6-bec1-45ff-9c4a-0884f6725583
   ```

2. Run `pnpm dev` and test sending a message

3. Check that it reaches your n8n webhook

## Production vs Test Webhook

The code currently uses `/webhook/` (production webhook) in the URL. This is the active production endpoint that your n8n workflow is configured to use.

If you ever need to switch to the test webhook (`/webhook-test/`) for testing:

1. Modify the code in `app/(chat)/api/chat/route.ts` line 133
2. Change from `/webhook/` to `/webhook-test/`
3. Or add an environment variable to toggle between test and production

## Additional Notes

- The webhook ID (`0a7ad9c6-bec1-45ff-9c4a-0884f6725583`) matches what's shown in your n8n interface
- The business function is dynamically inserted into the URL path
- All requests are POST with JSON body
- The system handles errors gracefully and shows "offline:chat" if the webhook is unavailable

