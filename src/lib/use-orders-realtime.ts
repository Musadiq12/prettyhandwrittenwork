import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useOrdersRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const code = (payload.new as { order_code?: string }).order_code;
          toast.success(`New order received${code ? `: ${code}` : ""}`);
        }
        void qc.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);
}
