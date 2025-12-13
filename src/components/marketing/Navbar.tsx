"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { landingContent } from "@/data/landingContent";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { brand, nav } = landingContent;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container-wide mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                M
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">
              {brand.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href={nav.cta.login.href}>
              <Button variant="ghost" size="sm">
                {nav.cta.login.label}
              </Button>
            </Link>
            <Link href={nav.cta.signup.href}>
              <Button variant="default" size="sm">
                {nav.cta.signup.label}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {nav.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link href={nav.cta.login.href}>
                  <Button variant="outline" className="w-full">
                    {nav.cta.login.label}
                  </Button>
                </Link>
                <Link href={nav.cta.signup.href}>
                  <Button variant="default" className="w-full">
                    {nav.cta.signup.label}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
