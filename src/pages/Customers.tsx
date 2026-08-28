import { useState } from 'react';
import { RequireButton } from '../shared/RequireButton';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/ToastContext';
import { CountUp } from '../shared/CountUp';

export function Customers() {
  const toast = useToast();
  const [blockOpen, setBlockOpen] = useState(false);
  const [unblockOpen, setUnblockOpen] = useState(false);

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Flagged (open)</div><CountUp target={18} className="kpi-value" /></div>
        <div className="kpi-card"><span className="kpi-bar critical"></span><div className="kpi-label">Blocked customers</div><CountUp target={63} className="kpi-value" /></div>
        <div className="kpi-card"><span className="kpi-bar warning"></span><div className="kpi-label">Auto-flagged today</div><CountUp target={5} className="kpi-value" /></div>
        <div className="kpi-card"><span className="kpi-bar success"></span><div className="kpi-label">Cleared this week</div><CountUp target={11} className="kpi-value" /></div>
      </div>

      <div className="panel">
        <div className="filterbar">
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input className="input" placeholder="Search customer name, mobile, email or customer ID…" />
          </div>
          <select className="select"><option>All statuses</option><option>Flagged</option><option>Blocked</option><option>Active</option></select>
          <select className="select"><option>All risk reasons</option><option>Velocity abuse</option><option>Voucher abuse</option><option>Chargeback pattern</option></select>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Risk indicators</th><th>Orders (30d)</th><th>Flagged reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td><b>Neha Kapoor</b><br /><span className="muted mono" style={{ fontSize: '11px' }}>CUST-55021 · +91 98221xxxxx</span></td>
                <td><span className="badge critical">Velocity</span> <span className="badge warning">Voucher abuse</span></td>
                <td className="num">41</td>
                <td>17 voucher redemptions in 24h from same device</td>
                <td><span className="badge critical">Blocked</span></td>
                <td><RequireButton requires="unblock" className="btn btn-sm" onClick={() => setUnblockOpen(true)}>Unblock</RequireButton></td>
              </tr>
              <tr>
                <td><b>Rohit Agarwal</b><br /><span className="muted mono" style={{ fontSize: '11px' }}>CUST-55118 · +91 90011xxxxx</span></td>
                <td><span className="badge warning">Chargeback pattern</span></td>
                <td className="num">9</td>
                <td>2 disputed PG transactions in 14 days</td>
                <td><span className="badge warning">Flagged</span></td>
                <td><RequireButton requires="block" className="btn btn-sm btn-danger" onClick={() => setBlockOpen(true)}>Block</RequireButton></td>
              </tr>
              <tr>
                <td><b>Simran Kaur</b><br /><span className="muted mono" style={{ fontSize: '11px' }}>CUST-55210 · +91 97711xxxxx</span></td>
                <td><span className="badge critical">Velocity</span></td>
                <td className="num">28</td>
                <td>Order velocity 6x above customer average</td>
                <td><span className="badge warning">Flagged</span></td>
                <td><RequireButton requires="block" className="btn btn-sm btn-danger" onClick={() => setBlockOpen(true)}>Block</RequireButton></td>
              </tr>
              <tr>
                <td><b>Deepak Verma</b><br /><span className="muted mono" style={{ fontSize: '11px' }}>CUST-54890 · +91 91002xxxxx</span></td>
                <td><span className="badge neutral">Under review</span></td>
                <td className="num">14</td>
                <td>Multiple accounts share a device fingerprint</td>
                <td><span className="badge neutral">Active</span></td>
                <td><RequireButton requires="block" className="btn btn-sm btn-danger" onClick={() => setBlockOpen(true)}>Block</RequireButton></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>Showing <b className="mono">1–4</b> of <b className="mono">18</b> flagged customers</span>
          <div className="pager-btns">
            <button><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
            <button className="active">1</button>
            <button>2</button>
            <button><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Customer audit trail — CUST-55021</h3><div className="desc">Every block / unblock decision, with actor and reason</div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>Action</th><th>Admin</th><th>Previous → New</th><th>Reason</th></tr></thead>
            <tbody>
              <tr><td className="num muted">27 Aug, 13:02</td><td><span className="badge critical">Block</span></td><td>Ravi M.</td><td className="mono">Active → Blocked</td><td>Repeated voucher abuse — 17 redemptions/24h.</td></tr>
              <tr><td className="num muted">02 Aug, 09:14</td><td><span className="badge success">Unblock</span></td><td>Meera J.</td><td className="mono">Blocked → Active</td><td>Manual review cleared prior flag; false positive.</td></tr>
              <tr><td className="num muted">30 Jul, 18:47</td><td><span className="badge critical">Block</span></td><td>System</td><td className="mono">Active → Blocked</td><td>Auto-flag: velocity threshold exceeded.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={blockOpen} onClose={() => setBlockOpen(false)}>
        <div className="modal-head"><h3>Block customer</h3><button className="icon-btn" onClick={() => setBlockOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div>
        <div className="modal-body">
          <div className="impact-box"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg><span>Blocking prevents this customer from placing new orders, redeeming vouchers, and using wallet/SuperCoins immediately. Existing orders are not affected.</span></div>
          <div className="kv-list">
            <div className="kv-row"><span className="k">Customer</span><span className="v">Rohit Agarwal</span></div>
            <div className="kv-row"><span className="k">Customer ID</span><span className="v">CUST-55118</span></div>
          </div>
          <div className="field">
            <label>Reason for blocking <span className="dim">(required)</span></label>
            <textarea className="input" placeholder="e.g. Confirmed chargeback pattern across 2 PG transactions"></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setBlockOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { setBlockOpen(false); toast('Customer CUST-55118 blocked. Recorded to audit log.'); }}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Confirm block</button>
        </div>
      </Modal>

      <Modal open={unblockOpen} onClose={() => setUnblockOpen(false)}>
        <div className="modal-head"><h3>Unblock customer</h3><button className="icon-btn" onClick={() => setUnblockOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div>
        <div className="modal-body">
          <div className="kv-list">
            <div className="kv-row"><span className="k">Customer</span><span className="v">Neha Kapoor</span></div>
            <div className="kv-row"><span className="k">Blocked since</span><span className="v">27 Aug, 13:02</span></div>
          </div>
          <div className="field">
            <label>Reason for unblocking <span className="dim">(required)</span></label>
            <textarea className="input" placeholder="e.g. Manual review confirms legitimate usage"></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setUnblockOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { setUnblockOpen(false); toast('Customer CUST-55021 unblocked. Recorded to audit log.'); }}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Confirm unblock</button>
        </div>
      </Modal>
    </>
  );
}
