"use client";

/**
 * The AWS Route 53 left navigation sidebar.
 *
 * Lists the console sections. The item matching the current route is
 * highlighted AWS-style: an orange left border, light background, bold text.
 * "Hosted zones" is the real feature; the rest are mocked "Coming soon" pages.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/route53/dashboard" },
  { label: "Hosted zones", href: "/route53/hosted-zones" },
  { label: "Health checks", href: "/route53/health-checks" },
  { label: "Traffic policies", href: "/route53/traffic-policies" },
  { label: "Resolver", href: "/route53/resolver" },
  { label: "Profiles", href: "/route53/profiles" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-60 shrink-0 border-r border-aws-border bg-aws-surface">
      <div className="px-4 py-3 text-[15px] font-bold text-aws-text">Route 53</div>
      <ul className="pb-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "block border-l-4 px-4 py-1.5 text-sm",
                  active
                    ? "border-aws-orange bg-aws-bg font-bold text-aws-text"
                    : "border-transparent text-aws-link hover:bg-aws-bg",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
