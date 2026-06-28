import TopBar from "@/components/shell/TopBar";
import Sidebar from "@/components/shell/Sidebar";

/**
 * Temporary home page — previews the AWS shell (top bar + sidebar) while it is
 * built. In Step 11 this becomes a redirect into the console with auth gating.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-xl font-semibold text-aws-text">
            Route 53 Management Console
          </h1>
          <p className="mt-2 text-sm text-aws-text-secondary">
            Top bar + sidebar (Step 10c). Full layout and pages coming next.
          </p>
        </main>
      </div>
    </div>
  );
}
