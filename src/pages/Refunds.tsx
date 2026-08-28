import { useState } from 'react';
import { RequireButton } from '../shared/RequireButton';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/ToastContext';
import { CountUp } from '../shared/CountUp';

interface RefundInfo {
  order: string;
  customer: string;
  amount: string;
  txn: string;
}

export function Refunds() {
  const toast = useToast();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refund, setRefund] = useState<RefundInfo>({
    order: 'GF-88190',
    customer: 'Karan Bose',
    amount: '₹3,999',
    txn: 'PG-TXN-9915',
  });

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi-card warn"><span className="kpi-bar warning"></span><div className="kpi-label">Pending</div><CountUp target={41} className="kpi-value" /></div>
        <div className="kpi-card"><span className="kpi-bar success"></span><div className="kpi-label">Successful today</div><CountUp target={118} className="kpi-value" /></div>
        <div className="kpi-card crit"><span className="kpi-bar critical"></span><div className="kpi-label">Failed</div><CountUp target={9} className="kpi-value" /></div>
        <div className="kpi-card"><span className="kpi-bar accent"></span><div className="kpi-label">Refunded amount today</div><CountUp target={184230} prefix="₹" className="kpi-value" /></div>
      </div>

      <div className="panel">
        <div className="filterbar">
          <div className="chip-group"><span className="chip active">All</span><span className="chip">Pending</span><span className="chip">Success</span><span className="chip">Failed</span></div>
          <div className="search-wrap grow"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg><input className="input" placeholder="Order ID, PG reference or customer…" /></div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>PG Ref</th><th>Status</th><th>Requested</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td className="id-cell">GF-88190</td><td>Karan Bose</td><td className="num">₹3,999</td><td className="num muted">PG-TXN-9915</td>
                <td><span className="badge critical">Failed</span></td><td className="num muted">14:03</td>
                <td>
                  <RequireButton
                    requires="refund"
                    className="btn btn-sm"
                    onClick={() => {
                      setRefund({ order: 'GF-88190', customer: 'Karan Bose', amount: '₹3,999', txn: 'PG-TXN-9915' });
                      setRefundOpen(true);
                    }}
                  >
                    Retry refund
                  </RequireButton>
                </td>
              </tr>
              <tr>
                <td className="id-cell">GF-87990</td><td>Meera J.</td><td className="num">₹1,240</td><td className="num muted">PG-TXN-9820</td>
                <td><span className="badge warning">Pending</span></td><td className="num muted">13:52</td>
                <td><button className="btn btn-sm btn-ghost">Track</button></td>
              </tr>
              <tr>
                <td className="id-cell">GF-87877</td><td>Sanjay Dutt</td><td className="num">₹2,150</td><td className="num muted">PG-TXN-9711</td>
                <td><span className="badge success">Success</span></td><td className="num muted">Yesterday</td>
                <td><button className="btn btn-sm btn-ghost">View</button></td>
              </tr>
              <tr>
                <td className="id-cell">GF-87801</td><td>Nikita Rao</td><td className="num">₹880</td><td className="num muted">PG-TXN-9670</td>
                <td><span className="badge warning">Eligible — not initiated</span></td><td className="num muted">Yesterday</td>
                <td>
                  <RequireButton
                    requires="refund"
                    className="btn btn-sm"
                    onClick={() => {
                      setRefund({ order: 'GF-87801', customer: 'Nikita Rao', amount: '₹880', txn: 'PG-TXN-9670' });
                      setRefundOpen(true);
                    }}
                  >
                    Initiate refund
                  </RequireButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Standard refund flow</h3><div className="desc">Every refund follows the same auditable sequence, regardless of who initiates it</div></div>
        <div className="panel-body">
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">1 · Identify</span><p className="dim" style={{ fontSize: '11px' }}>Open the eligible order/payment.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">2 · Eligibility</span><p className="dim" style={{ fontSize: '11px' }}>Backend validates refund is allowed.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">3 · Confirmation</span><p className="dim" style={{ fontSize: '11px' }}>Amount, reference and impact shown.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">4 · Execute</span><p className="dim" style={{ fontSize: '11px' }}>Backend performs the operation.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">5 · Result</span><p className="dim" style={{ fontSize: '11px' }}>Success, pending or failure shown.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">6 · Audit</span><p className="dim" style={{ fontSize: '11px' }}>Actor, time, amount, reason recorded.</p></div>
          </div>
        </div>
      </div>

      <Modal open={refundOpen} onClose={() => setRefundOpen(false)}>
        <div className="modal-head"><h3>Initiate refund</h3><button className="icon-btn" onClick={() => setRefundOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div>
        <div className="modal-body">
          <div className="impact-box"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg><span>This sends a refund instruction to the payment provider. It cannot be undone once executed.</span></div>
          <div className="kv-list">
            <div className="kv-row"><span className="k">Order</span><span className="v">{refund.order}</span></div>
            <div className="kv-row"><span className="k">Customer</span><span className="v">{refund.customer}</span></div>
            <div className="kv-row"><span className="k">Refund amount</span><span className="v">{refund.amount}</span></div>
            <div className="kv-row"><span className="k">PG reference</span><span className="v">{refund.txn}</span></div>
          </div>
          <div className="field"><label>Reason <span className="dim">(required)</span></label><textarea className="input" placeholder="e.g. Customer-confirmed non-delivery"></textarea></div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setRefundOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setRefundOpen(false);
              toast('Refund request sent — result will appear once the provider responds.');
            }}
          >
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> Confirm & execute
          </button>
        </div>
      </Modal>
    </>
  );
}
