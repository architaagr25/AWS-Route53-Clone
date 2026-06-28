"use client";

/**
 * Create/edit a hosted zone.
 * - Create (no `zone`): name, type and comment are all editable.
 * - Edit (`zone` given): only the comment is editable — name and type are fixed
 *   once the zone exists, like Route 53.
 */
import { useEffect, useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ApiError, zones } from "@/lib/api";
import type { HostedZone, ZoneType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  zone?: HostedZone | null;
}

export default function ZoneFormModal({ open, onClose, onSaved, zone }: Props) {
  const { showToast } = useToast();
  const isEdit = Boolean(zone);

  const [name, setName] = useState("");
  const [type, setType] = useState<ZoneType>("Public");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the fields each time the modal opens (from the zone, if editing).
  useEffect(() => {
    if (open) {
      setName(zone ? zone.name.replace(/\.$/, "") : "");
      setType(zone?.type ?? "Public");
      setComment(zone?.comment ?? "");
      setError("");
    }
  }, [open, zone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit && zone) {
        await zones.update(zone.id, { comment });
        showToast("Hosted zone updated.", "success");
      } else {
        await zones.create({ name, type, comment });
        showToast("Hosted zone created successfully.", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit hosted zone" : "Create hosted zone"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" form="zone-form" type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create hosted zone"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded border-l-4 border-aws-error bg-red-50 px-3 py-2 text-sm text-aws-error dark:bg-red-950/40">
          {error}
        </div>
      )}
      <form id="zone-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">
            Domain name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isEdit}
            required
            placeholder="example.com"
            className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none disabled:bg-aws-bg disabled:text-aws-text-secondary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ZoneType)}
            disabled={isEdit}
            className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none disabled:bg-aws-bg disabled:text-aws-text-secondary"
          >
            <option value="Public">Public hosted zone</option>
            <option value="Private">Private hosted zone</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-aws-text">
            Description <span className="text-aws-text-secondary">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
          />
        </div>
      </form>
    </Modal>
  );
}
