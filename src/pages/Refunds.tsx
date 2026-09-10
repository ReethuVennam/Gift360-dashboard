import { useState } from 'react';
import { RequireButton } from '../shared/RequireButton';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/ToastContext';
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
  const toast = useToast();
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

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMode, setRequestMode] = useState('wallet');
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  function openRequestModal() {
    setRequestAmount(result ? String(result.amount_final) : '');
    setRequestMode('wallet');
    setRequestReason('');
    setRequestOpen(true);
  }

  async function submitRefundRequest() {
    if (!result || !requestAmount.trim() || !requestReason.trim()) return;
    setRequestSubmitting(true);
    try {
      await api.post(`/refunds/${result.order_number}/requests`, {
        amount: Number(requestAmount),
        refund_mode: requestMode,
        reason: requestReason,
      });
      toast('Refund request submitted — awaiting approval.');
      setRequestOpen(false);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Request failed', 'err');
    } finally {
      setRequestSubmitting(false);
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
          {result && result.refund_eligibility === 'ELIGIBLE' && (
            <div className="flex gap-8" style={{ marginTop: '12px' }}>
              <RequireButton requires="refunds:request" className="btn btn-sm btn-primary" onClick={openRequestModal}>
                Request refund
              </RequireButton>
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

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)}>
        <div className="modal-head">
          <h3>Request refund</h3>
          <button className="icon-btn" onClick={() => setRequestOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="modal-body">
          <div className="impact-box"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg><span>This submits a request for a second approver to review. Approving only records the decision — there is no payment gateway integration yet, so the actual refund still needs to be executed manually.</span></div>
          <div className="kv-list">
            <div className="kv-row"><span className="k">Order</span><span className="v mono">{result?.order_number}</span></div>
          </div>
          <div className="field">
            <label>Refund mode</label>
            <select className="select" value={requestMode} onChange={(e) => setRequestMode(e.target.value)}>
              <option value="wallet">Wallet credit</option>
              <option value="source">Original payment source</option>
            </select>
          </div>
          <div className="field">
            <label>Amount (₹)</label>
            <input className="input" type="number" min="0" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} />
          </div>
          <div className="field">
            <label>Reason <span className="dim">(required)</span></label>
            <textarea className="input" value={requestReason} onChange={(e) => setRequestReason(e.target.value)}></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setRequestOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!requestAmount.trim() || Number(requestAmount) <= 0 || !requestReason.trim() || requestSubmitting}
            onClick={submitRefundRequest}
          >
            {requestSubmitting ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </Modal>
    </>
  );
}
