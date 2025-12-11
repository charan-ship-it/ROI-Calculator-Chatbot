import { auth } from "@/app/(auth)/auth";
import { AppSidebar } from "@/components/app-sidebar";

export async function AppSidebarWrapper() {
  const session = await auth();
  const user = session?.user;

  return <AppSidebar user={user} />;
}
