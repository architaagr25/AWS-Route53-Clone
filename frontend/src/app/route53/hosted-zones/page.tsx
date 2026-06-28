"use client";

/**
 * Hosted Zones list page — the AWS-style table of hosted zones with server-side
 * search and pagination. Create/edit/delete are wired in 12c.
 */
import Link from "next/link";
import { useEffect, useState } from "react";

import Breadcrumbs from "@/components/shell/Breadcrumbs";
import { useToast } from "@/components/shell/ToastProvider";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Spinner from "@/components/ui/Spinner";
import { ApiError, zones } from "@/lib/api";
import type { ZoneList } from "@/lib/types";

const PAGE_SIZE = 10;

export default function HostedZonesPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ZoneList | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch zones whenever the search term or page changes (search is debounced).
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      zones
        .list({ search, page, page_size: PAGE_SIZE })
        .then(setData)
        .catch((err) =>
          showToast(err instanceof ApiError ? err.message : "Failed to load zones", "error")
        )
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, page, showToast]);

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1); // new search → back to the first page
  }

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((z) => selected.has(z.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((z) => z.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Route 53", href: "/route53/dashboard" },
          { label: "Hosted zones" },
        ]}
      />

      <div className="mt-2 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-aws-text">
          Hosted zones{" "}
          <span className="text-base font-normal text-aws-text-secondary">
            ({data?.total ?? 0})
          </span>
        </h1>
      </div>

      <div className="rounded border border-aws-border bg-aws-surface">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 border-b border-aws-border p-3">
          <div className="w-72">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search hosted zones"
            />
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </div>

        {/* Table / states */}
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            title={search ? "No matching hosted zones" : "No hosted zones"}
            message={
              search
                ? "Try a different search term."
                : "Create a hosted zone to get started."
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-aws-table-header text-left text-xs uppercase tracking-wide text-aws-text-secondary">
              <tr className="border-b border-aws-border">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-3 py-2 font-semibold">Domain name</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Record count</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold">Hosted zone ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((z) => (
                <tr
                  key={z.id}
                  className="border-b border-aws-border last:border-0 hover:bg-aws-row-hover"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(z.id)}
                      onChange={() => toggleOne(z.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/route53/hosted-zones/${z.id}`}
                      className="font-medium text-aws-link hover:underline"
                    >
                      {z.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Badge>{z.type}</Badge>
                  </td>
                  <td className="px-3 py-2">{z.record_count}</td>
                  <td className="px-3 py-2 text-aws-text-secondary">
                    {z.comment || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-aws-text-secondary">
                    {z.id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
