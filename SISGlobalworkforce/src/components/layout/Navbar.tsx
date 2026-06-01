"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Phone, Mail, Menu, X } from "lucide-react";
import { navItems } from "@/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="bg-white border-b border-brand-grey-200 py-2 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="mailto:info@sisglobalindia.com" className="flex items-center gap-2 text-sm text-brand-grey-600 hover:text-brand-red transition-colors">
              <Mail size={14} />
              info@sisglobalindia.com
            </a>
            <a href="tel:+911145678900" className="flex items-center gap-2 text-sm text-brand-grey-600 hover:text-brand-red transition-colors">
              <Phone size={14} />
              +91 11 4567 8900
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-grey-500">Follow Us:</span>
            {["in", "f", "ig", "yt"].map((s) => (
              <a key={s} href="#" className="w-7 h-7 rounded-full bg-brand-grey-100 flex items-center justify-center text-xs text-brand-grey-600 hover:bg-brand-red hover:text-white transition-all font-bold">
                {s === "in" ? "in" : s === "f" ? "f" : s === "ig" ? "◎" : "▶"}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-19">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
          <img src="/assets/LOGO-new-formet.png" alt="SIS Global"   style={{
      height: '95px',
      // background:"#fff",
      
      width: 'auto',
      objectFit: 'contain'
    }} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.label} className="nav-item relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-lg font-medium text-brand-grey-700 hover:text-brand-red transition-colors whitespace-nowrap"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {item.label}
                  {item.children && <ChevronDown size={14} />}
                </Link>
                {item.children && (
                  <div className="nav-dropdown absolute top-full left-0 w-52 bg-white shadow-xl border-t-2 border-brand-red z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-3 text-sm text-brand-grey-700 hover:bg-brand-grey-50 hover:text-brand-red transition-colors border-b border-brand-grey-100 last:border-0"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* <Link href="/pay" className="btn-outline !text-brand-grey-700 !border-brand-grey-300 !py-2 !px-5 text-sm hover:!border-brand-red hover:!text-brand-red">
              Pay Here
            </Link> */}
            <a href="/jobs" className="btn-primary !py-2 !px-4 text-sm">
              <Phone size={14} />
              Explore Opportunities
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-brand-grey-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-brand-grey-200 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block py-3 px-3 text-sm font-medium text-brand-grey-700 hover:text-brand-red border-b border-brand-grey-100 last:border-0"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <a href="tel:01244171888" className="btn-primary justify-center text-sm">
                <Phone size={14} />
                0124-4171 888
              </a>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
