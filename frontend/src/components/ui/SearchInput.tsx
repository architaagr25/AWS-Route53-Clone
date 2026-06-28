/** AWS-style search box with a magnifier icon. Controlled component. */
interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder }: Props) {
  return (
    <div className="flex items-center gap-2 rounded border border-aws-border bg-aws-surface px-2 py-1.5">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-aws-text-secondary"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search"}
        className="w-full bg-transparent text-sm text-aws-text outline-none placeholder:text-aws-text-secondary"
      />
    </div>
  );
}
