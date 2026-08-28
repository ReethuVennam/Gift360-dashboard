import { Link, useNavigate } from "react-router-dom";
import { CountUp } from "../shared/CountUp";

export function Overview() {
  const navigate = useNavigate();

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Today at a glance</h2>
          <div className="desc">Auto-refreshing operational snapshot — Thu, 27 Aug 2026, 14:32 IST</div>
        </div>
        <div className="flex gap-8">
          <div className="chip-group">
            <span className="chip active">Today</span>
            <span className="chip">7 Days</span>
            <span className="chip">30 Days</span>
          </div>
          <Link to="/reports" className="btn btn-sm">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M11 20V4M18 20v-7"/></svg> Full reports
          </Link>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-top"><span className="kpi-label">Total Orders</span></div>
          <CountUp target={4812} className="kpi-value" />
          <div className="kpi-delta up"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg> 6.2% vs yesterday</div>
        </div>
        <div className="kpi-card">
          <span className="kpi-bar success"></span>
          <div className="kpi-top"><span className="kpi-label">Successful</span></div>
          <CountUp target={4498} className="kpi-value" />
          <div className="kpi-delta up"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg> 93.5% success rate</div>
        </div>
        <div className="kpi-card crit">
          <span className="kpi-bar critical"></span>
          <div className="kpi-top"><span className="kpi-label">Failed</span></div>
          <CountUp target={187} className="kpi-value" />
          <div className="kpi-delta down"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg> 3.9% of volume</div>
        </div>
        <div className="kpi-card warn">
          <span className="kpi-bar warning"></span>
          <div className="kpi-top"><span className="kpi-label">Pending</span></div>
          <CountUp target={127} className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>awaiting PG/voucher confirmation</div>
        </div>
        <div className="kpi-card">
          <span className="kpi-bar accent"></span>
          <div className="kpi-top"><span className="kpi-label">PG-Paid Amount</span></div>
          <CountUp target={3184620} prefix="₹" className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>across 4,102 PG orders</div>
        </div>
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-top"><span className="kpi-label">Voucher Health</span></div>
          <CountUp target={97.1} suffix="%" decimals={1} className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>312 pending / 89 retry-eligible</div>
        </div>
        <div className="kpi-card">
          <span className="kpi-bar accent"></span>
          <div className="kpi-top"><span className="kpi-label">Wallet + SuperCoins Used</span></div>
          <CountUp target={512340} prefix="₹" className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>710 orders touched wallet</div>
        </div>
        <div className="kpi-card crit">
          <span className="kpi-bar critical"></span>
          <div className="kpi-top"><span className="kpi-label">Critical Exceptions</span></div>
          <CountUp target={7} className="kpi-value" />
          <div className="dim" style={{ fontSize: "11px" }}>open, needs investigation</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Critical exceptions</h3>
              <div className="desc">Highest-priority items requiring operator action right now</div>
            </div>
            <Link to="/exceptions" className="btn btn-ghost btn-sm">
              View all <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Priority</th><th>Type</th><th>Order</th><th>Detected</th><th></th></tr></thead>
              <tbody>
                <tr onClick={() => navigate("/exceptions")}>
                  <td><span className="priority critical">Critical</span></td>
                  <td>Wallet credit inconsistency</td>
                  <td className="id-cell">GF-88213</td>
                  <td className="num muted">3m ago</td>
                  <td><span className="badge critical">Open</span></td>
                </tr>
                <tr onClick={() => navigate("/exceptions")}>
                  <td><span className="priority high">High</span></td>
                  <td>Refund failed</td>
                  <td className="id-cell">GF-88190</td>
                  <td className="num muted">11m ago</td>
                  <td><span className="badge critical">Open</span></td>
                </tr>
                <tr onClick={() => navigate("/exceptions")}>
                  <td><span className="priority high">High</span></td>
                  <td>Voucher generation failed</td>
                  <td className="id-cell">GF-88176</td>
                  <td className="num muted">24m ago</td>
                  <td><span className="badge warning">Investigating</span></td>
                </tr>
                <tr onClick={() => navigate("/exceptions")}>
                  <td><span className="priority high">High</span></td>
                  <td>Unexpected payment state</td>
                  <td className="id-cell">GF-88150</td>
                  <td className="num muted">51m ago</td>
                  <td><span className="badge critical">Open</span></td>
                </tr>
                <tr onClick={() => navigate("/exceptions")}>
                  <td><span className="priority high">High</span></td>
                  <td>Repeated operational failure</td>
                  <td className="id-cell">GF-88099</td>
                  <td className="num muted">1h ago</td>
                  <td><span className="badge warning">Investigating</span></td>
                </tr>
              </tbody>
            </table>
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
            <div className="timeline">
              <div className="t-item">
                <span className="t-dot success"></span>
                <div className="t-time">14:28 · Priya S.</div>
                <div className="t-title">Voucher retry succeeded</div>
                <div className="t-desc">Order <span className="mono">GF-88041</span> — retry #2 issued voucher successfully.</div>
              </div>
              <div className="t-item">
                <span className="t-dot warning"></span>
                <div className="t-time">14:10 · Arjun K.</div>
                <div className="t-title">Voucher discount updated</div>
                <div className="t-desc">Changed from <span className="mono">12%</span> to <span className="mono">15%</span>, reason: festive campaign.</div>
              </div>
              <div className="t-item">
                <span className="t-dot success"></span>
                <div className="t-time">13:52 · Meera J.</div>
                <div className="t-title">Refund initiated</div>
                <div className="t-desc">Order <span className="mono">GF-87990</span> — ₹1,240 refund sent to provider.</div>
              </div>
              <div className="t-item">
                <span className="t-dot critical"></span>
                <div className="t-time">13:35 · System</div>
                <div className="t-title">Customer auto-flagged</div>
                <div className="t-desc"><span className="mono">+91 98•••210</span> flagged for velocity abuse — pending review.</div>
              </div>
              <div className="t-item">
                <span className="t-dot success"></span>
                <div className="t-time">13:02 · Ravi M.</div>
                <div className="t-title">Customer blocked</div>
                <div className="t-desc"><span className="mono">CUST-55021</span> blocked — reason: repeated voucher abuse.</div>
              </div>
            </div>
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
        <Link className="report-card" to="/refunds">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2" strokeLinecap="round"/></svg></div>
          <h4>Refund report</h4>
          <p>Date range + refund status.</p>
        </Link>
      </div>
    </>
  );
}
