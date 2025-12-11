import { auth } from "@/app/(auth)/auth";
import {
  createGuestUser,
  getChatById,
  getVotesByChatId,
  getUserById,
  updateChatUserIdById,
  voteMessage,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameter chatId is required."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:vote").toResponse();
  }

  // Ensure user exists in database, create guest if not
  let currentUserId = session.user.id;
  const existingUser = await getUserById(session.user.id);

  if (!existingUser) {
    // User was deleted from DB but session still has old ID
    // Create new guest user and use it
    const [newGuestUser] = await createGuestUser();
    currentUserId = newGuestUser.id;
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  // Check if chat's owner still exists
  const chatOwner = await getUserById(chat.userId);

  if (chat.userId !== currentUserId) {
    // If chat owner exists but is different user, deny access
    if (chatOwner) {
      // Chat belongs to a different existing user, deny access
      return new ChatSDKError("forbidden:vote").toResponse();
    }
    // Chat owner doesn't exist (was deleted), allow access and update chat ownership
    // Update chat to belong to new guest user
    await updateChatUserIdById({ chatId, userId: currentUserId });
  }

  const votes = await getVotesByChatId({ id: chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: "up" | "down" } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new ChatSDKError(
      "bad_request:api",
      "Parameters chatId, messageId, and type are required."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:vote").toResponse();
  }

  // Ensure user exists in database, create guest if not
  let currentUserId = session.user.id;
  const existingUser = await getUserById(session.user.id);

  if (!existingUser) {
    // User was deleted from DB but session still has old ID
    // Create new guest user and use it
    const [newGuestUser] = await createGuestUser();
    currentUserId = newGuestUser.id;
  }

  const chat = await getChatById({ id: chatId });

  if (!chat) {
    return new ChatSDKError("not_found:vote").toResponse();
  }

  // Check if chat's owner still exists
  const chatOwner = await getUserById(chat.userId);

  if (chat.userId !== currentUserId) {
    // If chat owner exists but is different user, deny access
    if (chatOwner) {
      // Chat belongs to a different existing user, deny access
      return new ChatSDKError("forbidden:vote").toResponse();
    }
    // Chat owner doesn't exist (was deleted), allow access and update chat ownership
    // Update chat to belong to new guest user
    await updateChatUserIdById({ chatId, userId: currentUserId });
  }

  await voteMessage({
    chatId,
    messageId,
    type,
  });

  return new Response("Message voted", { status: 200 });
}
