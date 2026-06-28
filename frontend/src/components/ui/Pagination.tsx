/**
 * AWS-style pagination control: shows the current range ("1-10 of 47") and
 * previous/next buttons that disable at the boundaries.
 */
interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-end gap-3 text-sm text-aws-text-secondary">
      <span className="whitespace-nowrap">
        {start}-{end} of {total}
      </span>
      <div className="flex">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-l border border-aws-border px-2 py-1 hover:bg-aws-bg disabled:opacity-40"
          aria-label="Previous page"
        >
          ‹
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          className="rounded-r border-y border-r border-aws-border px-2 py-1 hover:bg-aws-bg disabled:opacity-40"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
