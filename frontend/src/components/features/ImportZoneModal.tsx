"use client";

/**
 * Import-from-BIND modal. Paste a zone file (or upload a .zone/.txt), Preview to
 * see the parsed records + any errors, then Import to persist them.
 */
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { ApiError, zones } from "@/lib/api";
import type { ImportPreview } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  zoneId: string;
}

export default function ImportZoneModal({ open, onClose, onImported, zoneId }: Props) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setPreview(null);
    }
  }, [open]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setContent(text);
      setPreview(null);
    });
  }

  async function handlePreview() {
    setBusy(true);
    try {
      setPreview(await zones.importPreview(zoneId, content));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Preview failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    try {
      const res = await zones.importCommit(zoneId, content);
      showToast(`Imported ${res.imported} record(s).`, "success");
      onImported();
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Import failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import zone file (BIND)"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {preview ? (
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={busy || preview.count === 0}
            >
              {busy ? "Importing…" : `Import ${preview.count} record(s)`}
            </Button>
          ) : (
            <Button variant="primary" onClick={handlePreview} disabled={busy || !content.trim()}>
              {busy ? "Parsing…" : "Preview"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-aws-text">
            Paste BIND zone file
          </label>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs text-aws-link hover:underline"
          >
            …or upload a file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".zone,.txt,text/plain"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setPreview(null);
          }}
          rows={6}
          placeholder={"$ORIGIN example.com.\n$TTL 300\nwww  IN  A  192.0.2.1"}
          className="w-full rounded border border-aws-border px-3 py-1.5 font-mono text-xs focus:border-aws-link focus:outline-none"
        />

        {preview && (
          <div className="rounded border border-aws-border">
            <div className="border-b border-aws-border bg-aws-table-header px-3 py-1.5 text-xs font-semibold text-aws-text-secondary">
              {preview.count} record(s) will be imported
              {preview.errors.length > 0 && ` · ${preview.errors.length} skipped`}
            </div>
            <div className="max-h-48 overflow-auto">
              {preview.preview.length === 0 ? (
                <p className="px-3 py-3 text-sm text-aws-text-secondary">
                  No valid records found.
                </p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {preview.preview.map((r, i) => (
                      <tr key={i} className="border-b border-aws-border last:border-0">
                        <td className="px-3 py-1">
                          <Badge>{r.type}</Badge>
                        </td>
                        <td className="px-3 py-1 font-medium">{r.name}</td>
                        <td className="px-3 py-1 font-mono text-aws-text-secondary">
                          {r.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {preview.errors.length > 0 && (
              <div className="border-t border-aws-border px-3 py-2 text-xs text-aws-error">
                {preview.errors.map((e, i) => (
                  <p key={i}>• {e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
