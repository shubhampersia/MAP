import { createFileRoute } from "@tanstack/react-router";
import WorldPresenceMap from "@/components/WorldPresenceMap";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <WorldPresenceMap />
      </div>
    </main>
  );
}
