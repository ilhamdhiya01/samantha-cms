import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Briefcase,
  Bot,
  ImageIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import { SkipLink } from "@/components/layout/SkipLink";
import { MobileNav } from "@/components/layout/MobileNav";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  // { to: "/posts", label: "Posts", icon: FileText },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/experiences", label: "Experiences", icon: Briefcase },
  { to: "/chatbot", label: "Chatbot", icon: Bot },
  { to: "/media", label: "Media", icon: ImageIcon },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }: { isActive: boolean }) =>
        cn(
          "flex items-center gap-3 rounded px-3 py-2 text-sm font-medium",
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-slate-600 hover:bg-slate-100",
        )
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

export function AppLayout() {
  const admin = useAuth((s) => s.admin);
  const clear = useAuth((s) => s.clear);
  const nav = useNavigate();

  function handleLogout() {
    clear();
    nav("/login", { replace: true });
  }

  const mobileItems = navItems.map(({ to, label, end }) => ({
    to,
    label,
    end,
  }));

  return (
    <div className="min-h-screen flex bg-slate-100">
      <SkipLink />

      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-sm uppercase tracking-wide text-slate-400">
            Samantha
          </div>
          <div className="font-semibold text-slate-900">CMS</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span className="truncate">{admin?.email ?? "—"}</span>
          <button
            onClick={handleLogout}
            className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-100"
            aria-label="Logout"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">Samantha CMS</span>
          <MobileNav items={mobileItems} />
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 overflow-y-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
