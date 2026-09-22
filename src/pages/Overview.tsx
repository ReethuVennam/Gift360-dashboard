import { useState } from "react";
import { Link } from "react-router-dom";
import { CountUp } from "../shared/CountUp";
import { CustomerLookupPanel } from "../shared/CustomerLookupPanel";
import { api } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface DashboardSummary {
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  failed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  total_wallet_used: number;
  unique_customers: number;
  vouchers_generated: number;
  vouchers_failed: number;
  supercoins_earned: number;
  supercoins_burnt: number;
  supercoins_refunded: number;
}

interface AuditRow {
  admin_username: string;
  action: string;
  module: string;
  target_id: string | null;
  reason: string | null;
  result: string;
  created_at: string;
}

type RangeKey = "today" | "7d" | "30d";

function rangeToDates(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (range === "7d") from.setDate(from.getDate() - 7);
  else if (range === "30d") from.setDate(from.getDate() - 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

function dotClass(result: string): string {
  return result === "SUCCESS" ? "success" : result === "FAILURE" ? "critical" : "warning";
}

export function Overview() {
  const [range, setRange] = useState<RangeKey>("today");
  const { from, to } = rangeToDates(range);

  const summary = useFetch(
    () => api.get<{ data: DashboardSummary }>("/dashboard/summary", { from, to }),
    [from, to]
  );
  const activity = useFetch(() => api.get<{ data: AuditRow[] }>("/audit", { page: 0, size: 6 }), []);

  const s = summary.data?.data;
  const voucherTotal = (s?.vouchers_generated ?? 0) + (s?.vouchers_failed ?? 0);
  const voucherHealth = voucherTotal > 0 ? ((s?.vouchers_generated ?? 0) / voucherTotal) * 100 : 0;

  return (
    <>
      <CustomerLookupPanel />

      <div className="section-head">
        <div>
          <h2>Today at a glance</h2>
          <div className="desc">Operational snapshot for {from} to {to}</div>
        </div>
        <div className="flex gap-8">
          <div className="chip-group">
            <span className={"chip" + (range === "today" ? " active" : "")} onClick={() => setRange("today")}>Today</span>
            <span className={"chip" + (range === "7d" ? " active" : "")} onClick={() => setRange("7d")}>7 Days</span>
            <span className={"chip" + (range === "30d" ? " active" : "")} onClick={() => setRange("30d")}>30 Days</span>
          </div>
          <Link to="/reports" className="btn btn-sm">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M11 20V4M18 20v-7"/></svg> Full reports
          </Link>
        </div>
      </div>

      {summary.error && <div className="impact-box"><span>{summary.error}</span></div>}

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-top"><span className="kpi-label">Total Orders</span></div>
          <CountUp target={s?.total_orders ?? 0} className="kpi-value" />
        </div>
        <div className="kpi-card">
          <span className="kpi-bar success"></span>
          <div className="kpi-top"><span className="kpi-label">Paid</span></div>
          <CountUp target={s?.paid_orders ?? 0} className="kpi-value" />
        </div>
        <div className="kpi-card crit">
          <span className="kpi-bar critical"></span>
          <div className="kpi-top"><span className="kpi-label">Failed</span></div>
          <CountUp target={s?.failed_orders ?? 0} className="kpi-value" />
        </div>
        <div className="kpi-card warn">
          <span className="kpi-bar warning"></span>
          <div className="kpi-top"><span className="kpi-label">Pending</span></div>
          <CountUp target={s?.pending_orders ?? 0} className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>awaiting PG/voucher confirmation</div>
        </div>
        <div className="kpi-card">
          <span className="kpi-bar accent"></span>
          <div className="kpi-top"><span className="kpi-label">Revenue</span></div>
          <CountUp target={s?.total_revenue ?? 0} prefix="₹" className="kpi-value" />
        </div>
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-top"><span className="kpi-label">Voucher Health</span></div>
          <CountUp target={voucherHealth} suffix="%" decimals={1} className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>{s?.vouchers_failed ?? 0} failed of {voucherTotal}</div>
        </div>
        <div className="kpi-card">
          <span className="kpi-bar accent"></span>
          <div className="kpi-top"><span className="kpi-label">Wallet Used</span></div>
          <CountUp target={s?.total_wallet_used ?? 0} prefix="₹" className="kpi-value" />
        </div>
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-top"><span className="kpi-label">Unique Customers</span></div>
          <CountUp target={s?.unique_customers ?? 0} className="kpi-value" />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Recent activity</h3>
            <div className="desc">Retries, refunds, config changes and admin actions</div>
          </div>
          <Link to="/audit" className="btn btn-ghost btn-sm">
            Full log <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        </div>
        <div className="panel-body">
          {activity.loading && <p className="dim">Loading…</p>}
          {activity.error && <p className="dim">{activity.error}</p>}
          {!activity.loading && !activity.error && (activity.data?.data.length ?? 0) === 0 && (
            <p className="dim">No recent activity.</p>
          )}
          <div className="timeline">
            {activity.data?.data.map((row, i) => (
              <div className="t-item" key={i}>
                <span className={"t-dot " + dotClass(row.result)}></span>
                <div className="t-time">{new Date(row.created_at).toLocaleString()} · {row.admin_username}</div>
                <div className="t-title">{row.action} — {row.module}</div>
                <div className="t-desc">
                  {row.target_id && <span className="mono">{row.target_id}</span>}
                  {row.reason ? ` — ${row.reason}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: "6px" }}>
        <div>
          <h2>Jump to a report</h2>
          <div className="desc">Common operational reports, ready without writing SQL</div>
        </div>
      </div>
      <div className="report-grid">
        <Link className="report-card" to="/reports">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
          <h4>Recent transactions</h4>
          <p>Gift360 orders from the last 10 days.</p>
        </Link>
        <Link className="report-card" to="/reports">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
          <h4>Successful orders</h4>
          <p>Date range + Success status.</p>
        </Link>
        <Link className="report-card" to="/vouchers">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M9 3v18" strokeDasharray="2 2"/></svg></div>
          <h4>Voucher failures</h4>
          <p>Date range + Voucher Generation Failed.</p>
        </Link>
      </div>
    </>
  );
}
