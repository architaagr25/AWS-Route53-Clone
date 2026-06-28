import Link from "next/link";

/** Custom 404 page, styled to match the console rather than the bare default. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-aws-bg p-8 text-center">
      <div className="select-none rounded-xl bg-aws-squid px-4 py-2 text-3xl font-bold text-aws-orange">
        53
      </div>
      <h1 className="text-3xl font-semibold text-aws-text">404 — Page not found</h1>
      <p className="max-w-md text-sm text-aws-text-secondary">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <Link
        href="/route53/hosted-zones"
        className="rounded bg-aws-orange px-4 py-2 text-sm font-semibold text-aws-squid hover:bg-aws-orange-dark"
      >
        Go to Hosted zones
      </Link>
    </div>
  );
}
