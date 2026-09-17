import { SiteFooter } from "@/src/components/home/SiteFooter";
import { SiteNav } from "@/src/components/home/SiteNav";
import { PreviewInvite } from "@/src/components/preview/PreviewInvite";

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <SiteNav />
      <PreviewInvite />
      <SiteFooter />
    </div>
  );
}
