# Troubleshooting Guide

## Error: "We're having trouble sending your message. Please check your internet connection and try again."

This error occurs when the n8n webhook call fails. Here's how to diagnose and fix it:

### Step 1: Check Vercel Function Logs

1. Go to your Vercel dashboard
2. Navigate to your deployment
3. Click on the **Functions** tab
4. Find `/api/chat` function
5. Click on it to view logs
6. Look for error messages that start with:
   - `Calling n8n webhook:`
   - `n8n response status:`
   - `Failed to call n8n webhook`
   - `Failed to parse n8n response`

### Step 2: Common Issues and Solutions

#### Issue 1: Environment Variables Not Set

**Symptoms:**
- Logs show webhook URL as `http://localhost:5678/...` (default value)
- Or webhook URL is incorrect

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Verify these are set for **Production**, **Preview**, and **Development**:
   - `N8N_BASE_URL` = `https://n8n.srv838270.hstgr.cloud`
   - `N8N_WEBHOOK_ID` = `0a7ad9c6-bec1-45ff-9c4a-0884f6725583`
3. **Redeploy** your application after adding/changing variables

#### Issue 2: n8n Instance Not Accessible

**Symptoms:**
- Logs show: `Failed to call n8n webhook - Error: fetch failed`
- Network timeout errors
- DNS resolution errors

**Solution:**
1. Verify your n8n instance is publicly accessible:
   ```bash
   curl https://n8n.srv838270.hstgr.cloud
   ```
2. Check if your n8n instance has firewall rules blocking Vercel IPs
3. Verify SSL certificate is valid (HTTPS should work)
4. Test the webhook directly:
   ```bash
   curl -X POST https://n8n.srv838270.hstgr.cloud/webhook/0a7ad9c6-bec1-45ff-9c4a-0884f6725583/Sales \
     -H "Content-Type: application/json" \
     -d '{"body":{"message":"test","sessionId":"test","userId":"test","functions":["Sales"]}}'
   ```

#### Issue 3: Wrong HTTP Status Code

**Symptoms:**
- Logs show: `n8n response status: 404` or `500` or other non-200 status
- Error message in response body

**Solution:**
1. Check the webhook URL format in logs:
   - Should be: `https://n8n.srv838270.hstgr.cloud/webhook/0a7ad9c6-bec1-45ff-9c4a-0884f6725583/Sales`
2. Verify in n8n:
   - Webhook path is correct: `:businessFunction`
   - Webhook ID matches: `0a7ad9c6-bec1-45ff-9c4a-0884f6725583`
   - HTTP Method is POST
3. Check n8n workflow execution logs for errors

#### Issue 4: Invalid Response Format

**Symptoms:**
- Logs show: `n8n returned invalid response structure`
- Response doesn't have `success` or `response` fields

**Solution:**
1. Check the `n8n parsed data` in logs
2. Your n8n workflow should return:
   ```javascript
   {
     json: {
       success: true,
       response: "your response text here",
       sessionId: "...",
       userId: "...",
       timestamp: "...",
       metadata: { ... }
     }
   }
   ```
3. Verify your n8n workflow's last node returns this format
4. Check that the AI response is being extracted correctly:
   ```javascript
   const response = aiOutput.output || aiOutput.text || 'I apologize, but I could not generate a response.';
   ```

#### Issue 5: JSON Parse Error

**Symptoms:**
- Logs show: `Failed to parse n8n response as JSON`
- Response text is HTML or plain text instead of JSON

**Solution:**
1. Check the `n8n raw response` in logs
2. If it's HTML, n8n might be returning an error page
3. If it's empty, the workflow might not be returning anything
4. Ensure your n8n workflow's response node is configured correctly

#### Issue 6: CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Network tab shows preflight OPTIONS request failing

**Solution:**
1. n8n webhooks typically don't have CORS issues (server-to-server)
2. If you see CORS errors, check if there's a proxy or middleware interfering
3. Verify the request is going directly to n8n, not through a proxy

### Step 3: Test Locally First

Before deploying to Vercel, test locally:

1. Set up `.env.local`:
   ```env
   N8N_BASE_URL=https://n8n.srv838270.hstgr.cloud
   N8N_WEBHOOK_ID=0a7ad9c6-bec1-45ff-9c4a-0884f6725583
   POSTGRES_URL=your-database-url
   AUTH_SECRET=your-secret
   ```

2. Run locally:
   ```bash
   pnpm dev
   ```

3. Send a test message and check:
   - Terminal logs for detailed error messages
   - Browser console for client-side errors
   - Network tab to see the actual request/response

### Step 4: Verify n8n Workflow

1. **Check Webhook Configuration:**
   - Path: `:businessFunction`
   - HTTP Method: POST
   - Authentication: None (or configured correctly)
   - Respond: Immediately

2. **Check Workflow Execution:**
   - Open your n8n workflow
   - Click "Listen for test event" button
   - Send a test request from your app
   - Check if the workflow executes successfully
   - Verify the output of each node

3. **Check Response Format:**
   - The last node should return the format shown above
   - Use a "Respond to Webhook" node or "Set" node to format the response
   - Test the response format by executing the workflow manually

### Step 5: Check Request Format

The code sends this request to n8n:
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

Verify your n8n workflow expects this format. Check the logs to see the actual request being sent.

### Step 6: Enable Detailed Logging

The code now includes detailed logging. Check Vercel function logs for:
- `Calling n8n webhook: [URL]`
- `Request body: [JSON]`
- `n8n response status: [status]`
- `n8n raw response: [response text]`
- `n8n parsed data: [JSON]`

These logs will help identify exactly where the failure occurs.

## Quick Checklist

- [ ] Environment variables set in Vercel (N8N_BASE_URL, N8N_WEBHOOK_ID)
- [ ] Application redeployed after setting environment variables
- [ ] n8n instance is publicly accessible (test with curl)
- [ ] Webhook URL format is correct
- [ ] n8n workflow is active and listening
- [ ] n8n workflow returns correct response format
- [ ] Tested locally first
- [ ] Checked Vercel function logs for detailed error messages

## Still Having Issues?

If you've checked everything above and still getting errors:

1. **Share the logs:** Copy the relevant log entries from Vercel
2. **Test the webhook directly:** Use curl or Postman to test the n8n webhook
3. **Check n8n workflow:** Verify the workflow executes successfully when triggered manually
4. **Network connectivity:** Ensure Vercel can reach your n8n instance (no firewall blocking)

