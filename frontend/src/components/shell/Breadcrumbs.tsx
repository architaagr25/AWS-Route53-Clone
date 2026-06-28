/**
 * AWS-style breadcrumb trail, e.g.  Route 53 > Hosted zones > example.com
 *
 * Pages pass their own trail. Every item except the last is a link; the last
 * is the current page (plain text).
 */
import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-aws-text-secondary">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-aws-border">›</span>}
            {c.href && !isLast ? (
              <Link href={c.href} className="text-aws-link hover:underline">
                {c.label}
              </Link>
            ) : (
              <span>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
