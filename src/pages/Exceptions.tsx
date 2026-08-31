import { useState } from "react";
import { Link } from "react-router-dom";
import { RequireButton } from "../shared/RequireButton";
import { Drawer } from "../shared/Drawer";
import { useToast } from "../shared/ToastContext";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

type Row = Record<string, unknown>;

interface ExceptionData {
  summary: {
    critical_open: number;
    high_open: number;
    investigating: number;
    resolved_today: number;
  };
  data: Row[];
}

type PriorityFilter = "All" | "Critical" | "High";

const EMPTY_EXCEPTIONS: ExceptionData = {
  summary: {
    critical_open: 0,
    high_open: 0,
    investigating: 0,
    resolved_today: 0,
  },
  data: [],
};

function statusClass(status: string): string {
  if (status === "Resolved") return "success";
  if (status === "Investigating") return "warning";
  return "critical";
}

function relativeTime(dateStr: unknown): string {
  if (!dateStr) return "—";
  const d = new Date(String(dateStr));
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function timelineDotClass(event: string): string {
  const lower = String(event).toLowerCase();
  if (lower.includes("fail") || lower.includes("error") || lower.includes("inconsistency") || lower.includes("declined")) return "critical";
  if (lower.includes("success") || lower.includes("captured") || lower.includes("created") || lower.includes("resolved")) return "success";
  return "warning";
}

export function Exceptions() {
  const toast = useToast();
  const [selected, setSelected] = useState<Row | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const params: Record<string, string> = {};
  if (priorityFilter !== "All") params.priority = priorityFilter;
  if (moduleFilter) params.module = moduleFilter;
  if (search) params.search = search;

  const exceptions = useFetch(
    async () => {
      try {
        return await api.get<ExceptionData>("/exceptions", params);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return EMPTY_EXCEPTIONS;
        }
        throw err;
      }
    },
    [priorityFilter, moduleFilter, search]
  );

  const summary = exceptions.data?.summary;
  const rows = exceptions.data?.data ?? [];

  const handleAssign = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await api.post<{ assigned_to: string }>(`/exceptions/${id}/assign`);
      toast(`Assigned to ${res.assigned_to}`);
      exceptions.refetch();
    } catch {
      toast("Failed to assign exception.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(true);
    try {
      await api.post(`/exceptions/${id}/resolve`);
      toast("Marked resolved.");
      exceptions.refetch();
    } catch {
      toast("Failed to resolve exception.");
    } finally {
      setActionLoading(false);
    }
  };

  const exc = selected;

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Exceptions</h2>
          <div className="desc">Operational incidents requiring attention</div>
        </div>
      </div>

      {exceptions.loading && <div className="impact-box"><span>Loading exceptions…</span></div>}
      {exceptions.error && <div className="impact-box"><span>{exceptions.error}</span></div>}

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Critical, open</div><div className="kpi-value">{summary?.critical_open ?? 0}</div></div>
        <div className="kpi-card"><span className="kpi-bar critical"></span><div className="kpi-label">High, open</div><div className="kpi-value">{summary?.high_open ?? 0}</div></div>
        <div className="kpi-card warn"><span className="kpi-bar warning"></span><div className="kpi-label">Under investigation</div><div className="kpi-value">{summary?.investigating ?? 0}</div></div>
        <div className="kpi-card"><span className="kpi-bar success"></span><div className="kpi-label">Resolved today</div><div className="kpi-value">{summary?.resolved_today ?? 0}</div></div>
      </div>

      <div className="panel">
        <div className="filterbar">
          <div className="chip-group">
            {(["All", "Critical", "High"] as PriorityFilter[]).map((p) => (
              <span key={p} className={"chip" + (priorityFilter === p ? " active" : "")} onClick={() => setPriorityFilter(p)}>{p}</span>
            ))}
          </div>
          <select className="select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="">All modules</option>
            <option value="Voucher">Voucher</option>
            <option value="Refund">Refund</option>
            <option value="Wallet">Wallet</option>
            <option value="Payment">Payment</option>
          </select>
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input className="input" placeholder="Order ID or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Priority</th><th>Exception</th><th>Order</th><th>Customer</th><th>Detected</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {!exceptions.loading && rows.length === 0 && (
                <tr><td colSpan={7} className="dim" style={{ textAlign: "center", padding: "20px" }}>No exceptions found.</td></tr>
              )}
              {rows.map((row) => (
                <tr
                  key={String(row.id)}
                  onClick={() => {
                    setSelected(row);
                    setDrawerOpen(true);
                  }}
                >
                  <td><span className={"priority " + String(row.priority).toLowerCase()}>{String(row.priority)}</span></td>
                  <td>{String(row.exception_type ?? row.exception ?? "—")}</td>
                  <td className="id-cell">{String(row.order_number ?? row.order ?? "—")}</td>
                  <td>{String(row.customer_name ?? row.customer ?? "—")}</td>
                  <td className="num muted">{relativeTime(row.detected_at ?? row.detected)}</td>
                  <td><span className={"badge " + statusClass(String(row.status))}>{String(row.status)}</span></td>
                  <td><button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setSelected(row); setDrawerOpen(true); }}>Investigate</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width={520}>
        <div className="drawer-head">
          <div>
            <div className="dim" style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".06em" }}>Investigation</div>
            <h3 style={{ fontSize: "16px", marginTop: "2px" }}>{String(exc?.exception_type ?? exc?.exception ?? "Exception")}</h3>
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <h4>Summary</h4>
            <div className="kv-list">
              <div className="kv-row"><span className="k">Priority</span><span className="v">{String(exc?.priority ?? "—")}</span></div>
              <div className="kv-row"><span className="k">Source order</span><span className="v">{String(exc?.order_number ?? exc?.order ?? "—")}</span></div>
              <div className="kv-row"><span className="k">Module</span><span className="v">{String(exc?.module ?? "—")}</span></div>
              <div className="kv-row"><span className="k">Status</span><span className="v">{String(exc?.status ?? "—")}</span></div>
              {Boolean(exc?.assigned_to) && <div className="kv-row"><span className="k">Assigned to</span><span className="v">{String(exc?.assigned_to as string)}</span></div>}
            </div>
          </div>
          <div className="drawer-section">
            <h4>Related</h4>
            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
              <Link className="btn btn-sm" to="/orders"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg> Order</Link>
              <Link className="btn btn-sm" to="/customers"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4.2 1.7"/><path d="M17 8l5 5M22 8l-5 5"/></svg> Customer</Link>
              <Link className="btn btn-sm" to="/wallet"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/><path d="M17 12h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z"/></svg> Wallet ledger</Link>
              <Link className="btn btn-sm" to="/vouchers"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M9 3v18" strokeDasharray="2 2"/></svg> Voucher</Link>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Timeline</h4>
            <div className="timeline">
              {(Array.isArray(exc?.timeline) ? exc.timeline : []).length === 0 && (
                <p className="dim" style={{ fontSize: "12px" }}>No timeline events.</p>
              )}
              {(Array.isArray(exc?.timeline) ? exc.timeline : []).map((evt: Row, i: number) => (
                <div key={i} className="t-item">
                  <span className={"t-dot " + timelineDotClass(evt.event as string)}></span>
                  <div className="t-time">{String(evt.time ?? evt.timestamp ?? "")}</div>
                  <div className="t-title">{String(evt.event ?? evt.title ?? "—")}</div>
                  <div className="t-desc">{String(evt.detail ?? evt.description ?? "")}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="drawer-section">
            <h4>Available actions</h4>
            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
              {exc?.status !== "Resolved" && (
                <>
                  <span style={{ opacity: actionLoading ? 0.5 : 1, pointerEvents: actionLoading ? "none" : "auto" }}>
                    <RequireButton requires="orders:manage" className="btn btn-primary btn-sm" onClick={() => exc?.id && handleAssign(String(exc.id))}>
                      <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16l-2 9H6z"/><path d="M2 13h6l1.5 3h5L16 13h6"/><path d="M2 13v6a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-6"/></svg> Assign to me
                    </RequireButton>
                  </span>
                  <button className="btn btn-sm btn-ghost" onClick={() => exc?.id && handleResolve(String(exc.id))} disabled={actionLoading}>
                    <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Mark resolved
                  </button>
                </>
              )}
              {exc?.status === "Resolved" && (
                <span className="badge success">Resolved</span>
              )}
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
