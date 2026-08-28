import { RequireButton } from '../shared/RequireButton';

export function AuditLog() {
  return (
    <>
      <div className="panel">
        <div className="filterbar">
          <select className="select"><option>All modules</option><option>Orders</option><option>Voucher</option><option>Wallet</option><option>Refund</option><option>Customer</option></select>
          <select className="select"><option>All actions</option><option>Retry</option><option>Block</option><option>Unblock</option><option>Update</option><option>Refund</option><option>Export</option></select>
          <select className="select"><option>All admins</option><option>Ravi Menon</option><option>Meera J.</option><option>Arjun K.</option><option>Priya S.</option></select>
          <div className="chip-group"><span className="chip">Today</span><span className="chip active">7d</span><span className="chip">30d</span><span className="chip">Custom</span></div>
          <div className="search-wrap grow"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input className="input" placeholder="Target ID (order, customer, config)…" /></div>
          <RequireButton requires="export" className="btn btn-primary"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> Export</RequireButton>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Module</th><th>Action</th><th>Target</th><th>Before → After</th><th>Reason</th><th>Result</th></tr></thead>
            <tbody>
              <tr><td className="num muted">27 Aug, 14:29</td><td>Ravi Menon</td><td><span className="badge info">Voucher</span></td><td>Retry</td><td className="id-cell">GF-88213</td><td className="mono">Failed → Pending</td><td className="muted">Provider timeout recovery</td><td><span className="badge success">Success</span></td></tr>
              <tr><td className="num muted">27 Aug, 14:10</td><td>Arjun K.</td><td><span className="badge neutral">Voucher Config</span></td><td>Update</td><td className="id-cell">discount_pct</td><td className="mono">12% → 15%</td><td className="muted">Festive campaign</td><td><span className="badge success">Success</span></td></tr>
              <tr><td className="num muted">27 Aug, 13:52</td><td>Meera J.</td><td><span className="badge critical">Refund</span></td><td>Refund</td><td className="id-cell">GF-87990</td><td className="mono">Eligible → Initiated</td><td className="muted">Customer-confirmed non-delivery</td><td><span className="badge warning">Pending</span></td></tr>
              <tr><td className="num muted">27 Aug, 13:02</td><td>Ravi Menon</td><td><span className="badge warning">Customer</span></td><td>Block</td><td className="id-cell">CUST-55021</td><td className="mono">Active → Blocked</td><td className="muted">Repeated voucher abuse</td><td><span className="badge success">Success</span></td></tr>
              <tr><td className="num muted">27 Aug, 11:40</td><td>Priya S.</td><td><span className="badge info">Voucher</span></td><td>Retry</td><td className="id-cell">GF-87994</td><td className="mono">Retry-eligible → Pending</td><td className="muted">Auto-backoff exhausted</td><td><span className="badge success">Success</span></td></tr>
              <tr><td className="num muted">26 Aug, 18:20</td><td>System</td><td><span className="badge warning">Customer</span></td><td>Block</td><td className="id-cell">CUST-55118</td><td className="mono">Active → Flagged</td><td className="muted">Auto-flag: chargeback pattern</td><td><span className="badge success">Success</span></td></tr>
              <tr><td className="num muted">26 Aug, 16:05</td><td>Ravi Menon</td><td><span className="badge neutral">Reports</span></td><td>Export</td><td className="id-cell">voucher_failures_7d.csv</td><td className="mono">—</td><td className="muted">Weekly ops review</td><td><span className="badge success">Success</span></td></tr>
              <tr><td className="num muted">25 Aug, 09:14</td><td>Meera J.</td><td><span className="badge warning">Customer</span></td><td>Unblock</td><td className="id-cell">CUST-55021</td><td className="mono">Blocked → Active</td><td className="muted">False positive, manually cleared</td><td><span className="badge success">Success</span></td></tr>
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>Showing <b className="mono">1–8</b> of <b className="mono">2,140</b> audit records</span>
          <div className="pager-btns"><button><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button><button className="active">1</button><button>2</button><button>3</button><button>…</button><button>268</button><button><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><div><h3>Audit field reference</h3><div className="desc">Every privileged action is recorded with the following fields, without exception</div></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Field</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td>Actor</td><td className="muted">Admin user ID / username</td></tr>
              <tr><td>Timestamp</td><td className="muted">Action execution time</td></tr>
              <tr><td>Module</td><td className="muted">Orders / Voucher / Wallet / Refund / Customer</td></tr>
              <tr><td>Action</td><td className="muted">Retry / Block / Update / Refund / Export</td></tr>
              <tr><td>Target</td><td className="muted">Order ID / Customer ID / Configuration</td></tr>
              <tr><td>Before state</td><td className="muted">Previous status/value</td></tr>
              <tr><td>After state</td><td className="muted">New status/value</td></tr>
              <tr><td>Reason</td><td className="muted">Admin-provided reason where applicable</td></tr>
              <tr><td>Result</td><td className="muted">Success / failure / pending + relevant response reference</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
