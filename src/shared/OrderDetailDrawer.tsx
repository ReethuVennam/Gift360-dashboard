import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Drawer } from "./Drawer";
import { RegenerateVoucherButton } from "./RegenerateVoucherButton";
import { useToast } from "./ToastContext";
import { api, ApiError } from "../lib/api";

interface OrderDetailHeader {
  order_number: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  client_name: string;
  client_email: string;
  client_mobile: string;
  wallet_used: boolean;
  wallet_amount: number;
  payment_method: string;
}

interface OrderDetailItem {
  order_item_id: string;
  brand_name: string;
  line_total: number;
  last_evc_response_code: string | null;
  last_evc_response_msg: string | null;
}

function statusBadgeClass(status: string): string {
  const s = status?.toUpperCase();
  if (s === "PAID" || s === "SUCCESS" || s === "GENERATED") return "success";
  if (s === "PENDING" || s === "NOT_APPLICABLE_PENDING") return "warning";
  return "critical";
}

interface OrderDetailDrawerProps {
  orderNumber: string | null;
  open: boolean;
  onClose: () => void;
}

export function OrderDetailDrawer({ orderNumber, open, onClose }: OrderDetailDrawerProps) {
  const toast = useToast();
  const [detail, setDetail] = useState<[OrderDetailHeader, OrderDetailItem[], unknown[], unknown[]] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    setDetailLoading(true);
    setDetail(null);
    api
      .get<{ data: [OrderDetailHeader, OrderDetailItem[], unknown[], unknown[]] }>(`/orders/${orderNumber}`)
      .then((res) => setDetail(res.data))
      .catch((err) => toast(err instanceof ApiError ? err.message : "Failed to load order detail", "err"))
      .finally(() => setDetailLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  const header = detail?.[0];
  const items = detail?.[1] ?? [];
  const needsVoucherRegeneration =
    !!header && (header.status?.toUpperCase() === "PAID" || header.status?.toUpperCase() === "SUCCESS") && items.length > 0;

  return (
    <Drawer open={open} onClose={onClose}>
      <div className="drawer-head">
        <div>
          <div className="dim" style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".06em" }}>Order detail</div>
          <h3 className="mono" style={{ fontSize: "16px", marginTop: "2px" }}>{orderNumber}</h3>
        </div>
        <button className="icon-btn" onClick={onClose}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div className="drawer-body">
        {detailLoading && <p className="dim">Loading…</p>}
        {!detailLoading && header && (
          <>
            <div className="drawer-section">
              <h4>Status</h4>
              <div className="flex gap-8">
                <span className={"badge " + statusBadgeClass(header.status)}>{header.status}</span>
                <span className="badge info">{header.payment_method}</span>
              </div>
            </div>
            <div className="drawer-section">
              <h4>Customer</h4>
              <div className="kv-list">
                <div className="kv-row"><span className="k">Customer</span><span className="v">{header.client_name}</span></div>
                <div className="kv-row"><span className="k">Contact</span><span className="v">{header.client_email} · {header.client_mobile}</span></div>
                <div className="kv-row"><span className="k">Placed</span><span className="v">{new Date(header.created_at).toLocaleString()}</span></div>
              </div>
            </div>
            <div className="drawer-section">
              <h4>Payment breakdown</h4>
              <div className="kv-list">
                <div className="kv-row"><span className="k">Wallet used</span><span className="v">₹{header.wallet_amount}</span></div>
              </div>
            </div>
            <div className="drawer-section">
              <h4>Items</h4>
              <div className="kv-list">
                {items.map((it) => (
                  <div className="kv-row" key={it.order_item_id}>
                    <span className="k">{it.brand_name}</span>
                    <span className="v">
                      ₹{it.line_total}
                      {it.last_evc_response_msg && <> — <span className="dim">{it.last_evc_response_msg}</span></>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="drawer-section">
              <h4>Actions</h4>
              <div className="flex gap-8">
                {needsVoucherRegeneration && (
                  <RegenerateVoucherButton orderNumber={orderNumber!} orderItemId={items[0].order_item_id} />
                )}
                <Link className="btn btn-sm" to="/exceptions"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg> Open in Exceptions</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
