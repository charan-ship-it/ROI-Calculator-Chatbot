import Script from "next/script";
import { Suspense } from "react";
import { AppSidebarWrapper } from "@/components/app-sidebar-wrapper";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider>
          <Suspense
            fallback={
              <div className="flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar text-sidebar-foreground group-data-[side=left]:border-r-0" />
            }
          >
            <AppSidebarWrapper />
          </Suspense>
          <SidebarInset>
            <Suspense fallback={<div className="flex h-dvh" />}>
              {children}
            </Suspense>
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
