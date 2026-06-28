/**
 * Dark AWS console top bar (#232f3e).
 * Left: services icon, the "aws" logo, the "Route 53" name.
 * Right: help, region ("Global" for Route 53), theme toggle, account menu.
 */
import Link from "next/link";

import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import SidebarToggle from "./SidebarToggle";

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

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
    </svg>
  );
}

function Caret() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2 4l4 4 4-4z" />
    </svg>
  );
}

export default function TopBar() {
  return (
    <header className="flex h-10 items-center justify-between bg-aws-squid px-3 text-sm text-white">
      {/* Left cluster */}
      <div className="flex items-center gap-3">
        <SidebarToggle />
        <button
          className="hidden items-center rounded p-1 hover:bg-aws-squid-light md:flex"
          aria-label="Open services menu"
        >
          <GridIcon />
        </button>
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

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <button className="rounded px-2 py-1 hover:bg-aws-squid-light" aria-label="Help">
          ?
        </button>
        <button className="flex items-center gap-1 rounded px-2 py-1 hover:bg-aws-squid-light">
          Global <Caret />
        </button>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
