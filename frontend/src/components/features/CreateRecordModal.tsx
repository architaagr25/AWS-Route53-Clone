"use client";

/**
 * Create-record modal — the AWS "quick create" form for a DNS record:
 * record name (with the zone suffix shown), type (all 9 creatable types),
 * value (multi-line for multi-value records), and TTL. Per-type validation
 * errors from the backend surface as an inline alert.
 */
import { useEffect, useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ApiError, records } from "@/lib/api";
import { RECORD_TYPES } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  zoneId: string;
  zoneName: string; // e.g. "example.com."
}

// A short hint shown under the value field, per record type.
const VALUE_HINTS: Record<string, string> = {
  A: "IPv4 address, e.g. 192.0.2.1",
  AAAA: "IPv6 address, e.g. 2001:db8::1",
  CNAME: "Target hostname, e.g. example.com.",
  TXT: "Text value, e.g. v=spf1 -all",
  MX: "<priority> <host>, e.g. 10 mail.example.com.",
  NS: "Nameserver host, e.g. ns-1.example.com.",
  PTR: "Hostname",
  SRV: "<priority> <weight> <port> <target>",
  CAA: '<flags> <tag> "<value>", e.g. 0 issue "letsencrypt.org"',
};

const TTL_PRESETS = [60, 300, 3600, 86400];

export default function CreateRecordModal({
  open,
  onClose,
  onSaved,
  zoneId,
  zoneName,
}: Props) {
  const { showToast } = useToast();
  const suffix = "." + zoneName.replace(/\.$/, "");

  const [name, setName] = useState("");
  const [type, setType] = useState("A");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState(300);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setType("A");
      setValue("");
      setTtl(300);
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await records.create(zoneId, {
        name: name.trim(),
        type,
        value,
        ttl,
        routing_policy: "Simple",
      });
      showToast("Record created successfully.", "success");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create record"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" form="record-form" type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create record"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded border-l-4 border-aws-error bg-red-50 px-3 py-2 text-sm text-aws-error dark:bg-red-950/40">
          {error}
        </div>
      )}
      <form id="record-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">
            Record name
          </label>
          <div className="flex items-center">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="(leave blank for the zone apex)"
              className="w-full rounded-l border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
            />
            <span className="rounded-r border border-l-0 border-aws-border bg-aws-bg px-2 py-1.5 text-sm text-aws-text-secondary">
              {suffix}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-aws-text">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-aws-text">
              TTL (seconds)
            </label>
            <input
              type="number"
              min={0}
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              list="ttl-presets"
              className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
            />
            <datalist id="ttl-presets">
              {TTL_PRESETS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">Value</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            required
            placeholder={VALUE_HINTS[type]}
            className="w-full rounded border border-aws-border px-3 py-1.5 font-mono text-sm focus:border-aws-link focus:outline-none"
          />
          <p className="mt-1 text-xs text-aws-text-secondary">
            {VALUE_HINTS[type]}. Enter multiple values on separate lines.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">
            Routing policy
          </label>
          <select
            disabled
            className="w-full rounded border border-aws-border bg-aws-bg px-3 py-1.5 text-sm text-aws-text-secondary"
          >
            <option>Simple routing</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
