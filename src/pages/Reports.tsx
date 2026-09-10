import { useState } from 'react';
import { RequireButton } from '../shared/RequireButton';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/ToastContext';
import { api, ApiError } from '../lib/api';

type ReportKey = 'recent' | 'successful' | 'pg' | 'supercoin' | 'voucher-failures' | 'wallet' | 'refund' | 'customer-history';

interface ReportDef {
  key: ReportKey;
  title: string;
  description: string;
  badge: string;
  supported: boolean;
}

const REPORTS: ReportDef[] = [
  { key: 'recent', title: 'Recent transactions', description: 'Gift360 orders from the last 10 days.', badge: 'Last 10 days', supported: true },
  { key: 'successful', title: 'Successful orders', description: 'Orders with voucher status GENERATED.', badge: 'Custom range', supported: true },
  { key: 'pg', title: 'PG orders', description: 'Orders paid via UPI or Card.', badge: 'Custom range', supported: true },
  { key: 'voucher-failures', title: 'Voucher failures', description: 'Date range + Voucher Generation Failed.', badge: 'Last 7 days', supported: true },
  { key: 'wallet', title: 'Wallet activity', description: 'Date range + wallet used / credited.', badge: 'Custom range', supported: false },
  { key: 'refund', title: 'Refund report', description: 'Date range + refund status.', badge: 'Last 30 days', supported: false },
  { key: 'customer-history', title: 'Customer order history', description: 'Search customer / mobile → all authorized orders.', badge: 'Lookup', supported: true },
];

interface ReportRow {
  [key: string]: unknown;
}

async function runReport(key: ReportKey, customerId: string): Promise<{ columns: string[]; rows: ReportRow[] }> {
  if (key === 'recent') {
    const res = await api.get<{ data: ReportRow[] }>('/orders', { size: 20 });
    return { columns: ['order_number', 'client_name', 'total_amount', 'order_status', 'created_at'], rows: res.data };
  }
  if (key === 'successful') {
    const res = await api.get<{ data: ReportRow[] }>('/orders', { voucherStatus: 'GENERATED', size: 50 });
    return { columns: ['order_number', 'client_name', 'total_amount', 'voucher_status', 'created_at'], rows: res.data };
  }
  if (key === 'pg') {
    const res = await api.get<{ data: ReportRow[] }>('/orders', { paymentMethod: 'UPI', size: 50 });
    return { columns: ['order_number', 'client_name', 'total_amount', 'payment_method', 'created_at'], rows: res.data };
  }
  if (key === 'voucher-failures') {
    const res = await api.get<{ data: ReportRow[] }>('/vouchers/failed');
    return { columns: ['orderNumber', 'quantity', 'lineTotal', 'status', 'paidAt'], rows: res.data };
  }
  if (key === 'customer-history') {
    if (!customerId) return { columns: [], rows: [] };
    const res = await api.get<{ data: ReportRow[] }>(`/customers/${customerId}/journey`);
    return { columns: ['event_at', 'event_type', 'ref', 'status_detail', 'amount', 'detail'], rows: res.data };
  }
  return { columns: [], rows: [] };
}

export function Reports() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportDef | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [result, setResult] = useState<{ columns: string[]; rows: ReportRow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openReport(def: ReportDef) {
    setActiveReport(def);
    setResult(null);
    setError(null);
    setModalOpen(true);
    if (def.supported && def.key !== 'customer-history') {
      load(def.key, '');
    }
  }

  async function load(key: ReportKey, custId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await runReport(key, custId);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Report failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Self-service reports</h2>
          <div className="desc">Cards marked "Not backend-supported yet" have no matching endpoint in the admin API.</div>
        </div>
      </div>
      <div className="report-grid">
        {REPORTS.map((def) => (
          <div className="report-card" key={def.key}>
            <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div>
            <h4>{def.title}</h4>
            <p>{def.description}</p>
            <div className="r-foot">
              <span className={'badge ' + (def.supported ? 'neutral' : 'warning')}>{def.supported ? def.badge : 'Not backend-supported yet'}</span>
              <button className="btn btn-sm" onClick={() => openReport(def)}>Run report</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-head"><h3>{activeReport?.title}</h3><button className="icon-btn" onClick={() => setModalOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button></div>
        <div className="modal-body">
          {activeReport && !activeReport.supported && (
            <div className="impact-box">
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>
              <span>There is no backend endpoint that returns this report's data yet.</span>
            </div>
          )}
          {activeReport?.key === 'customer-history' && (
            <div className="filterbar">
              <div className="search-wrap grow">
                <input className="input" placeholder="Customer / client UUID…" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={() => load('customer-history', customerId.trim())} disabled={!customerId.trim()}>Look up</button>
            </div>
          )}
          {loading && <p className="dim">Loading…</p>}
          {error && <div className="impact-box"><span>{error}</span></div>}
          {result && result.rows.length === 0 && !loading && activeReport?.supported && <p className="dim">No rows returned.</p>}
          {result && result.rows.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr>{result.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {result.columns.map((c) => <td key={c}>{String(row[c] ?? '—')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setModalOpen(false)}>Close</button>
          <RequireButton requires="reports:export" className="btn btn-primary" onClick={() => toast('CSV export is not implemented in the API yet.', 'err')}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5" /><path d="M4 19h16" /></svg> Export
          </RequireButton>
        </div>
      </Modal>
    </>
  );
}
