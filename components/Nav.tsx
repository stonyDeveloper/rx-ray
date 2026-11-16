"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import Container from "./Container";
import Logo from "./Logo";

const LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "What we check", href: "/#checks" },
  { label: "Data", href: "/#data" },
  { label: "FAQ", href: "/#faq" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-rule bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <Container className="flex h-[72px] items-center justify-between gap-6">
        <Link href="/" aria-label="Rx-Ray — home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="link-line text-[13px] text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/scan"
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-clinical"
        >
          Scan a pack
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </Link>
      </Container>
    </header>
  );
}
