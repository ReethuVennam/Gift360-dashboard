import { useState } from "react";
import { RegenerateVoucherButton } from "../shared/RegenerateVoucherButton";
import { CountUp } from "../shared/CountUp";
import { api } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface FailedVoucher {
  orderNumber: string;
  orderItemId: string;
  paidAt: string | null;
  quantity: number;
  unitValue: number;
  lineTotal: number;
  currency: string;
  amount: number;
  status: string;
  canRetry: boolean;
}

interface RetryEligible {
  originalOrderNumber: string;
  orderItemId: string;
  skuCode: string;
  quantity: number;
  amount: number;
  distributorId: string;
  orderPaidAt: string;
  attemptCount: number;
  customerName: string | null;
  customerEmail: string | null;
  customerMobile: string | null;
}

interface RetryMetrics {
  eligibleOrderCount: number;
  eligibleItemCount: number;
  totalRetriesToday: number;
  maxAttempts: number;
  retryWindowHours: number;
}

type ListMode = "failed" | "retry-eligible";

function statusBadgeClass(status: string): string {
  const s = status?.toUpperCase();
  if (s === "SUCCESS" || s === "GENERATED") return "success";
  if (s === "PENDING") return "warning";
  return "critical";
}

export function Vouchers() {
  const [activeTab, setActiveTab] = useState<"generation" | "config">("generation");
  const [listMode, setListMode] = useState<ListMode>("failed");
  const [search, setSearch] = useState("");

  const failed = useFetch(() => api.get<{ data: FailedVoucher[] }>("/vouchers/failed"), []);
  const retryEligible = useFetch(() => api.get<{ data: RetryEligible[] }>("/vouchers/retry-eligible"), []);
  const metrics = useFetch(() => api.get<RetryMetrics>("/vouchers/retry-metrics"), []);

  function refetchAll() {
    failed.refetch();
    retryEligible.refetch();
    metrics.refetch();
  }

  const failedRows = (failed.data?.data ?? []).filter(
    (r) => !search || r.orderNumber.toLowerCase().includes(search.toLowerCase())
  );
  const eligibleRows = (retryEligible.data?.data ?? []).filter(
    (r) =>
      !search ||
      r.originalOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerName ?? "").toLowerCase().includes(search.toLowerCase())
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
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Failed (this page)</div><CountUp target={failed.data?.data.length ?? 0} className="kpi-value" /></div>
            <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">Retry-eligible orders</div><CountUp target={metrics.data?.eligibleOrderCount ?? 0} className="kpi-value" /></div>
            <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">Retry-eligible items</div><CountUp target={metrics.data?.eligibleItemCount ?? 0} className="kpi-value" /></div>
            <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">Retries today</div><CountUp target={metrics.data?.totalRetriesToday ?? 0} className="kpi-value" /></div>
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
                    <thead><tr><th>Order</th><th>Qty</th><th>Unit value</th><th>Line total</th><th>Status</th><th>Paid at</th><th>Can retry</th><th></th></tr></thead>
                    <tbody>
                      {failed.loading && <tr><td colSpan={8} className="dim">Loading…</td></tr>}
                      {!failed.loading && failedRows.length === 0 && <tr><td colSpan={8} className="dim">No failed vouchers.</td></tr>}
                      {failedRows.map((r) => (
                        <tr key={r.orderItemId}>
                          <td className="id-cell">{r.orderNumber}</td>
                          <td className="num">{r.quantity}</td>
                          <td className="num">{r.currency} {r.unitValue}</td>
                          <td className="num">{r.currency} {r.lineTotal}</td>
                          <td><span className={"badge " + statusBadgeClass(r.status)}>{r.status}</span></td>
                          <td className="num muted">{r.paidAt ? new Date(r.paidAt).toLocaleString() : "—"}</td>
                          <td>{r.canRetry ? <span className="badge success">Yes</span> : <span className="badge critical">No</span>}</td>
                          <td>
                            <RegenerateVoucherButton
                              orderNumber={r.orderNumber}
                              orderItemId={r.orderItemId}
                              onRegenerated={refetchAll}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead><tr><th>Order</th><th>Customer</th><th>Email</th><th>Mobile</th><th>SKU</th><th>Qty</th><th>Amount</th><th>Paid at</th><th>Attempts</th><th></th></tr></thead>
                    <tbody>
                      {retryEligible.loading && <tr><td colSpan={10} className="dim">Loading…</td></tr>}
                      {!retryEligible.loading && eligibleRows.length === 0 && <tr><td colSpan={10} className="dim">No retry-eligible items.</td></tr>}
                      {eligibleRows.map((r) => (
                        <tr key={r.orderItemId}>
                          <td className="id-cell">{r.originalOrderNumber}</td>
                          <td>{r.customerName ?? "—"}</td>
                          <td className="mono">{r.customerEmail ?? "—"}</td>
                          <td className="mono">{r.customerMobile ?? "—"}</td>
                          <td className="mono muted" style={{ fontSize: "11px" }}>{r.skuCode}</td>
                          <td className="num">{r.quantity}</td>
                          <td className="num">₹{r.amount}</td>
                          <td className="num muted">{new Date(r.orderPaidAt).toLocaleString()}</td>
                          <td className="num">{r.attemptCount}</td>
                          <td>
                            <RegenerateVoucherButton
                              orderNumber={r.originalOrderNumber}
                              orderItemId={r.orderItemId}
                              onRegenerated={refetchAll}
                            />
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
    </>
  );
}
