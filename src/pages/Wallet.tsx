import { useState } from "react";
import { RequireButton } from "../shared/RequireButton";
import { Modal } from "../shared/Modal";
import { useToast } from "../shared/ToastContext";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface ConfigEntry {
  config_key: string;
  config_value: string;
}

interface WalletBalance {
  voucher_cashback_balance: number;
  total_balance: number;
  pending_earn_fraction: number;
}

interface WalletTxn {
  transaction_type: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  created_at: string;
  notes: string | null;
}

export function Wallet() {
  const toast = useToast();
  const config = useFetch(() => api.get<{ data: ConfigEntry[] }>("/config/wallet"), []);

  const [editKey, setEditKey] = useState<ConfigEntry | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(entry: ConfigEntry) {
    setEditKey(entry);
    setEditValue(entry.config_value);
    setEditReason("");
  }

  async function confirmEdit() {
    if (!editKey) return;
    setSaving(true);
    try {
      await api.put(`/config/wallet`, { key: editKey.config_key, value: editValue, reason: editReason });
      toast(`${editKey.config_key} update sent. Note: config updates are not yet persisted server-side.`);
      setEditKey(null);
      config.refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "err");
    } finally {
      setSaving(false);
    }
  }

  const [clientIdInput, setClientIdInput] = useState("");
  const [lookupId, setLookupId] = useState<string | null>(null);
  const walletDetail = useFetch(
    () => (lookupId ? api.get<{ data: [WalletBalance, WalletTxn[]] }>(`/wallet/${lookupId}`) : Promise.resolve(null)),
    [lookupId]
  );
  const balance = walletDetail.data?.data[0];
  const txns = walletDetail.data?.data[1] ?? [];

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  async function submitAdjustment() {
    if (!lookupId || !adjustAmount.trim() || !adjustReason.trim()) return;
    setAdjustSubmitting(true);
    try {
      await api.post(`/wallet/${lookupId}/adjustment-requests`, {
        amount: Number(adjustAmount),
        direction: adjustDirection,
        reason: adjustReason,
      });
      toast(`Wallet adjustment request submitted — awaiting approval.`);
      setAdjustOpen(false);
      setAdjustAmount("");
      setAdjustReason("");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Request failed", "err");
    } finally {
      setAdjustSubmitting(false);
    }
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Wallet configuration</h3>
            <div className="desc">Live from <span className="mono">GET /config/wallet</span> — updates are sent to the backend but not yet persisted (placeholder endpoint).</div>
          </div>
        </div>
        {config.error && <div className="impact-box"><span>{config.error}</span></div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
            <tbody>
              {config.loading && <tr><td colSpan={3} className="dim">Loading…</td></tr>}
              {!config.loading && (config.data?.data.length ?? 0) === 0 && <tr><td colSpan={3} className="dim">No config entries returned.</td></tr>}
              {config.data?.data.map((entry) => (
                <tr key={entry.config_key}>
                  <td className="mono">{entry.config_key}</td>
                  <td className="num">{entry.config_value}</td>
                  <td><RequireButton requires="config:manage" className="btn btn-sm" onClick={() => openEdit(entry)}>Edit</RequireButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Customer wallet lookup</h3>
            <div className="desc">There's no multi-customer wallet activity feed in the API yet — look up one customer's balance and transactions by client ID.</div>
          </div>
        </div>
        <div className="panel-body">
          <div className="filterbar">
            <div className="search-wrap grow">
              <input
                className="input"
                placeholder="Customer / client UUID…"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setLookupId(clientIdInput.trim()); }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setLookupId(clientIdInput.trim())} disabled={!clientIdInput.trim()}>Look up</button>
          </div>

          {walletDetail.loading && <p className="dim">Loading…</p>}
          {walletDetail.error && <div className="impact-box"><span>{walletDetail.error}</span></div>}

          {balance && (
            <>
              <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: "12px" }}>
                <div className="kpi-card"><span className="kpi-bar accent"></span><div className="kpi-label">Total balance</div><div className="kpi-value">₹{balance.total_balance}</div></div>
                <div className="kpi-card"><span className="kpi-bar info"></span><div className="kpi-label">Voucher cashback balance</div><div className="kpi-value">₹{balance.voucher_cashback_balance}</div></div>
                <div className="kpi-card"><span className="kpi-bar warning"></span><div className="kpi-label">Pending earn fraction</div><div className="kpi-value">{balance.pending_earn_fraction}</div></div>
              </div>
              <div className="flex gap-8" style={{ marginTop: "12px" }}>
                <RequireButton requires="wallet:adjust:request" className="btn btn-sm btn-primary" onClick={() => setAdjustOpen(true)}>
                  Adjust balance
                </RequireButton>
              </div>
            </>
          )}

          {txns.length > 0 && (
            <div className="table-wrap" style={{ marginTop: "12px" }}>
              <table className="data-table">
                <thead><tr><th>Type</th><th>Amount</th><th>Previous</th><th>New</th><th>Notes</th><th>Time</th></tr></thead>
                <tbody>
                  {txns.map((t, i) => (
                    <tr key={i}>
                      <td><span className={"badge " + (t.transaction_type === "CREDIT" ? "success" : "warning")}>{t.transaction_type}</span></td>
                      <td className="num">₹{t.amount}</td>
                      <td className="num">₹{t.previous_balance}</td>
                      <td className="num">₹{t.new_balance}</td>
                      <td className="muted">{t.notes}</td>
                      <td className="num muted">{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!editKey} onClose={() => setEditKey(null)}>
        <div className="modal-head"><h3>Update {editKey?.config_key}</h3><button className="icon-btn" onClick={() => setEditKey(null)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div>
        <div className="modal-body">
          <div className="impact-box"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg><span>This backend endpoint currently echoes the value back but does not persist it.</span></div>
          <div className="field">
            <label>New value</label>
            <input className="input" style={{ width: "100%" }} value={editValue} onChange={(e) => setEditValue(e.target.value)} />
          </div>
          <div className="field">
            <label>Reason <span className="dim">(required)</span></label>
            <textarea className="input" value={editReason} onChange={(e) => setEditReason(e.target.value)}></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setEditKey(null)}>Cancel</button>
          <button className="btn btn-primary" disabled={!editReason.trim() || saving} onClick={confirmEdit}>{saving ? "Saving…" : "Confirm"}</button>
        </div>
      </Modal>

      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)}>
        <div className="modal-head">
          <h3>Adjust wallet balance</h3>
          <button className="icon-btn" onClick={() => setAdjustOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="modal-body">
          <div className="impact-box"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg><span>This submits a request — a second approver has to review and approve it before the balance actually changes.</span></div>
          <div className="kv-list">
            <div className="kv-row"><span className="k">Customer ID</span><span className="v mono">{lookupId}</span></div>
          </div>
          <div className="field">
            <label>Direction</label>
            <select className="select" value={adjustDirection} onChange={(e) => setAdjustDirection(e.target.value as "credit" | "debit")}>
              <option value="credit">Credit (add funds)</option>
              <option value="debit">Debit (remove funds)</option>
            </select>
          </div>
          <div className="field">
            <label>Amount (₹)</label>
            <input className="input" type="number" min="0" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
          </div>
          <div className="field">
            <label>Reason <span className="dim">(required)</span></label>
            <textarea className="input" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}></textarea>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setAdjustOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!adjustAmount.trim() || Number(adjustAmount) <= 0 || !adjustReason.trim() || adjustSubmitting}
            onClick={submitAdjustment}
          >
            {adjustSubmitting ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </Modal>
    </>
  );
}
