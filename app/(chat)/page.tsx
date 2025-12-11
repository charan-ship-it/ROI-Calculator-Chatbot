import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getMostRecentChatByUserId, createGuestUser, getUserById } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage searchParams={searchParams} />
    </Suspense>
  );
}

async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const skipRestore = params.new === "true"; // Allow ?new=true to skip restoration

  // Try to get session, but don't fail if it's not available yet
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("Error fetching session in root page:", error);
    // Redirect to guest auth to initialize session
    redirect("/api/auth/guest");
  }

  if (!session || !session.user) {
    redirect("/api/auth/guest");
  }

  // Ensure user exists in database, create guest if not
  let currentUserId = session.user.id;
  let existingUser;
  
  try {
    existingUser = await getUserById(session.user.id);
  } catch (error) {
    console.error("Error fetching user:", error);
    existingUser = null;
  }

  if (!existingUser) {
    // User was deleted from DB but session still has old ID
    // Create new guest user and use it
    try {
      const [newGuestUser] = await createGuestUser();
      currentUserId = newGuestUser.id;
    } catch (error) {
      console.error("Error creating guest user:", error);
      // Fall back to session user ID
    }
  }

  // Check if user has any existing chats (unless skipRestore is true)
  let mostRecentChat = null;
  if (!skipRestore) {
    try {
      mostRecentChat = await getMostRecentChatByUserId({ userId: currentUserId });
    } catch (error) {
      console.error("Error fetching most recent chat:", error);
      // Continue with creating new chat
    }

    // If user has an existing chat, redirect to it instead of creating new one
    if (mostRecentChat) {
      console.log(`Redirecting to most recent chat: ${mostRecentChat.id}`);
      redirect(`/chat/${mostRecentChat.id}`);
    }
  }

  // No existing chats or skip restore - create a new one
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
