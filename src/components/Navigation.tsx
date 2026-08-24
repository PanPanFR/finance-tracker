"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TransactionForm from "./TransactionForm";
import LockButton from "./LockButton";
import ThemeToggle from "./ThemeToggle";
import { useToast } from "./Toast";
import { apiFetch } from "../lib/client-api";
import {
  WalletIcon,
  ReceiptIcon,
  SparklesIcon,
  TrendingUpIcon,
  SettingsIcon,
  PlusIcon,
  MenuIcon,
  XIcon,
  ChevronRightIcon,
} from "./Icons";

export default function Navigation() {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBottomNavHidden, setIsBottomNavHidden] = useState(false);
  const { success, error: toastError } = useToast();

  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: WalletIcon,
      desc: "Overview, balance & daily spend",
    },
    {
      href: "/transactions",
      label: "Ledger",
      icon: ReceiptIcon,
      desc: "Transactions history & search",
    },
    {
      href: "/ai-copilot",
      label: "AI Copilot",
      icon: SparklesIcon,
      desc: "Natural language & Smart OCR",
    },
    {
      href: "/analytics",
      label: "Analytics",
      icon: TrendingUpIcon,
      desc: "Charts, category shares & trends",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: SettingsIcon,
      desc: "Vault pin & security",
    },
  ];

  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Close sidebar automatically when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsBottomNavHidden(false);
  }, [pathname]);

  // Auto-hide bottom nav on scroll down, reveal on scroll up (rAF-throttled)
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsBottomNavHidden(y > lastY && y > 96);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentNavItem = navItems.find((item) => item.href === pathname) || navItems[0];

  const handleAddTransaction = async (transactionData: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category?: string;
  }) => {
    try {
      const res = await apiFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transactionData,
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Insert failed");
      success("Transaction recorded successfully!");
      setIsAddModalOpen(false);
      // Trigger soft page refresh if on dashboard or ledger
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("transaction-added"));
      }
    } catch {
      toastError("Failed to add transaction");
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          {/* Menu Button & Brand Section */}
          <div className="brand-section">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open dashboard navigation menu"
              title="Dashboard Menu"
            >
              <MenuIcon size={18} />
            </button>

            <Link href="/" className="brand-link">
              <div className="brand-logo-icon">
                <WalletIcon size={18} />
              </div>
              <h1 className="brand-title">Finance Tracker</h1>
            </Link>

            <span className="brand-badge">
              <SparklesIcon size={11} />
              <span>{currentNavItem.label}</span>
            </span>
          </div>

          {/* Top Actions */}
          <div className="navbar-actions">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary btn-sm"
              aria-label="Add transaction"
            >
              <PlusIcon size={14} className="icon-wrap" />
              <span>Add</span>
            </button>
            <ThemeToggle />
            <LockButton />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay (Desktop & Mobile Drawer) */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`sidebar-drawer ${isSidebarOpen ? "open" : ""}`}
        aria-label="Dashboard navigation menu"
        aria-hidden={!isSidebarOpen}
      >
        {/* Drawer Header */}
        <div className="sidebar-header">
          <div className="brand-section" style={{ gap: "0.625rem" }}>
            <div className="brand-logo-icon">
              <WalletIcon size={18} />
            </div>
            <div>
              <div className="brand-title" style={{ fontSize: "0.9375rem" }}>Finance Vault</div>
              <div className="sidebar-subtitle">Cloudflare D1 &amp; AI Native</div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
            title="Close menu"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* System Active Status Pill */}
        <div className="sidebar-badge-box">
          <div className="sidebar-status-dot" />
          <div className="sidebar-status-info">
            <span className="sidebar-status-title">Vault Active &amp; Encrypted</span>
            <span className="sidebar-status-sub">Cloudflare Workers AI Ready</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="sidebar-nav-section">
          <div className="sidebar-section-title">Dashboard Menu</div>
          <nav className="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                >
                  <div className={`sidebar-icon-wrap ${isActive ? "active" : ""}`}>
                    <Icon size={18} />
                  </div>
                  <div className="sidebar-nav-text">
                    <div className="sidebar-nav-label">{item.label}</div>
                    <div className="sidebar-nav-desc">{item.desc}</div>
                  </div>
                  <ChevronRightIcon size={14} className="sidebar-nav-arrow" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Drawer Quick Action */}
        <div className="sidebar-quick-action">
          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsAddModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
          >
            <PlusIcon size={15} />
            <span>Record Transaction</span>
          </button>
        </div>

        {/* Drawer Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-shortcut-hint">
            Press <kbd>ESC</kbd> to close
          </div>
          <LockButton />
        </div>
      </aside>

      {/* Mobile Fixed Bottom Navigation Bar (Preserved as requested) */}
      <nav className={`mobile-bottom-nav ${isBottomNavHidden ? "nav-hidden" : ""}`}>
        <div className="mobile-bottom-nav-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-tab-item ${isActive ? "active" : ""}`}
              >
                <div className={`mobile-tab-icon ${isActive ? "active" : ""}`}>
                  <Icon size={18} />
                </div>
                <span className="mobile-tab-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Global Quick Add Modal */}
      <TransactionForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
        mode="add"
      />
    </>
  );
}
