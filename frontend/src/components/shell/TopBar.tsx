/**
 * Dark AWS console top bar (#232f3e).
 * Left: services icon, the "aws" logo, the "Route 53" name.
 * Right: help, region ("Global" for Route 53), theme toggle, account menu.
 */
import Link from "next/link";

import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import SidebarToggle from "./SidebarToggle";
import HelpButton from "./HelpButton";
import RegionMenu from "./RegionMenu";

function AwsLogo() {
  // A compact stand-in for the AWS smile logo: lowercase wordmark + orange arc.
  return (
    <span className="relative inline-block leading-none select-none">
      <span className="text-[18px] font-bold text-white tracking-tight">aws</span>
      <svg
        viewBox="0 0 40 8"
        className="absolute -bottom-1 left-0 h-2 w-9 text-aws-orange"
        fill="none"
        aria-hidden
      >
        <path
          d="M2 2 C 12 9, 28 9, 38 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function TopBar() {
  return (
    <header className="flex h-10 items-center justify-between bg-aws-squid px-3 text-sm text-white">
      {/* Left cluster */}
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <Link href="/route53/hosted-zones" className="flex items-center pr-1">
          <AwsLogo />
        </Link>
        <span className="h-5 w-px bg-white/20" />
        <Link
          href="/route53/hosted-zones"
          className="font-bold text-white hover:text-aws-orange"
        >
          Route 53
        </Link>
      </div>

      {/* Right cluster — help and region hide on small screens to save space */}
      <div className="flex items-center gap-1">
        <HelpButton />
        <RegionMenu />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
