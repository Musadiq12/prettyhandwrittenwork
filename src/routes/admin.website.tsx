import { createFileRoute } from "@tanstack/react-router";
import { SiteContentEditor } from "@/components/admin/SiteContentEditor";

export const Route = createFileRoute("/admin/website")({
  component: WebsiteContentPage,
});

function WebsiteContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-hand text-4xl font-bold">Website</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage the public homepage, images, contact links, SEO, services, pricing messages, FAQ and testimonials.</p>
      </div>
      <SiteContentEditor />
    </div>
  );
}
