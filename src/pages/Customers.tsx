import { useMemo, useState } from "react";
import { RequireButton } from "../shared/RequireButton";
import { Modal } from "../shared/Modal";
import { useToast } from "../shared/ToastContext";
import { CountUp } from "../shared/CountUp";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface CustomerRow {
  client_id: string;
  client_name: string;
  client_email: string;
  client_mobile: string;
  client_account_status: string;
  total_orders: number;
  total_spent: number;
  vouchers_received: number;
  supercoins_earned: number;
  last_order_at: string | null;
}

interface AuditRow {
  admin_username: string;
  action: string;
  target_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

const STATUSES = ["active", "pending_activation", "suspended", "closed"];

function statusBadgeClass(status: string): string {
  if (status === "active") return "success";
  if (status === "suspended" || status === "closed") return "critical";
  return "warning";
}

export function Customers() {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const list = useFetch(
    () =>
      api.get<{ data: CustomerRow[]; page: number; size: number }>("/customers", {
        search: search || undefined,
        status: status || undefined,
        page,
        size: 50,
      }),
    [search, status, page]
  );

  const counts = useMemo(() => {
    const rows = list.data?.data ?? [];
    return {
      total: rows.length,
      active: rows.filter((r) => r.client_account_status === "active").length,
      suspended: rows.filter((r) => r.client_account_status === "suspended").length,
      pending: rows.filter((r) => r.client_account_status === "pending_activation").length,
    };
  }, [list.data]);

  const [blockTarget, setBlockTarget] = useState<CustomerRow | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedForAudit, setSelectedForAudit] = useState<CustomerRow | null>(null);
  const audit = useFetch(
    () => (selectedForAudit ? api.get<{ data: AuditRow[] }>("/audit", { module: "customer", page: 0, size: 50 }) : Promise.resolve({ data: [] as AuditRow[] })),
    [selectedForAudit]
  );
  const auditRowsForCustomer = (audit.data?.data ?? []).filter((r) => r.target_id === selectedForAudit?.client_id);

  function openBlockModal(row: CustomerRow) {
    setBlockTarget(row);
    setReason("");
    setBlockOpen(true);
  }

  async function confirmBlockToggle() {
    if (!blockTarget) return;
    const nextStatus = blockTarget.client_account_status === "active" ? "suspended" : "active";
    setSubmitting(true);
    try {
      await api.post(`/customers/${blockTarget.client_id}/block`, { status: nextStatus, reason });
      toast(`Customer ${blockTarget.client_name} is now ${nextStatus}. Recorded to audit log.`);
      setBlockOpen(false);
      list.refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "err");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">On this page</div><CountUp target={counts.total} className="kpi-value" /></div>
        <div className="kpi-card"><span className="kpi-bar success"></span><div className="kpi-label">Active</div><CountUp target={counts.active} className="kpi-value" /></div>
        <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Suspended</div><CountUp target={counts.suspended} className="kpi-value" /></div>
        <div className="kpi-card warn"><span className="kpi-bar warning"></span><div className="kpi-label">Pending activation</div><CountUp target={counts.pending} className="kpi-value" /></div>
      </div>

      <div className="panel">
        <div className="filterbar">
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              className="input"
              placeholder="Search customer name, mobile, email or customer ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); setSearch(searchInput); } }}
            />
          </div>
          <select className="select" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn" onClick={() => { setPage(0); setSearch(searchInput); }}>Search</button>
        </div>
        {list.error && <div className="impact-box"><span>{list.error}</span></div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Mobile</th><th>Email</th><th>Orders</th><th>Total spent</th><th>SuperCoins earned</th><th>Vouchers received</th><th>Last order</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.loading && <tr><td colSpan={10} className="dim">Loading…</td></tr>}
              {!list.loading && (list.data?.data.length ?? 0) === 0 && <tr><td colSpan={10} className="dim">No customers found.</td></tr>}
              {list.data?.data.map((row) => (
                <tr key={row.client_id}>
                  <td onClick={() => setSelectedForAudit(row)} style={{ cursor: "pointer" }}>
                    <b>{row.client_name}</b><br /><span className="muted mono" style={{ fontSize: "11px" }}>{row.client_id}</span>
                  </td>
                  <td className="mono">{row.client_mobile}</td>
                  <td className="mono">{row.client_email}</td>
                  <td className="num">{row.total_orders}</td>
                  <td className="num">₹{row.total_spent}</td>
                  <td className="num">{row.supercoins_earned}</td>
                  <td className="num">{row.vouchers_received}</td>
                  <td className="num muted">{row.last_order_at ? new Date(row.last_order_at).toLocaleDateString() : "—"}</td>
                  <td><span className={"badge " + statusBadgeClass(row.client_account_status)}>{row.client_account_status}</span></td>
                  <td>
                    {row.client_account_status === "active" ? (
                      <RequireButton requires="customers:block" className="btn btn-sm btn-danger" onClick={() => openBlockModal(row)}>Suspend</RequireButton>
                    ) : (
                      <RequireButton requires="customers:block" className="btn btn-sm" onClick={() => openBlockModal(row)}>Reactivate</RequireButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <div className="pager-btns">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
            <span className="mono" style={{ padding: "0 8px" }}>Page {page + 1}</span>
            <button disabled={(list.data?.data.length ?? 0) < 50} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {selectedForAudit && (
        <div className="panel">
          <div className="panel-head"><h3>Customer audit trail — {selectedForAudit.client_name}</h3><div className="desc">Block / unblock decisions recorded for this customer, from the admin audit log</div></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Timestamp</th><th>Action</th><th>Admin</th><th>Previous → New</th><th>Reason</th></tr></thead>
              <tbody>
                {audit.loading && <tr><td colSpan={5} className="dim">Loading…</td></tr>}
                {!audit.loading && auditRowsForCustomer.length === 0 && <tr><td colSpan={5} className="dim">No recorded actions for this customer.</td></tr>}
                {auditRowsForCustomer.map((r, i) => (
                  <tr key={i}>
                    <td className="num muted">{new Date(r.created_at).toLocaleString()}</td>
                    <td><span className="badge critical">{r.action}</span></td>
                    <td>{r.admin_username}</td>
                    <td className="mono">{r.previous_value} → {r.new_value}</td>
                    <td>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={blockOpen} onClose={() => setBlockOpen(false)}>
        <div className="modal-head">
          <h3>{blockTarget?.client_account_status === "active" ? "Suspend customer" : "Reactivate customer"}</h3>
          <button className="icon-btn" onClick={() => setBlockOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="modal-body">
          <div className="impact-box"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg><span>Suspending prevents this customer from placing new orders, redeeming vouchers, and using wallet/SuperCoins immediately.</span></div>
          <div className="kv-list">
            <div className="kv-row"><span className="k">Customer</span><span className="v">{blockTarget?.client_name}</span></div>
            <div className="kv-row"><span className="k">Customer ID</span><span className="v">{blockTarget?.client_id}</span></div>
          </div>
          <div className="field">
            <label>Reason <span className="dim">(required)</span></label>
            <textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Confirmed chargeback pattern"></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setBlockOpen(false)}>Cancel</button>
          <button className="btn btn-danger" disabled={!reason.trim() || submitting} onClick={confirmBlockToggle}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> {submitting ? "Saving…" : "Confirm"}
          </button>
        </div>
      </Modal>
    </>
  );
}
