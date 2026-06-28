import TopBar from "@/components/shell/TopBar";
import Sidebar from "@/components/shell/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";
import KeyboardShortcuts from "@/components/shell/KeyboardShortcuts";

/**
 * The console layout: every page under /route53 is wrapped with the AWS top bar,
 * the left sidebar, and a scrollable content area on the AWS page background.
 * AuthGuard ensures only a logged-in user can see any of it.
 */
export default function Route53Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <KeyboardShortcuts />
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-aws-bg p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
