import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, MessageSquareQuote, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { testimonialsQuery, type Testimonial } from "@/lib/testimonials";

export const Route = createFileRoute("/admin/testimonials")({ component: TestimonialsPage });

const schema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name or approved display name.").max(80),
  education: z.string().trim().max(120, "Keep the course or institution under 120 characters."),
  quote: z.string().trim().min(10, "Feedback must be at least 10 characters.").max(600, "Keep feedback under 600 characters."),
  rating: z.coerce.number().int().min(1).max(5),
  sort_order: z.coerce.number().int().min(0).max(10000),
  is_published: z.boolean(),
});
type FormValues = z.infer<typeof schema>;
const emptyForm: FormValues = { name: "", education: "", quote: "", rating: 5, sort_order: 0, is_published: false };

function TestimonialsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(testimonialsQuery);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  useEffect(() => {
    if (error) toast.error("Couldn't load testimonials. Confirm the database migration has been applied.");
  }, [error]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setErrors({}); };

  const edit = (item: Testimonial) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      education: item.education ?? "",
      quote: item.quote,
      rating: item.rating,
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setErrors({});
    document.getElementById("testimonial-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      toast.error("Check the highlighted fields.");
      return;
    }
    setBusy(true);
    const payload = { ...parsed.data, education: parsed.data.education || "" };
    const result = editingId
      ? await supabase.from("testimonials").update(payload).eq("id", editingId).select("id").maybeSingle()
      : await supabase.from("testimonials").insert(payload).select("id").maybeSingle();
    setBusy(false);
    if (result.error || !result.data) {
      toast.error("Couldn't save testimonial. " + (result.error?.message ?? "Check admin permissions."));
      return;
    }
    toast.success(editingId ? "Testimonial updated." : "Testimonial added.");
    resetForm();
    await qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    await qc.invalidateQueries({ queryKey: ["published-testimonials"] });
  };

  const togglePublished = async (item: Testimonial, value: boolean) => {
    const { error: updateError } = await supabase.from("testimonials").update({ is_published: value }).eq("id", item.id);
    if (updateError) { toast.error("Couldn't update publishing status. " + updateError.message); return; }
    toast.success(value ? "Testimonial published on the website." : "Testimonial hidden from the website.");
    await qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    await qc.invalidateQueries({ queryKey: ["published-testimonials"] });
  };

  const remove = async () => {
    if (!deleteTarget) return;
    const { error: deleteError } = await supabase.from("testimonials").delete().eq("id", deleteTarget.id);
    if (deleteError) { toast.error("Couldn't delete testimonial. " + deleteError.message); return; }
    toast.success("Testimonial deleted.");
    setDeleteTarget(null);
    if (editingId === deleteTarget.id) resetForm();
    await qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    await qc.invalidateQueries({ queryKey: ["published-testimonials"] });
  };

  const items = data ?? [];
  const publishedCount = items.filter((item) => item.is_published).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Website content</p>
          <h1 className="mt-1 font-hand text-4xl font-bold">Testimonials</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage customer feedback shown on the public homepage. Only published testimonials are visible to visitors.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">{items.length} total</Badge>
          <Badge className="px-3 py-1">{publishedCount} published</Badge>
        </div>
      </header>

      <section id="testimonial-editor" className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary"><MessageSquareQuote className="size-5" /></span>
          <div>
            <h2 className="font-semibold">{editingId ? "Edit testimonial" : "Add a testimonial"}</h2>
            <p className="text-xs text-muted-foreground">Use genuine customer feedback and get permission before publishing.</p>
          </div>
        </div>
        <form onSubmit={(e) => void save(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="testimonial-name">Customer display name</Label>
              <Input id="testimonial-name" className="mt-1 h-11" maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="testimonial-education">Course / class / institution (optional)</Label>
              <Input id="testimonial-education" className="mt-1 h-11" maxLength={120} value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} aria-invalid={!!errors.education} />
              {errors.education && <p className="mt-1 text-xs text-destructive">{errors.education}</p>}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="testimonial-quote">Customer feedback</Label>
              <span className="text-xs text-muted-foreground">{form.quote.length}/600</span>
            </div>
            <Textarea id="testimonial-quote" className="mt-1 min-h-28" maxLength={600} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} aria-invalid={!!errors.quote} />
            {errors.quote && <p className="mt-1 text-xs text-destructive">{errors.quote}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="testimonial-rating">Rating</Label>
              <select id="testimonial-rating" className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="testimonial-order">Display order</Label>
              <Input id="testimonial-order" className="mt-1 h-11" type="number" min={0} max={10000} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} aria-invalid={!!errors.sort_order} />
              {errors.sort_order && <p className="mt-1 text-xs text-destructive">{errors.sort_order}</p>}
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label htmlFor="testimonial-published">Publish on website</Label>
                <p className="mt-1 text-xs text-muted-foreground">{form.is_published ? "Visible to visitors" : "Saved privately"}</p>
              </div>
              <Switch id="testimonial-published" checked={form.is_published} onCheckedChange={(value) => setForm({ ...form, is_published: value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : <><Plus className="mr-2 size-4" />Add testimonial</>}</Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm} disabled={busy}>Cancel editing</Button>}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Saved testimonials</h2>
          <p className="text-sm text-muted-foreground">Changes are saved to the database and reflected on the public site.</p>
        </div>
        {isLoading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          : error ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">Testimonials could not be loaded. Apply the testimonials database migration, then refresh this page.</div>
          : items.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><MessageSquareQuote className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No testimonials yet</p><p className="mt-1 text-sm text-muted-foreground">Add genuine customer feedback above. New entries remain private until published.</p></div>
          : <div className="grid gap-3 lg:grid-cols-2">
            {items.map((item) => (
              <article key={item.id} className="rounded-xl border bg-card p-4 transition hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant={item.is_published ? "default" : "outline"}>{item.is_published ? "Published" : "Draft"}</Badge>
                    </div>
                    {item.education && <p className="mt-1 text-xs text-muted-foreground">{item.education}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: item.rating }, (_, i) => <Star key={i} className="size-3.5 fill-current text-primary" aria-hidden />)}
                  </div>
                </div>
                <blockquote className="mt-3 whitespace-pre-wrap text-sm leading-6">“{item.quote}”</blockquote>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">Display order: {item.sort_order}</span>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => void togglePublished(item, !item.is_published)} aria-label={item.is_published ? "Hide testimonial" : "Publish testimonial"}>
                      {item.is_published ? <><EyeOff className="mr-1.5 size-3.5" />Hide</> : <><Eye className="mr-1.5 size-3.5" />Publish</>}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => edit(item)} aria-label="Edit testimonial"><Pencil className="size-3.5" /></Button>
                    <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)} aria-label="Delete testimonial"><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>}
      </section>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the testimonial from the database and the public website. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void remove(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete testimonial</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
