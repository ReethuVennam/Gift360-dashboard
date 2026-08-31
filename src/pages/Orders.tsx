import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RequireButton } from "../shared/RequireButton";
import { Drawer } from "../shared/Drawer";
import { useToast } from "../shared/ToastContext";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface OrderRow {
  order_id: string;
  order_number: string;
  client_name: string;
  client_email: string;
  client_mobile: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  wallet_used: boolean;
  wallet_amount: number;
  payment_method: string;
  coins_earned: number;
  coins_redeemed: number;
  brand_name: string;
  voucher_status: string;
  order_item_id: string;
}

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

const VOUCHER_STATUSES = ["GENERATED", "FAILED", "NOT_APPLICABLE_PENDING", "NOT_APPLICABLE_FAILED"];
const PAYMENT_METHODS = ["UPI", "CARD", "WALLET"];

export function Orders() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [page, setPage] = useState(0);

  const list = useFetch(
    () =>
      api.get<{ data: OrderRow[]; page: number; size: number }>("/orders", {
        search: search || undefined,
        voucherStatus: voucherStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        page,
        size: 50,
      }),
    [search, voucherStatus, paymentMethod, page]
  );

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<[OrderDetailHeader, OrderDetailItem[], unknown[], unknown[]] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!selectedOrder) return;
    setDetailLoading(true);
    setDetail(null);
    api
      .get<{ data: [OrderDetailHeader, OrderDetailItem[], unknown[], unknown[]] }>(`/orders/${selectedOrder}`)
      .then((res) => setDetail(res.data))
      .catch((err) => toast(err instanceof ApiError ? err.message : "Failed to load order detail", "err"))
      .finally(() => setDetailLoading(false));
  }, [selectedOrder]);

  const header = detail?.[0];
  const items = detail?.[1] ?? [];

  async function onRetry() {
    if (!selectedOrder || items.length === 0) return;
    setRetrying(true);
    try {
      await api.post("/vouchers/retry", {
        orderNumber: selectedOrder,
        orderItemId: items[0].order_item_id,
        reason: "Retried from admin dashboard",
      });
      toast("Retry queued for " + selectedOrder + ".");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Retry failed", "err");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <>
      <div className="panel">
        <div className="filterbar">
          <select className="select" value={voucherStatus} onChange={(e) => { setPage(0); setVoucherStatus(e.target.value); }}>
            <option value="">All voucher statuses</option>
            {VOUCHER_STATUSES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select className="select" value={paymentMethod} onChange={(e) => { setPage(0); setPaymentMethod(e.target.value); }}>
            <option value="">All payment methods</option>
            {PAYMENT_METHODS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input
              className="input"
              placeholder="Order #, customer, mobile or client ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setPage(0); setSearch(searchInput); }
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(0); setSearch(searchInput); }}>Search</button>
        </div>

        {list.error && <div className="impact-box"><span>{list.error}</span></div>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th><th>Timestamp</th><th>Customer</th><th>Brand</th>
                <th>Payment</th><th>Wallet Used</th><th>Coins Earned</th>
                <th>Total</th><th>Voucher</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.loading && (
                <tr><td colSpan={10} className="dim">Loading…</td></tr>
              )}
              {!list.loading && (list.data?.data.length ?? 0) === 0 && (
                <tr><td colSpan={10} className="dim">No orders found.</td></tr>
              )}
              {list.data?.data.map((row) => (
                <tr
                  key={row.order_id}
                  onClick={() => {
                    setSelectedOrder(row.order_number);
                    setDrawerOpen(true);
                  }}
                >
                  <td className="id-cell">{row.order_number}</td>
                  <td className="num muted">{new Date(row.created_at).toLocaleString()}</td>
                  <td>{row.client_name}</td>
                  <td>{row.brand_name}</td>
                  <td><span className="badge info">{row.payment_method}</span></td>
                  <td className="num">₹{row.wallet_amount}</td>
                  <td className="num">{row.coins_earned ?? "—"}</td>
                  <td className="num">₹{row.total_amount}</td>
                  <td><span className={"badge " + statusBadgeClass(row.voucher_status)}>{row.voucher_status}</span></td>
                  <td><span className={"badge " + statusBadgeClass(row.order_status)}>{row.order_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>Page <b className="mono">{page + 1}</b></span>
          <div className="pager-btns">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <svg className="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button
              disabled={(list.data?.data.length ?? 0) < 50}
              onClick={() => setPage((p) => p + 1)}
            >
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="drawer-head">
          <div>
            <div className="dim" style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".06em" }}>Order detail</div>
            <h3 className="mono" style={{ fontSize: "16px", marginTop: "2px" }}>{selectedOrder}</h3>
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
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
                  <RequireButton requires="vouchers:retry" className="btn btn-primary btn-sm" disabled={retrying} onClick={onRetry}>
                    <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg> {retrying ? "Retrying…" : "Retry voucher"}
                  </RequireButton>
                  <Link className="btn btn-sm" to="/exceptions"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg> Open in Exceptions</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
}
