import { useState } from 'react';
import { api, ApiError } from '../lib/api';

interface RefundCheck {
  order_number: string;
  total_amount: number;
  order_status: string;
  payment_method: string;
  coins_redeemed: number;
  payment_status: string;
  processor: string;
  amount_final: number;
  refund_eligibility: string;
}

function eligibilityClass(e: string): string {
  if (e === 'ELIGIBLE') return 'success';
  if (e === 'SUPERCOIN_ORDER') return 'warning';
  return 'critical';
}

export function Refunds() {
  const [orderInput, setOrderInput] = useState('');
  const [result, setResult] = useState<RefundCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkEligibility() {
    if (!orderInput.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get<{ data: RefundCheck[] }>(`/refunds/${orderInput.trim()}/check`);
      setResult(res.data[0] ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="impact-box">
        <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>
        <span>The admin API only exposes a refund <b>eligibility check</b> — there is no refund-execution endpoint yet. Actual refunds still need to be run manually or through the payment gateway directly.</span>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Check refund eligibility</h3><div className="desc">Look up an order to see whether it qualifies for a refund</div></div>
        <div className="panel-body">
          <div className="filterbar">
            <div className="search-wrap grow">
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input
                className="input"
                placeholder="Order number, e.g. ORD260823B3132D0E5D3F"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') checkEligibility(); }}
              />
            </div>
            <button className="btn btn-primary" onClick={checkEligibility} disabled={loading || !orderInput.trim()}>
              {loading ? 'Checking…' : 'Check eligibility'}
            </button>
          </div>

          {error && <div className="impact-box"><span>{error}</span></div>}

          {result && (
            <div className="kv-list" style={{ marginTop: '12px' }}>
              <div className="kv-row"><span className="k">Order</span><span className="v">{result.order_number}</span></div>
              <div className="kv-row"><span className="k">Order status</span><span className="v">{result.order_status}</span></div>
              <div className="kv-row"><span className="k">Total amount</span><span className="v">₹{result.total_amount}</span></div>
              <div className="kv-row"><span className="k">Amount finalized</span><span className="v">₹{result.amount_final}</span></div>
              <div className="kv-row"><span className="k">Payment method</span><span className="v">{result.payment_method}</span></div>
              <div className="kv-row"><span className="k">Payment processor</span><span className="v">{result.processor}</span></div>
              <div className="kv-row"><span className="k">Payment status</span><span className="v">{result.payment_status}</span></div>
              <div className="kv-row"><span className="k">Coins redeemed</span><span className="v">{result.coins_redeemed}</span></div>
              <div className="kv-row"><span className="k">Refund eligibility</span><span className="v"><span className={"badge " + eligibilityClass(result.refund_eligibility)}>{result.refund_eligibility}</span></span></div>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Standard refund flow</h3><div className="desc">Every refund follows the same auditable sequence, regardless of who initiates it</div></div>
        <div className="panel-body">
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(6,1fr)', gap: '10px' }}>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">1 · Identify</span><p className="dim" style={{ fontSize: '11px' }}>Open the eligible order/payment.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">2 · Eligibility</span><p className="dim" style={{ fontSize: '11px' }}>Backend validates refund is allowed.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">3 · Confirmation</span><p className="dim" style={{ fontSize: '11px' }}>Amount, reference and impact shown.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">4 · Execute</span><p className="dim" style={{ fontSize: '11px' }}>Not available via this API yet.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">5 · Result</span><p className="dim" style={{ fontSize: '11px' }}>Success, pending or failure shown.</p></div>
            <div className="config-card" style={{ padding: '12px', gap: '6px' }}><span className="cur-label">6 · Audit</span><p className="dim" style={{ fontSize: '11px' }}>Actor, time, amount, reason recorded.</p></div>
          </div>
        </div>
      </div>
    </>
  );
}
