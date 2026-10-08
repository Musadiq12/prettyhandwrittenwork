import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const STATUSES: OrderStatus[] = ["new", "confirmed", "writing", "ready", "dispatched", "delivered", "cancelled"];

export const STATUS_CLASS: Record<OrderStatus, string> = {
  new: "bg-st-new/15 text-st-new border-st-new/30",
  confirmed: "bg-st-confirmed/15 text-st-confirmed border-st-confirmed/30",
  writing: "bg-st-writing/20 text-foreground border-st-writing/50",
  ready: "bg-st-ready/15 text-st-ready border-st-ready/30",
  dispatched: "bg-st-dispatched/15 text-st-dispatched border-st-dispatched/30",
  delivered: "bg-st-delivered/15 text-st-delivered border-st-delivered/30",
  cancelled: "bg-st-cancelled/15 text-st-cancelled border-st-cancelled/30",
};

export const ordersQuery = queryOptions({
  queryKey: ["admin-orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const inr = (n: number | null | undefined) => (n == null ? "—" : `₹${Number(n).toLocaleString("en-IN")}`);
export const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function daysUntil(d: string | null) {
  if (!d) return Infinity;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(d + "T00:00:00").getTime() - today.getTime()) / 86400000);
}
