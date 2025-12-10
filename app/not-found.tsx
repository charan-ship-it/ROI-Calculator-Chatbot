import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          This page could not be found.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    </div>
  );
}

