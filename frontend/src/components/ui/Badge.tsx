/** A small pill label, e.g. for a record type (A, CNAME) or zone type. */
import type { ReactNode } from "react";

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded border border-aws-border bg-aws-bg px-1.5 py-0.5 font-mono text-xs text-aws-text">
      {children}
    </span>
  );
}
