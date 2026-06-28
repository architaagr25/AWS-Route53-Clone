/** Shown in place of a table when there is no data (or no search matches). */
import type { ReactNode } from "react";

interface Props {
  title: string;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({ title, message, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-sm font-semibold text-aws-text">{title}</p>
      {message && <p className="max-w-sm text-sm text-aws-text-secondary">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
