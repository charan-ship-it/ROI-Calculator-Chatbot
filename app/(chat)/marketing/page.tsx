import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { createGuestUser, getUserById } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
import { auth } from "../../(auth)/auth";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <MarketingPage />
    </Suspense>
  );
}

async function MarketingPage() {
  // Try to get session, but don't fail if it's not available yet
  const session = await auth().catch(() => {
    // Redirect to guest auth to initialize session
    redirect("/api/auth/guest");
    return null;
  });

  if (!session?.user) {
    redirect("/api/auth/guest");
  }

  // Ensure user exists in database, create guest if not
  // This ensures the user exists when the chat API is called
  const existingUser = await getUserById(session.user.id).catch(() => null);

  if (!existingUser) {
    // User was deleted from DB but session still has old ID
    // Create new guest user
    await createGuestUser().catch(() => {
      // If creation fails, continue anyway - API route will handle it
    });
  }

  // Always create a new chat when opening the site
  // Previous chats can be accessed via the sidebar
  const id = generateUUID();
  console.log(`Creating new chat with ID: ${id}`);

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialBusinessFunction="Marketing"
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialBusinessFunction="Marketing"
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
