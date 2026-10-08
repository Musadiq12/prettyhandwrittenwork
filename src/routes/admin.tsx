import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ListOrdered, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin | Pretty Handwritten Work" },
      { name: "description", content: "Owner admin panel." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

type Gate = "loading" | "signed-out" | "denied" | "admin";
const IDLE_MS = 60 * 60 * 1000;

function AdminLayout() {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) return setGate("signed-out");
      const { data, error } = await supabase.rpc("has_role", { _user_id: s.user.id, _role: "admin" });
      if (error || !data) {
        await supabase.auth.signOut();
        setGate("denied");
        return;
      }
      setGate("admin");
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => void check(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => check(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async (reason?: string) => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setGate("signed-out");
    if (reason) toast.info(reason);
  };

  // Auto sign-out after 60 minutes of inactivity
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (gate !== "admin") return;
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void logout("Signed out after 60 minutes of inactivity."), IDLE_MS);
    };
    const evs = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      evs.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate]);

  if (gate === "loading") return <div className="mx-auto max-w-sm space-y-3 p-10"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>;
  if (gate !== "admin") return <Login denied={gate === "denied"} onRetry={() => setGate("signed-out")} />;

  const tabs = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/orders", label: "Orders", icon: ListOrdered, exact: false },
    { to: "/admin/settings", label: "Settings", icon: Settings, exact: false },
  ] as const;

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <p className="mb-6 font-hand text-2xl font-bold">PHW Admin</p>
        <nav className="flex flex-1 flex-col gap-1">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} activeOptions={{ exact: t.exact }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              activeProps={{ className: "bg-secondary font-semibold" }}>
              <t.icon className="size-4" />{t.label}
            </Link>
          ))}
        </nav>
        <p className="mb-2 truncate text-xs text-muted-foreground">{session?.user.email}</p>
        <Button variant="outline" size="sm" onClick={() => void logout()}><LogOut className="size-4" />Log out</Button>
      </aside>

      <div className="flex-1 pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <p className="font-hand text-2xl font-bold">PHW Admin</p>
          <Button variant="outline" size="sm" onClick={() => void logout()}><LogOut className="size-4" />Log out</Button>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-card md:hidden">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: t.exact }}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground"
            activeProps={{ className: "text-foreground font-semibold" }}>
            <t.icon className="size-5" />{t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Login({ denied, onRetry }: { denied: boolean; onRetry: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    onRetry();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error("Wrong email or password.");
  };
  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("If that email is registered, a reset link is on its way."); setForgot(false); }
  };

  return (
    <main className="ruled flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-paper">
        <h1 className="font-hand text-4xl font-bold">{forgot ? "Reset password" : "Owner login"}</h1>
        {denied && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Access denied. This account is not an admin.</p>}
        <form onSubmit={forgot ? sendReset : signIn} className="mt-5 space-y-4">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" className="h-12" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {!forgot && <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete="current-password" className="h-12" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>}
          <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : "Log in"}</Button>
        </form>
        <button type="button" onClick={() => setForgot(!forgot)} className="mt-4 text-sm underline underline-offset-4">
          {forgot ? "Back to login" : "Forgot password?"}
        </button>
      </div>
    </main>
  );
}
