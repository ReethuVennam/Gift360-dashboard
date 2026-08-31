import { useState } from "react";
import { RequireButton } from "../shared/RequireButton";
import { Modal, CloseIcon } from "../shared/Modal";
import { useToast } from "../shared/ToastContext";
import { CountUp } from "../shared/CountUp";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface FailedVoucher {
  order_number: string;
  order_item_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  brand_code: string;
  brand_name: string;
  quantity: number;
  last_evc_response_msg: string | null;
  last_evc_attempt_at: string | null;
  paid_at: string | null;
  order_status: string;
}

interface RetryEligible {
  original_order_number: string;
  order_item_id: string;
  brand_id: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  line_total: number;
  order_paid_at: string;
}

interface RetryMetrics {
  eligible_order_count: number;
  eligible_item_count: number;
}

type ListMode = "failed" | "retry-eligible";

function orderStatusBadgeClass(status: string): string {
  const s = status?.toUpperCase();
  if (s === "PAID") return "success";
  if (s === "PENDING") return "warning";
  return "critical";
}

export function Vouchers() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"generation" | "config">("generation");
  const [listMode, setListMode] = useState<ListMode>("failed");
  const [search, setSearch] = useState("");

  const failed = useFetch(() => api.get<{ data: FailedVoucher[] }>("/vouchers/failed", { page: 0, size: 50 }), []);
  const retryEligible = useFetch(() => api.get<{ data: RetryEligible[] }>("/vouchers/retry-eligible"), []);
  const metrics = useFetch(() => api.get<{ data: RetryMetrics }>("/vouchers/retry-metrics"), []);

  const [retryOpen, setRetryOpen] = useState(false);
  const [retryTarget, setRetryTarget] = useState<{ orderNumber: string; orderItemId: string } | null>(null);
  const [retryReason, setRetryReason] = useState("");
  const [retrying, setRetrying] = useState(false);

  function openRetry(orderNumber: string, orderItemId: string) {
    setRetryTarget({ orderNumber, orderItemId });
    setRetryReason("");
    setRetryOpen(true);
  }

  async function confirmRetry() {
    if (!retryTarget) return;
    setRetrying(true);
    try {
      await api.post("/vouchers/retry", { orderNumber: retryTarget.orderNumber, orderItemId: retryTarget.orderItemId, reason: retryReason });
      setRetryOpen(false);
      toast("Retry queued for " + retryTarget.orderNumber + ". (Status reset — actual re-generation runs on the original backend.)");
      failed.refetch();
      retryEligible.refetch();
      metrics.refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Retry failed", "err");
    } finally {
      setRetrying(false);
    }
  }

  const failedRows = (failed.data?.data ?? []).filter(
    (r) => !search || r.order_number.toLowerCase().includes(search.toLowerCase()) || r.client_name.toLowerCase().includes(search.toLowerCase())
  );
  const eligibleRows = (retryEligible.data?.data ?? []).filter(
    (r) => !search || r.original_order_number.toLowerCase().includes(search.toLowerCase()) || r.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="tabs">
        <a className={"tab" + (activeTab === "generation" ? " active" : "")} href="#generation" onClick={(e) => { e.preventDefault(); setActiveTab("generation"); }}>
          Voucher Generation
        </a>
        <a className={"tab" + (activeTab === "config" ? " active" : "")} href="#config" onClick={(e) => { e.preventDefault(); setActiveTab("config"); }}>
          Discount Configuration
        </a>
      </div>

      {activeTab === "generation" && (
        <div style={{ marginTop: "18px" }}>
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Failed (this page)</div><CountUp target={failed.data?.data.length ?? 0} className="kpi-value" /></div>
            <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">Retry-eligible orders</div><CountUp target={metrics.data?.data.eligible_order_count ?? 0} className="kpi-value" /></div>
            <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">Retry-eligible items</div><CountUp target={metrics.data?.data.eligible_item_count ?? 0} className="kpi-value" /></div>
          </div>

          <div className="panel">
            <div className="filterbar">
              <div className="chip-group">
                <span className={"chip" + (listMode === "failed" ? " active" : "")} onClick={() => setListMode("failed")}>Failed</span>
                <span className={"chip" + (listMode === "retry-eligible" ? " active" : "")} onClick={() => setListMode("retry-eligible")}>Retry-eligible</span>
              </div>
              <div className="search-wrap grow">
                <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input className="input" placeholder="Order ID or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            {(listMode === "failed" ? failed.error : retryEligible.error) && (
              <div className="impact-box"><span>{listMode === "failed" ? failed.error : retryEligible.error}</span></div>
            )}
            <div className="table-wrap">
              <table className="data-table">
                {listMode === "failed" ? (
                  <>
                    <thead><tr><th>Order</th><th>Customer</th><th>Email</th><th>Brand</th><th>Qty</th><th>Failure reason</th><th>Last attempt</th><th>Paid at</th><th>Order status</th><th></th></tr></thead>
                    <tbody>
                      {failed.loading && <tr><td colSpan={10} className="dim">Loading…</td></tr>}
                      {!failed.loading && failedRows.length === 0 && <tr><td colSpan={10} className="dim">No failed vouchers.</td></tr>}
                      {failedRows.map((r) => (
                        <tr key={r.order_item_id}>
                          <td className="id-cell">{r.order_number}</td>
                          <td>
                            <b>{r.client_name}</b><br /><span className="muted mono" style={{ fontSize: "11px" }}>{r.client_id}</span>
                          </td>
                          <td className="mono">{r.client_email}</td>
                          <td>{r.brand_name}<br /><span className="muted mono" style={{ fontSize: "11px" }}>{r.brand_code}</span></td>
                          <td className="num">{r.quantity}</td>
                          <td className="muted">{r.last_evc_response_msg ?? "—"}</td>
                          <td className="num muted">{r.last_evc_attempt_at ? new Date(r.last_evc_attempt_at).toLocaleString() : "—"}</td>
                          <td className="num muted">{r.paid_at ? new Date(r.paid_at).toLocaleString() : "—"}</td>
                          <td><span className={"badge " + orderStatusBadgeClass(r.order_status)}>{r.order_status}</span></td>
                          <td>
                            <RequireButton requires="vouchers:retry" className="btn btn-sm" onClick={() => openRetry(r.order_number, r.order_item_id)}>
                              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg> Retry
                            </RequireButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead><tr><th>Order</th><th>Customer</th><th>Email</th><th>Mobile</th><th>Brand</th><th>Qty</th><th>Line total</th><th>Paid at</th><th></th></tr></thead>
                    <tbody>
                      {retryEligible.loading && <tr><td colSpan={9} className="dim">Loading…</td></tr>}
                      {!retryEligible.loading && eligibleRows.length === 0 && <tr><td colSpan={9} className="dim">No retry-eligible items.</td></tr>}
                      {eligibleRows.map((r) => (
                        <tr key={r.order_item_id}>
                          <td className="id-cell">{r.original_order_number}</td>
                          <td>{r.customer_name}</td>
                          <td className="mono">{r.customer_email}</td>
                          <td className="mono">{r.customer_mobile}</td>
                          <td>{r.brand_id}</td>
                          <td className="num">{r.quantity}</td>
                          <td className="num">₹{r.line_total}</td>
                          <td className="num muted">{new Date(r.order_paid_at).toLocaleString()}</td>
                          <td>
                            <RequireButton requires="vouchers:retry" className="btn btn-sm" onClick={() => openRetry(r.original_order_number, r.order_item_id)}>
                              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg> Retry
                            </RequireButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <div>
          <div className="section-head">
            <h2>Voucher discount configuration</h2>
          </div>
          <div className="impact-box">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>
            <span>Not backend-supported yet — the admin API's config types are <code>supercoin</code>, <code>wallet</code> and <code>retry</code> only. There is no voucher discount-percentage endpoint.</span>
          </div>
        </div>
      )}

      <Modal open={retryOpen} onClose={() => setRetryOpen(false)}>
        <div className="modal-head">
          <h3>Retry voucher generation</h3>
          <CloseIcon onClick={() => setRetryOpen(false)} />
        </div>
        <div className="modal-body">
          <div className="kv-list">
            <div className="kv-row"><span className="k">Order</span><span className="v">{retryTarget?.orderNumber}</span></div>
          </div>
          <div className="impact-box">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>
            <span>This currently resets the item's status for reprocessing — it does not itself call the voucher provider.</span>
          </div>
          <div className="field">
            <label>Reason</label>
            <textarea className="input" value={retryReason} onChange={(e) => setRetryReason(e.target.value)} placeholder="e.g. Customer reported not receiving voucher"></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setRetryOpen(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={retrying} onClick={confirmRetry}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg> {retrying ? "Retrying…" : "Confirm retry"}
          </button>
        </div>
      </Modal>
    </>
  );
}
