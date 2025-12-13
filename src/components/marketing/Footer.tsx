import Link from "next/link";
import { landingContent } from "@/data/landingContent";

export function Footer() {
  const { brand, footer } = landingContent;

  return (
    <footer className="border-t border-border">
      <div className="container-wide mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  M
                </span>
              </div>
              <span className="text-xl font-bold text-foreground">
                {brand.name}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {footer.description}
            </p>
            <div className="flex gap-3">
              {footer.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                  aria-label={`Visite nosso ${social.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-xs font-medium uppercase" aria-hidden="true">
                    {social.icon}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footer.links).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {footer.bottom.copyright}
          </p>
          <div className="flex items-center gap-6">
            {footer.bottom.legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
