import { useState } from "react";
import { useAuth } from "./AuthContext";
import { requiresTitle } from "./rbac";
import { useToast } from "./ToastContext";
import { api, ApiError } from "../lib/api";

interface RegenerateVoucherButtonProps {
  orderNumber: string;
  orderItemId?: string;
  resolveOrderItemId?: () => Promise<string>;
  onRegenerated?: () => void;
}

const REQUIRES = "vouchers:retry:request";

export function RegenerateVoucherButton({ orderNumber, orderItemId, resolveOrderItemId, onRegenerated }: RegenerateVoucherButtonProps) {
  const toast = useToast();
  const { can } = useAuth();
  const allowed = can(REQUIRES);
  const [state, setState] = useState<"idle" | "submitting" | "pending">("idle");

  async function handleClick() {
    if (state !== "idle") return;
    setState("submitting");
    try {
      const itemId = orderItemId ?? (await resolveOrderItemId?.());
      if (!itemId) throw new Error("Could not resolve the order item to regenerate.");
      await api.post("/vouchers/retry-requests", {
        orderNumber,
        orderItemId: itemId,
        reason: "Regenerate requested from admin dashboard",
      });
      setState("pending");
      toast("Regeneration request submitted for " + orderNumber + " — awaiting approval.");
      onRegenerated?.();
    } catch (err) {
      setState("idle");
      toast(err instanceof ApiError ? err.message : "Request failed", "err");
    }
  }

  if (state === "pending") {
    return <button className="btn btn-sm btn-warning" disabled>Awaiting Approval</button>;
  }

  return (
    <button
      className="btn btn-sm btn-danger"
      disabled={!allowed || state === "submitting"}
      title={!allowed ? requiresTitle(REQUIRES) : undefined}
      onClick={handleClick}
    >
      {state === "submitting" ? "Submitting…" : "Regenerate Voucher"}
    </button>
  );
}
