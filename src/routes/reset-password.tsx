import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password | Pretty Handwritten Work" },
      { name: "description", content: "Set a new password." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Use at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/admin" });
  };
  return (
    <main className="ruled flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-paper">
        <h1 className="font-hand text-4xl font-bold">New password</h1>
        <div><Label htmlFor="p1">New password</Label><Input id="p1" type="password" autoComplete="new-password" className="h-12" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><Label htmlFor="p2">Confirm password</Label><Input id="p2" type="password" autoComplete="new-password" className="h-12" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </main>
  );
}
