"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ToastContainer } from "@/components/ui/Toast";
import { useUserStore } from "@/store/userStore";
import { formatCurrency } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Target,
  BrainCircuit,
  CalendarDays,
  Users,
  Repeat2,
  Repeat,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Diamond,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/insights", label: "Insights", icon: BrainCircuit },
  { href: "/group", label: "Group", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat2 },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
];

const PREFETCH_MAP: Record<string, string[]> = {
  "/dashboard": ["/api/users/me", "/api/transactions/summary", "/api/analytics/income-vs-expense?months=6", "/api/analytics/category-breakdown?months=1", "/api/transactions?limit=20&filter=all"],
  "/analytics": ["/api/analytics/category-breakdown?months=1", "/api/analytics/income-vs-expense?months=1", "/api/analytics/spending-trend?months=1", "/api/analytics/heatmap?months=1"],
  "/budgets": ["/api/budgets", "/api/categories"],
  "/goals": ["/api/goals"],
  "/calendar": ["/api/transactions?limit=1000", "/api/subscriptions", "/api/recurring", "/api/goals"],
  "/subscriptions": ["/api/subscriptions", "/api/subscriptions/upcoming"],
  "/recurring": ["/api/recurring"],
  "/insights": ["/api/analytics/insights?months=1"],
  "/group": ["/api/groups"],
  "/settings": ["/api/users/me", "/api/settings/security-questions"],
};

const prefetched = new Set<string>();

function prefetchPage(href: string) {
  const urls = PREFETCH_MAP[href];
  if (!urls) return;
  for (const url of urls) {
    if (prefetched.has(url)) continue;
    prefetched.add(url);
    fetch(url).catch(() => {});
  }
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function formatRelativeTime(dateStr: string) {
  try {
    return `${formatDistanceToNow(new Date(dateStr))} ago`;
  } catch {
    return "";
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const setPreferences = useUserStore((s) => s.setPreferences);
  const currencyCode = useUserStore((s) => s.currencyCode);
  const showCents = useUserStore((s) => s.showCents);
  const numberFormat = useUserStore((s) => s.numberFormat);

  useEffect(() => {
    if (!notificationOpen && !userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const isOutsideNotif = notifRef.current && !notifRef.current.contains(target);
      const isOutsideUserMenu = userMenuRef.current && !userMenuRef.current.contains(target);
      if (isOutsideNotif) setNotificationOpen(false);
      if (isOutsideUserMenu) setUserMenuOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNotificationOpen(false);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [notificationOpen, userMenuOpen]);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me").then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      }),
      fetch("/api/transactions/summary")
        .then((r) => r.json())
        .then((d) => setBalance(d.balance ?? 0))
        .catch(() => {}),
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => {
          setNotifications(d.notifications ?? []);
          setUnreadCount(d.unreadCount ?? 0);
        })
        .catch(() => {}),
    ])
      .then(([userData]) => {
        setUser(userData);
        setPreferences({
          currencyCode: userData.currencyCode,
          showCents: userData.showCents,
          numberFormat: userData.numberFormat,
        });
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-monochrome-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — mobile overlay (unchanged — always full width) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-monochrome-200 transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-monochrome-200">
          <Link href="/dashboard" className="text-xl font-bold">
            <span className="text-accent-600">◆</span> WealthWise
          </Link>
          <button
            className="lg:hidden text-monochrome-400 hover:text-black"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => prefetchPage(item.href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 active:scale-[0.95] ${
                  isActive
                    ? "bg-monochrome-100 text-accent-700"
                    : "text-monochrome-500 hover:-translate-y-0.5 hover:text-black hover:bg-monochrome-100"
                } animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Sidebar — desktop collapsible */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-white/80 backdrop-blur-xl border-r border-monochrome-200 transition-all duration-200 ${
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        } lg:shrink-0`}
      >
        {/* Logo area */}
        <div className={`flex items-center border-b border-monochrome-200 h-16 ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"}`}>
          <Link
            href="/dashboard"
            className={`font-bold text-black ${sidebarCollapsed ? "text-lg" : "text-xl"}`}
          >
            {sidebarCollapsed ? <span className="text-accent-600">◆</span> : <><span className="text-accent-600">◆</span> WealthWise</>}
          </Link>
        </div>

        {/* Nav items */}
        <nav className={`p-3 space-y-1 flex-1 ${sidebarCollapsed ? "flex flex-col items-center" : ""}`}>
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => prefetchPage(item.href)}
                className={`flex items-center rounded-md text-sm font-medium transition-all duration-200 active:scale-[0.95] ${
                  sidebarCollapsed
                    ? "justify-center w-10 h-10"
                    : "gap-3 px-3 py-2.5 w-full"
                } ${
                  isActive
                    ? "bg-monochrome-100 text-accent-700"
                    : "text-monochrome-500 hover:-translate-y-0.5 hover:text-black hover:bg-monochrome-100"
                } animate-fade-in-up`}
                style={{ animationDelay: `${idx * 0.04}s` }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle at bottom (always visible) */}
        <div className="p-3 flex justify-center border-t border-monochrome-200">
          <button
            className="text-monochrome-400 hover:text-black transition-colors"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-monochrome-100/60">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              className="lg:hidden text-monochrome-600 hover:text-black"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-4">
              {/* Balance pill */}
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-monochrome-200/60 rounded-full px-4 py-1.5 shrink-0 max-w-[calc(100vw-8rem)] overflow-hidden">
                <Diamond size={14} className="text-black shrink-0" />
                {balance === null ? (
                  <div className="h-4 w-20 bg-monochrome-200 rounded animate-pulse" />
                ) : (
                  <>
                    <span className="text-sm font-mono font-bold text-monochrome-900 truncate">
                      {formatCurrency(balance, currencyCode, showCents, numberFormat as "indian" | "international")}
                    </span>
                    <span className="text-[10px] text-monochrome-400 font-medium hidden sm:inline shrink-0">
                      balance
                    </span>
                  </>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  className="relative text-monochrome-600 hover:text-black transition-colors"
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    setUserMenuOpen(false);
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-monochrome-200 rounded-lg shadow-dropdown z-50 dropdown-enter origin-top-right max-w-[calc(100vw-2rem)]">
                    <div className="p-3 border-b border-monochrome-200 flex items-center justify-between">
                      <span className="text-sm font-semibold">Notifications</span>
                      <button
                        className="text-xs text-monochrome-500 hover:text-black"
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-monochrome-400 text-center py-6">
                          No notifications
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-3 py-2.5 border-b border-monochrome-100 hover:bg-monochrome-50 text-sm ${!n.read ? "bg-monochrome-50/50" : ""}`}
                          >
                            <p className={`text-monochrome-800 ${!n.read ? "font-semibold" : ""}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-monochrome-400 mt-0.5">
                              {formatRelativeTime(n.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-monochrome-700 hover:text-black"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationOpen(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-black to-monochrome-800 text-white flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-monochrome-200 rounded-lg shadow-dropdown z-50 dropdown-enter origin-top-right">
                    <div className="px-3 py-2 border-b border-monochrome-200">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-monochrome-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="block px-3 py-2 text-sm text-monochrome-700 hover:bg-monochrome-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-monochrome-700 hover:bg-monochrome-50 flex items-center gap-2"
                        onClick={handleLogout}
                      >
                        <LogOut size={16} />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
