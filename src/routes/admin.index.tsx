import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, ListOrdered, MessageSquareQuote, Settings, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersQuery, inr, fmtDate, daysUntil, STATUS_CLASS } from "@/lib/admin";
import { useOrdersRealtime } from "@/lib/use-orders-realtime";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  useOrdersRealtime();
  const { data, isLoading, error } = useQuery(ordersQuery);
  useEffect(() => { if (error) toast.error("Couldn't load orders."); }, [error]);

  const now = new Date();
  const thisMonth = (d: string) => { const x = new Date(d); return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth(); };
  const o = data ?? [];
  const cards = [
    { label: "New orders", value: o.filter((x) => x.status === "new").length },
    { label: "In progress", value: o.filter((x) => x.status === "confirmed" || x.status === "writing").length },
    { label: "Ready to dispatch", value: o.filter((x) => x.status === "ready").length },
    { label: "Delivered this month", value: o.filter((x) => x.status === "delivered" && thisMonth(x.updated_at)).length },
    { label: "Est. revenue this month", value: inr(o.filter((x) => x.status !== "cancelled" && thisMonth(x.created_at)).reduce((s, x) => s + Number(x.estimated_total), 0)) },
  ];
  const attention = o
    .filter((x) => ["new", "confirmed", "writing"].includes(x.status) && daysUntil(x.deadline) <= 3)
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

  return (
    <div className="space-y-8">
      <h1 className="font-hand text-4xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            {isLoading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 text-2xl font-semibold">{c.value}</p>}
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" />Needs attention</h2>
        {isLoading ? <Skeleton className="h-24" /> : attention.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">Nothing urgent. No unfinished orders due in the next 3 days.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {attention.map((x) => {
              const d = daysUntil(x.deadline);
              return (
                <li key={x.id}>
                  <Link to="/admin/orders" search={{ open: x.id }} className="flex items-center justify-between gap-3 p-3 hover:bg-muted">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{x.order_code} · {x.name}</p>
                      <p className="text-xs text-muted-foreground">{x.work_type} · due {fmtDate(x.deadline)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Badge variant="outline" className={STATUS_CLASS[x.status]}>{x.status}</Badge>
                      <Badge className={d <= 1 ? "bg-destructive text-destructive-foreground" : "bg-warn text-foreground"}>
                        {d < 0 ? `${-d}d overdue` : d === 0 ? "today" : `${d}d left`}
                      </Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Quick actions</h2>
          <p className="text-sm text-muted-foreground">Manage the parts of your website that customers see.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { to: "/admin/orders" as const, label: "Manage orders", detail: "Review requests and update progress", icon: ListOrdered },
            { to: "/admin/testimonials" as const, label: "Manage testimonials", detail: "Add genuine feedback and control publishing", icon: MessageSquareQuote },
            { to: "/admin/settings" as const, label: "Website settings", detail: "Update prices, contact and payment details", icon: Settings },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary"><item.icon className="size-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold">{item.label}<ArrowUpRight className="size-3.5 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
