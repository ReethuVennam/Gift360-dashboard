import { useMemo, useState } from 'react';
import { RequireButton } from '../shared/RequireButton';
import { useToast } from '../shared/ToastContext';
import { api } from '../lib/api';
import { useFetch } from '../lib/useApi';

interface AuditRow {
  id: number;
  admin_username: string;
  action: string;
  module: string;
  target_entity: string | null;
  target_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  result: string;
  created_at: string;
}

const MODULES = ['auth', 'customer', 'voucher', 'config', 'order'];

type RangeKey = 'today' | '7d' | '30d';

function rangeToDates(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (range === '7d') from.setDate(from.getDate() - 7);
  else if (range === '30d') from.setDate(from.getDate() - 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export function AuditLog() {
  const toast = useToast();
  const [module, setModule] = useState('');
  const [range, setRange] = useState<RangeKey>('7d');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('');

  const { from, to } = rangeToDates(range);
  const list = useFetch(
    () =>
      api.get<{ data: AuditRow[]; page: number; size: number }>('/audit', {
        module: module || undefined,
        from,
        to,
        page,
        size: 50,
      }),
    [module, from, to, page]
  );

  const admins = useMemo(() => {
    const names = new Set((list.data?.data ?? []).map((r) => r.admin_username));
    return Array.from(names);
  }, [list.data]);

  const rows = (list.data?.data ?? []).filter((r) => {
    if (adminFilter && r.admin_username !== adminFilter) return false;
    if (search) {
      const needle = search.toLowerCase();
      const haystack = `${r.target_id ?? ''} ${r.target_entity ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <>
      <div className="panel">
        <div className="filterbar">
          <select className="select" value={module} onChange={(e) => { setPage(0); setModule(e.target.value); }}>
            <option value="">All modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="select" value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
            <option value="">All admins (this page)</option>
            {admins.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="chip-group">
            <span className={'chip' + (range === 'today' ? ' active' : '')} onClick={() => { setPage(0); setRange('today'); }}>Today</span>
            <span className={'chip' + (range === '7d' ? ' active' : '')} onClick={() => { setPage(0); setRange('7d'); }}>7d</span>
            <span className={'chip' + (range === '30d' ? ' active' : '')} onClick={() => { setPage(0); setRange('30d'); }}>30d</span>
          </div>
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input className="input" placeholder="Target ID (order, customer, config)…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <RequireButton requires="audit:view" className="btn btn-primary" onClick={() => toast('CSV export is not implemented in the API yet.', 'err')}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5" /><path d="M4 19h16" /></svg> Export
          </RequireButton>
        </div>
        {list.error && <div className="impact-box"><span>{list.error}</span></div>}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Module</th><th>Action</th><th>Target</th><th>Before → After</th><th>Reason</th><th>Result</th></tr></thead>
            <tbody>
              {list.loading && <tr><td colSpan={8} className="dim">Loading…</td></tr>}
              {!list.loading && rows.length === 0 && <tr><td colSpan={8} className="dim">No audit records found.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="num muted">{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.admin_username}</td>
                  <td><span className="badge info">{r.module}</span></td>
                  <td>{r.action}</td>
                  <td className="id-cell">{r.target_id ?? r.target_entity ?? '—'}</td>
                  <td className="mono">{r.previous_value ?? '—'} → {r.new_value ?? '—'}</td>
                  <td className="muted">{r.reason ?? '—'}</td>
                  <td><span className={'badge ' + (r.result === 'SUCCESS' ? 'success' : 'critical')}>{r.result}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <div className="pager-btns">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
            <span className="mono" style={{ padding: '0 8px' }}>Page {page + 1}</span>
            <button disabled={(list.data?.data.length ?? 0) < 50} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
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
