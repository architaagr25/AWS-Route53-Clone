"use client";

/**
 * Export dropdown for a hosted zone: download the zone + records as JSON or as
 * a BIND zone file.
 */
import { useEffect, useRef, useState } from "react";

import { useToast } from "@/components/shell/ToastProvider";
import Button from "@/components/ui/Button";
import { ApiError, downloadZoneExport } from "@/lib/api";

export default function ExportMenu({ zoneId }: { zoneId: string }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown on any click outside of it.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleExport(format: "json" | "bind") {
    setOpen(false);
    try {
      await downloadZoneExport(zoneId, format);
      showToast(`Exported as ${format.toUpperCase()}.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Export failed", "error");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" onClick={() => setOpen((o) => !o)}>
        Export ▾
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded border border-aws-border bg-aws-surface shadow-lg">
          <button
            onClick={() => handleExport("json")}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-aws-bg"
          >
            Export as JSON
          </button>
          <button
            onClick={() => handleExport("bind")}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-aws-bg"
          >
            Export as BIND (.zone)
          </button>
        </div>
      )}
    </div>
  );
}
