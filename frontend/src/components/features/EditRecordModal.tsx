"use client";

/**
 * Edit a record. Name and type are fixed — like Route 53, you delete and
 * recreate to change those — so only the value and TTL are editable. The new
 * value is re-validated against the existing type by the backend.
 */
import { useEffect, useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ApiError, records } from "@/lib/api";
import type { DnsRecord } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  record: DnsRecord | null;
}

export default function EditRecordModal({ open, onClose, onSaved, record }: Props) {
  const { showToast } = useToast();
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState(300);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && record) {
      setValue(record.value);
      setTtl(record.ttl);
      setError("");
    }
  }, [open, record]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    setError("");
    setSaving(true);
    try {
      await records.update(record.id, { value, ttl });
      showToast("Record updated.", "success");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit record"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" form="edit-record-form" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded border-l-4 border-aws-error bg-red-50 px-3 py-2 text-sm text-aws-error dark:bg-red-950/40">
          {error}
        </div>
      )}
      <form id="edit-record-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Read-only identity */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="block text-xs text-aws-text-secondary">Record name</span>
            <span className="font-medium text-aws-text">{record?.name}</span>
          </div>
          <div>
            <span className="block text-xs text-aws-text-secondary">Type</span>
            <Badge>{record?.type}</Badge>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">Value</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            required
            className="w-full rounded border border-aws-border px-3 py-1.5 font-mono text-sm focus:border-aws-link focus:outline-none"
          />
          <p className="mt-1 text-xs text-aws-text-secondary">
            Enter multiple values on separate lines.
          </p>
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
            className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
          />
        </div>
      </form>
    </Modal>
  );
}
