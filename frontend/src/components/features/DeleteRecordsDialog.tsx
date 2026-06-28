"use client";

/**
 * Confirmation dialog for deleting one or more DNS records.
 * The SOA record can't be deleted (as in Route 53); if selected, it is shown as
 * skipped and only the deletable records are removed.
 */
import { useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ApiError, records as recordsApi } from "@/lib/api";
import type { DnsRecord } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  records: DnsRecord[];
}

export default function DeleteRecordsDialog({ open, onClose, onDeleted, records }: Props) {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const deletable = records.filter((r) => r.type !== "SOA");
  const protectedCount = records.length - deletable.length;

  async function handleDelete() {
    setDeleting(true);
    try {
      await Promise.all(deletable.map((r) => recordsApi.remove(r.id)));
      showToast(
        deletable.length === 1
          ? "Record deleted."
          : `${deletable.length} records deleted.`,
        "success"
      );
      onDeleted();
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={deletable.length === 1 ? "Delete record" : "Delete records"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting || deletable.length === 0}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      {deletable.length > 0 ? (
        <p className="text-sm text-aws-text">
          Are you sure you want to delete{" "}
          <span className="font-semibold">
            {deletable.length === 1 ? deletable[0].name : `${deletable.length} records`}
          </span>
          ? This action cannot be undone.
        </p>
      ) : (
        <p className="text-sm text-aws-text">
          The SOA record cannot be deleted.
        </p>
      )}
      {protectedCount > 0 && deletable.length > 0 && (
        <p className="mt-2 text-xs text-aws-text-secondary">
          Note: the SOA record cannot be deleted and will be skipped.
        </p>
      )}
    </Modal>
  );
}
