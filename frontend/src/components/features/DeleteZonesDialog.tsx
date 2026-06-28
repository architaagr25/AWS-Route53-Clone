"use client";

/**
 * Confirmation dialog for deleting one or more hosted zones. Warns that the
 * zones' records are removed too — the backend cascades the delete, like Route 53.
 */
import { useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ApiError, zones as zonesApi } from "@/lib/api";
import type { HostedZone } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  zones: HostedZone[];
}

export default function DeleteZonesDialog({ open, onClose, onDeleted, zones }: Props) {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      // Delete each selected zone (records cascade on the backend).
      await Promise.all(zones.map((z) => zonesApi.remove(z.id)));
      showToast(
        zones.length === 1
          ? "Hosted zone deleted."
          : `${zones.length} hosted zones deleted.`,
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
      title={zones.length === 1 ? "Delete hosted zone" : "Delete hosted zones"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-aws-text">
        Are you sure you want to delete{" "}
        {zones.length === 1 ? (
          <span className="font-semibold">{zones[0]?.name}</span>
        ) : (
          <span className="font-semibold">{zones.length} hosted zones</span>
        )}
        ?
      </p>
      <p className="mt-2 text-sm text-aws-error">
        This permanently deletes the zone and all of its DNS records. This action
        cannot be undone.
      </p>
    </Modal>
  );
}
