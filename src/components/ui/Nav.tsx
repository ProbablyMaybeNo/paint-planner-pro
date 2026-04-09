"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/",        label: "HOME",    key: "H" },
  { href: "/library", label: "LIBRARY", key: "L" },
  { href: "/match",   label: "MATCH",   key: "M" },
  { href: "/wheel",   label: "WHEEL",   key: "W" },
  { href: "/planner", label: "PLANNER", key: "P" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <nav className="border-b border-border bg-bg sticky top-0 z-50">
      <div className="flex items-center px-3 py-2 gap-0">
        {/* Logo */}
        <Link href="/" className="mr-4 flex flex-col">
          <span className="text-green glow-green text-base font-semibold tracking-widest leading-tight">
            PAINT PLANNER PRO
          </span>
          <span className="text-green-dim text-xs tracking-wider hidden sm:block">
            TACTICAL COLOUR SYSTEM v0.1
          </span>
        </Link>

        {/* Separator — desktop only */}
        <span className="text-border mr-4 text-sm hidden md:block">│</span>

        {/* Nav links — desktop */}
        <div className="hidden md:flex gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1 text-sm tracking-widest border transition-all duration-150
                  ${active
                    ? "border-green bg-green-faint text-green glow-green"
                    : "border-transparent text-green-dim hover:border-border hover:text-green"
                  }
                `}
              >
                <span className="text-green-dim mr-1 hidden lg:inline">[{item.key}]</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side status */}
        <div className="ml-auto flex items-center gap-3 text-[13px] text-green-dim">
          <span className="hidden sm:block">SYS:ONLINE</span>

          {/* Auth status */}
          {status === "authenticated" && session?.user ? (
            <div className="hidden sm:flex items-center gap-2">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-5 h-5 rounded-full border border-green/40" />
              )}
              <span className="text-sm text-green-dim truncate max-w-24">
                {session.user.email?.split("@")[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-terminal text-xs px-2 py-0.5"
              >
                OUT
              </button>
            </div>
          ) : status === "unauthenticated" ? (
            <Link href="/auth/signin" className="hidden sm:block btn-terminal btn-cyan text-xs px-2 py-0.5">
              SIGN IN
            </Link>
          ) : null}

          <span className="blink text-green">█</span>

          {/* Mobile menu button */}
          <button
            className="md:hidden btn-terminal text-[13px] px-2 py-0.5"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"} MENU
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 text-sm tracking-widest border-b border-border/40 ${
                  active ? "text-green glow-green bg-green-faint" : "text-green-dim"
                }`}
              >
                [{item.key}] {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom border glow line */}
      <div className="h-px bg-gradient-to-r from-transparent via-green to-transparent opacity-20" />
    </nav>
  );
}
