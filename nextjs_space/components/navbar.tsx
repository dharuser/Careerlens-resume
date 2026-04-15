"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  History,
  Home,
  Sparkles,
  Search,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analyze", label: "Analyze", icon: Sparkles },
  { href: "/jd-matcher", label: "JD Matcher", icon: Search },
  { href: "/interview-prep", label: "Interview Prep", icon: MessageSquare },
  { href: "/history", label: "History", icon: History },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border/50"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">
            CareerLens
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems?.map?.((item: any) => {
            const Icon = item?.icon;
            const isActive = pathname === item?.href;
            return (
              <Link
                key={item?.href ?? ""}
                href={item?.href ?? "/"}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{item?.label ?? ""}</span>
              </Link>
            );
          }) ?? []}
        </nav>
      </div>
    </motion.header>
  );
}
