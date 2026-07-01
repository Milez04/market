import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400 text-slate-950 shadow-[0_18px_50px_rgba(45,212,191,0.28)]">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold tracking-wide">CardForge 3D</span>
    </Link>
  );
}

export function MarketingNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
      <nav className="glass mx-auto flex max-w-7xl items-center justify-between rounded-full px-4 py-2">
        <AppLogo />
        <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#templates" className="hover:text-foreground">Templates</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button asChild variant="accent" size="sm">
            <Link href="/designer/new">Start designing</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
