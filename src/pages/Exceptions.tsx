import { useState } from "react";
import { Link } from "react-router-dom";
import { RequireButton } from "../shared/RequireButton";
import { Drawer } from "../shared/Drawer";
import { useToast } from "../shared/ToastContext";

interface ExceptionRow {
  priority: "Critical" | "High";
  exception: string;
  drawerType: string;
  order: string;
  customer: string;
  detected: string;
  status: string;
  statusClass: string;
}

const EXCEPTION_ROWS: ExceptionRow[] = [
  {
    priority: "Critical",
    exception: "Wallet credit/deduction inconsistency",
    drawerType: "Wallet credit inconsistency",
    order: "GF-88213",
    customer: "Neha Kapoor",
    detected: "3m ago",
    status: "Open",
    statusClass: "critical",
  },
  {
    priority: "High",
    exception: "Refund failed",
    drawerType: "Refund failed",
    order: "GF-88190",
    customer: "Karan Bose",
    detected: "11m ago",
    status: "Open",
    statusClass: "critical",
  },
  {
    priority: "High",
    exception: "Voucher generation failed",
    drawerType: "Voucher generation failed",
    order: "GF-88176",
    customer: "Divya Nair",
    detected: "24m ago",
    status: "Investigating",
    statusClass: "warning",
  },
  {
    priority: "High",
    exception: "Unexpected payment/order state",
    drawerType: "Unexpected payment/order state",
    order: "GF-88150",
    customer: "Farhan Sheikh",
    detected: "51m ago",
    status: "Open",
    statusClass: "critical",
  },
  {
    priority: "High",
    exception: "Repeated operational failure",
    drawerType: "Repeated operational failure",
    order: "GF-88099",
    customer: "Ritu Sharma",
    detected: "1h ago",
    status: "Investigating",
    statusClass: "warning",
  },
];

export function Exceptions() {
  const toast = useToast();
  const [selected, setSelected] = useState<ExceptionRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const excType = selected?.drawerType ?? "Wallet credit inconsistency";
  const excPriority = selected?.priority ?? "Critical";
  const excOrder = selected?.order ?? "GF-88213";

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Critical, open</div><div className="kpi-value" data-count="2">0</div></div>
        <div className="kpi-card"><span className="kpi-bar critical"></span><div className="kpi-label">High, open</div><div className="kpi-value" data-count="5">0</div></div>
        <div className="kpi-card warn"><span className="kpi-bar warning"></span><div className="kpi-label">Under investigation</div><div className="kpi-value" data-count="4">0</div></div>
        <div className="kpi-card"><span className="kpi-bar success"></span><div className="kpi-label">Resolved today</div><div className="kpi-value" data-count="21">0</div></div>
      </div>

      <div className="panel">
        <div className="filterbar">
          <div className="chip-group"><span className="chip active">All</span><span className="chip">Critical</span><span className="chip">High</span></div>
          <select className="select"><option>All modules</option><option>Voucher</option><option>Refund</option><option>Wallet</option><option>Payment</option></select>
          <div className="search-wrap grow"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input className="input" placeholder="Order ID or customer…" /></div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Priority</th><th>Exception</th><th>Order</th><th>Customer</th><th>Detected</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {EXCEPTION_ROWS.map((row) => (
                <tr
                  key={row.order}
                  onClick={() => {
                    setSelected(row);
                    setDrawerOpen(true);
                  }}
                >
                  <td><span className={"priority " + row.priority.toLowerCase()}>{row.priority}</span></td><td>{row.exception}</td><td className="id-cell">{row.order}</td><td>{row.customer}</td><td className="num muted">{row.detected}</td><td><span className={"badge " + row.statusClass}>{row.status}</span></td>
                  <td><button className="btn btn-sm">Investigate</button></td>
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
            <h3 id="exc-type" style={{ fontSize: "16px", marginTop: "2px" }}>{excType}</h3>
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <h4>Summary</h4>
            <div className="kv-list">
              <div className="kv-row"><span className="k">Priority</span><span className="v" id="exc-priority">{excPriority}</span></div>
              <div className="kv-row"><span className="k">Source order</span><span className="v" id="exc-order">{excOrder}</span></div>
              <div className="kv-row"><span className="k">Expected wallet credit</span><span className="v">₹80</span></div>
              <div className="kv-row"><span className="k">Actual wallet credit</span><span className="v">₹0</span></div>
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
              <div className="t-item"><span className="t-dot critical"></span><div className="t-time">14:29:41</div><div className="t-title">Inconsistency detected</div><div className="t-desc">Reconciliation job flagged mismatch between expected and actual wallet credit.</div></div>
              <div className="t-item"><span className="t-dot success"></span><div className="t-time">14:29:22</div><div className="t-title">Payment captured</div><div className="t-desc">PG-TXN-9931 captured successfully.</div></div>
              <div className="t-item"><span className="t-dot success"></span><div className="t-time">14:29:02</div><div className="t-title">Order created</div><div className="t-desc">Order placed by customer.</div></div>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Available actions</h4>
            <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
              <RequireButton requires="retry" className="btn btn-primary btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg> Re-run wallet credit</RequireButton>
              <button className="btn btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16l-2 9H6z"/><path d="M2 13h6l1.5 3h5L16 13h6"/><path d="M2 13v6a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-6"/></svg> Assign to me</button>
              <button className="btn btn-sm btn-ghost" onClick={() => toast('Marked resolved.')}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Mark resolved</button>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Action result</h4>
            <p className="dim" style={{ fontSize: "12px" }}>No action executed yet for this exception.</p>
          </div>
        </div>
      </Drawer>
    </>
  );
}
