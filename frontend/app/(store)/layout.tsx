import { HeaderSSR } from "@/components/HeaderSSR";
import { FooterSSR } from "@/components/FooterSSR";

export const dynamic = "force-dynamic";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <HeaderSSR />
      {children}
      <FooterSSR />
    </div>
  );
}
