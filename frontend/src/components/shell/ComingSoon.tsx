/**
 * Placeholder content for the mocked Route 53 sections (Dashboard, Health
 * checks, Traffic policies, Resolver, Profiles). Renders inside the console
 * shell with breadcrumbs, a page title, and a centered "coming soon" card.
 */
import Breadcrumbs from "@/components/shell/Breadcrumbs";

interface Props {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-6xl">
      <Breadcrumbs
        items={[{ label: "Route 53", href: "/route53/dashboard" }, { label: title }]}
      />
      <h1 className="mt-2 mb-6 text-2xl font-semibold text-aws-text">{title}</h1>

      <div className="flex flex-col items-center gap-3 rounded border border-aws-border bg-aws-surface py-20 text-center">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-aws-text-secondary"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-lg font-semibold text-aws-text">Coming soon</p>
        <p className="max-w-md text-sm text-aws-text-secondary">
          {description ??
            `${title} is not implemented in this clone. This is a placeholder for a mocked section.`}
        </p>
      </div>
    </div>
  );
}
