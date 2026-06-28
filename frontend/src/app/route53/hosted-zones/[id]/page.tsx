"use client";

/**
 * Zone detail page — the records inside one hosted zone, in an AWS-style table
 * with search, a record-type filter, and pagination, plus create / edit /
 * delete / import / export actions.
 */
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Breadcrumbs from "@/components/shell/Breadcrumbs";
import { useToast } from "@/components/shell/ToastProvider";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import Spinner from "@/components/ui/Spinner";
import CreateRecordModal from "@/components/features/CreateRecordModal";
import EditRecordModal from "@/components/features/EditRecordModal";
import DeleteRecordsDialog from "@/components/features/DeleteRecordsDialog";
import ImportZoneModal from "@/components/features/ImportZoneModal";
import ExportMenu from "@/components/features/ExportMenu";
import { ApiError, records, zones } from "@/lib/api";
import type { DnsRecord, HostedZone, RecordList } from "@/lib/types";

const PAGE_SIZE = 10;
const TYPE_FILTERS = [
  "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA",
];

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = params.id as string;
  const { showToast } = useToast();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RecordList | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Load the zone (for the header). Re-run after record changes to refresh the count.
  const loadZone = useCallback(() => {
    zones
      .get(zoneId)
      .then(setZone)
      .catch((err) =>
        showToast(err instanceof ApiError ? err.message : "Zone not found", "error")
      );
  }, [zoneId, showToast]);

  useEffect(() => {
    loadZone();
  }, [loadZone]);

  useEffect(() => {
    document.title = zone ? `${zone.name} | Route 53` : "Hosted zone | Route 53";
  }, [zone]);

  const loadRecords = useCallback(() => {
    setLoading(true);
    records
      .list(zoneId, { search, type: typeFilter || undefined, page, page_size: PAGE_SIZE })
      .then(setData)
      .catch((err) =>
        showToast(err instanceof ApiError ? err.message : "Failed to load records", "error")
      )
      .finally(() => setLoading(false));
  }, [zoneId, search, typeFilter, page, showToast]);

  useEffect(() => {
    const timer = setTimeout(loadRecords, 250);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  // Clear the selection when the search, type filter, or page changes — the
  // selected rows may no longer be visible (matches the AWS console).
  useEffect(() => {
    setSelected(new Set());
  }, [search, typeFilter, page]);

  function refresh() {
    setSelected(new Set());
    loadRecords();
    loadZone(); // refresh the header's record_count
  }

  const items = data?.items ?? [];
  const selectedRecords = items.filter((r) => selected.has(r.id));
  const allSelected = items.length > 0 && items.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((r) => r.id)));
  }
  function toggleOne(id: number) {
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
          { label: "Hosted zones", href: "/route53/hosted-zones" },
          { label: zone?.name ?? zoneId },
        ]}
      />

      {/* Zone header */}
      <div className="mt-2 mb-4">
        <h1 className="text-2xl font-semibold text-aws-text">{zone?.name ?? "…"}</h1>
        {zone && (
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-aws-text-secondary">
            <span className="flex items-center gap-1">
              Type: <Badge>{zone.type}</Badge>
            </span>
            <span>Record count: {zone.record_count}</span>
            <span className="font-mono">Hosted zone ID: {zone.id}</span>
          </div>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-aws-text">
          Records{" "}
          <span className="text-sm font-normal text-aws-text-secondary">
            ({data?.total ?? 0})
          </span>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={selectedRecords.length !== 1}
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            disabled={selectedRecords.length === 0}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
          <ExportMenu zoneId={zoneId} />
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create record
          </Button>
        </div>
      </div>

      <div className="rounded border border-aws-border bg-aws-surface">
        {/* Toolbar: search + type filter + pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-aws-border p-3">
          <div className="flex items-center gap-2">
            <div className="w-64">
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search records"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded border border-aws-border bg-aws-surface px-2 py-1.5 text-sm text-aws-text focus:border-aws-link focus:outline-none"
            >
              <option value="">All types</option>
              {TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </div>

        {/* Bulk selection action bar */}
        {selectedRecords.length > 0 && (
          <div className="flex items-center justify-between border-b border-aws-border bg-aws-bg px-3 py-2 text-sm">
            <span className="text-aws-text">
              {selectedRecords.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete selected
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-aws-link hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            title={search || typeFilter ? "No matching records" : "No records"}
            message={
              search || typeFilter
                ? "Try a different search or filter."
                : "This zone has no records yet."
            }
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-aws-table-header text-left text-xs uppercase tracking-wide text-aws-text-secondary">
              <tr className="border-b border-aws-border">
                <th className="w-10 px-3 py-2">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-3 py-2 font-semibold">Record name</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Value</th>
                <th className="px-3 py-2 font-semibold">TTL</th>
                <th className="px-3 py-2 font-semibold">Routing policy</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r: DnsRecord) => (
                <tr
                  key={r.id}
                  className="border-b border-aws-border last:border-0 hover:bg-aws-row-hover"
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                    />
                  </td>
                  <td className="px-3 py-2 align-top font-medium text-aws-text">
                    {r.name}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Badge>{r.type}</Badge>
                  </td>
                  <td className="whitespace-pre-line px-3 py-2 align-top font-mono text-xs text-aws-text">
                    {r.value}
                  </td>
                  <td className="px-3 py-2 align-top">{r.ttl}</td>
                  <td className="px-3 py-2 align-top text-aws-text-secondary">
                    {r.routing_policy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link
          href="/route53/hosted-zones"
          className="text-sm text-aws-link hover:underline"
        >
          ‹ Back to hosted zones
        </Link>
      </div>

      <CreateRecordModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={refresh}
        zoneId={zoneId}
        zoneName={zone?.name ?? zoneId}
      />
      <EditRecordModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={refresh}
        record={selectedRecords[0] ?? null}
      />
      <DeleteRecordsDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={refresh}
        zoneId={zoneId}
        records={selectedRecords}
      />
      <ImportZoneModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={refresh}
        zoneId={zoneId}
      />
    </div>
  );
}
