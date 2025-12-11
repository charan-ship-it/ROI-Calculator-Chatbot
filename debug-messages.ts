// Debug script to check messages in database
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { message } from "./lib/db/schema";

// Get chat ID from command line argument
const chatId = process.argv[2];

if (!chatId) {
  console.error("Usage: tsx debug-messages.ts <chat-id>");
  process.exit(1);
}

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function checkMessages() {
  console.log(`\n=== Checking messages for chat: ${chatId} ===\n`);
  
  const messages = await db
    .select()
    .from(message)
    .where((t) => t.chatId === chatId)
    .orderBy((t) => t.createdAt);

  console.log(`Found ${messages.length} messages:\n`);
  
  messages.forEach((msg, idx) => {
    console.log(`Message ${idx + 1}:`);
    console.log(`  ID: ${msg.id}`);
    console.log(`  Role: ${msg.role}`);
    console.log(`  Created: ${msg.createdAt}`);
    console.log(`  Parts:`, JSON.stringify(msg.parts, null, 2));
    console.log(`  Attachments:`, JSON.stringify(msg.attachments, null, 2));
    console.log('---');
  });

  await client.end();
}

checkMessages().catch(console.error);
