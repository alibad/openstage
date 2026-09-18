import Link from "next/link";
import { LayoutDashboard, Plus, Sparkles } from "lucide-react";

export const metadata = {
  title: "Admin — Openstage",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-light text-foreground">
      <div className="brand-gradient-bar" />

      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center text-white font-bold text-xs">
              P
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="text-sm font-semibold text-foreground hover:text-accent transition-colors"
              >
                <span className="brand-gradient-text">Openstage</span>
              </Link>
              <span className="text-xs text-muted font-medium bg-accent-light border border-accent/15 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-accent-light rounded-lg transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/studio"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-accent-light rounded-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Studio
            </Link>
            <Link
              href="/admin/new"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-accent hover:bg-accent/90 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              New Presentation
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto px-6 py-8 max-w-7xl">{children}</main>
    </div>
  );
}
