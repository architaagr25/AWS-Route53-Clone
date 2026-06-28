"use client";

/**
 * Temporary Hosted Zones page — used here to demo the shell: breadcrumbs, the
 * page header, and the toast system. Step 12 replaces this with the real
 * zones table (search, pagination, create/edit/delete).
 */
import Breadcrumbs from "@/components/shell/Breadcrumbs";
import { useToast } from "@/components/shell/ToastProvider";

export default function HostedZonesPage() {
  const { showToast } = useToast();

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Route 53", href: "/route53/dashboard" },
          { label: "Hosted zones" },
        ]}
      />
      <h1 className="mt-2 text-2xl font-semibold text-aws-text">Hosted zones</h1>
      <p className="mt-1 text-sm text-aws-text-secondary">
        Shell preview (Step 10d). The real table arrives in Step 12.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => showToast("Hosted zone created successfully.", "success")}
          className="rounded bg-aws-success px-3 py-1.5 text-sm font-medium text-white"
        >
          Test success toast
        </button>
        <button
          onClick={() => showToast("Something went wrong.", "error")}
          className="rounded bg-aws-error px-3 py-1.5 text-sm font-medium text-white"
        >
          Test error toast
        </button>
        <button
          onClick={() => showToast("Just so you know…", "info")}
          className="rounded bg-aws-link px-3 py-1.5 text-sm font-medium text-white"
        >
          Test info toast
        </button>
      </div>
    </div>
  );
}
