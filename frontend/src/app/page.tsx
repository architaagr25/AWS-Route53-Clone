/**
 * Temporary home page. Confirms the app builds and runs.
 * In Step 11 this becomes a redirect into the console (/route53) with auth gating.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Route 53 Management Console</h1>
      <p className="text-sm text-gray-600">Frontend scaffold ready — UI coming next.</p>
    </main>
  );
}
