"use client";

import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type PageLayoutProps = {
  children: ReactNode;
  /** When false, no header/footer (e.g. admin or auth pages). Default true. */
  withLayout?: boolean;
  /** Optional custom header (e.g. HeaderSSR for server). If withLayout true and header not provided, uses default Header. */
  header?: ReactNode;
  /** Optional custom footer. If withLayout true and footer not provided, uses default Footer. */
  footer?: ReactNode;
  /** Extra class for the outer wrapper */
  className?: string;
};

export default function PageLayout({
  children,
  withLayout = true,
  header,
  footer,
  className = "",
}: PageLayoutProps) {
  const showHeader = withLayout && (header !== null);
  const showFooter = withLayout && (footer !== null);
  const HeaderComponent = header !== undefined ? header : <Header />;
  const FooterComponent = footer !== undefined ? footer : <Footer />;

  return (
    <div className={`min-h-screen bg-white ${className}`.trim()}>
      {showHeader && HeaderComponent}
      {children}
      {showFooter && FooterComponent}
    </div>
  );
}
