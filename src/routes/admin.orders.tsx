import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Search, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ordersQuery, STATUSES, STATUS_CLASS, inr, fmtDate, type Order } from "@/lib/admin";
import { DELIVERY_LABELS } from "@/lib/settings";
import { useOrdersRealtime } from "@/lib/use-orders-realtime";
import { OrderSheet } from "@/components/admin/OrderSheet";

export const Route = createFileRoute("/admin/orders")({
  validateSearch: z.object({ open: z.string().optional() }),
  component: OrdersPage,
});

const PAGE = 20;

function OrdersPage() {
  useOrdersRealtime();
  const { open } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/orders" });
  const { data, isLoading, error } = useQuery(ordersQuery);
  useEffect(() => { if (error) toast.error("Couldn't load orders."); }, [error]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [q, status, delivery, sort]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = (data ?? []).filter((o) =>
      (status === "all" || o.status === status) &&
      (delivery === "all" || o.delivery_type === delivery) &&
      (!term || [o.order_code, o.name, o.phone, o.city].some((v) => v.toLowerCase().includes(term))));
    if (sort === "deadline") r = [...r].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
    return r;
  }, [data, q, status, delivery, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const selected = (data ?? []).find((o) => o.id === open) ?? null;
  const setOpen = (id?: string) => navigate({ search: id ? { open: id } : {} });

  return (
    <div className="space-y-4">
      <h1 className="font-hand text-4xl font-bold">Orders</h1>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search orders" placeholder="Code, name, number, city" className="h-11 pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={delivery} onValueChange={setDelivery}>
          <SelectTrigger className="h-11" aria-label="Filter by delivery"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All delivery types</SelectItem>{Object.entries(DELIVERY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-11" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="deadline">By deadline</SelectItem></SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          <Inbox className="size-8" />{data?.length ? "No orders match these filters." : "No orders yet. They'll appear here as soon as customers order."}
        </div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {view.map((o) => (
              <li key={o.id}>
                <button onClick={() => setOpen(o.id)} className="w-full rounded-xl border bg-card p-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{o.order_code}</span>
                    <StatusBadge o={o} />
                  </div>
                  <p className="mt-1 text-sm">{o.name} · {o.work_type}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{o.pages} pages</span><span>{DELIVERY_LABELS[o.delivery_type as keyof typeof DELIVERY_LABELS] ?? o.delivery_type}</span>
                    <span>Due {fmtDate(o.deadline)}</span><span>{inr(o.estimated_total)}</span><PdfBadge o={o} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Work</TableHead><TableHead>Pages</TableHead>
                <TableHead>Delivery</TableHead><TableHead>Deadline</TableHead><TableHead>Est.</TableHead><TableHead>Status</TableHead><TableHead>PDF</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {view.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpen(o.id)}>
                    <TableCell className="font-medium">{o.order_code}</TableCell>
                    <TableCell>{o.name}</TableCell>
                    <TableCell className="max-w-40 truncate">{o.work_type}</TableCell>
                    <TableCell>{o.pages}</TableCell>
                    <TableCell>{DELIVERY_LABELS[o.delivery_type as keyof typeof DELIVERY_LABELS] ?? o.delivery_type}</TableCell>
                    <TableCell>{fmtDate(o.deadline)}</TableCell>
                    <TableCell>{inr(o.estimated_total)}</TableCell>
                    <TableCell><StatusBadge o={o} /></TableCell>
                    <TableCell><PdfBadge o={o} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{rows.length} orders</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <span>{page + 1} / {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
      <OrderSheet order={selected} onClose={() => setOpen()} />
    </div>
  );
}

function StatusBadge({ o }: { o: Order }) {
  return <Badge variant="outline" className={`capitalize ${STATUS_CLASS[o.status]}`}>{o.status}</Badge>;
}
function PdfBadge({ o }: { o: Order }) {
  return o.pdf_paths.length
    ? <Badge variant="outline" className={STATUS_CLASS.ready}>PDF ✓</Badge>
    : <Badge variant="outline" className="text-muted-foreground">No PDF</Badge>;
}
