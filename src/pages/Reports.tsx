import { useState } from 'react';
import { RequireButton } from '../shared/RequireButton';
import { Modal } from '../shared/Modal';
import { useToast } from '../shared/ToastContext';

export function Reports() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('Run report');

  const openReport = (title: string) => {
    setReportTitle('Run: ' + title);
    setModalOpen(true);
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Self-service reports</h2>
          <div className="desc">Controlled filters replace manual SQL for the queries operators run every day. Filters persist through pagination and export.</div>
        </div>
      </div>
      <div className="report-grid">
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
          <h4>Recent transactions</h4>
          <p>Gift360 orders from the last 10 days.</p>
          <div className="r-foot">
            <span className="badge neutral">Last 10 days</span>
            <button className="btn btn-sm" onClick={() => openReport('Recent transactions')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
          <h4>Successful orders</h4>
          <p>Date range + Success status.</p>
          <div className="r-foot">
            <span className="badge neutral">Custom range</span>
            <button className="btn btn-sm" onClick={() => openReport('Successful orders')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg></div>
          <h4>PG orders</h4>
          <p>Date range + Normal PG order.</p>
          <div className="r-foot">
            <span className="badge neutral">Custom range</span>
            <button className="btn btn-sm" onClick={() => openReport('PG orders')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M3 13h18"/><path d="M12 9c-1.5 0-4-1-4-3a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 2-2.5 3-4 3z"/></svg></div>
          <h4>SuperCoin orders</h4>
          <p>Date range + SuperCoin order.</p>
          <div className="r-foot">
            <span className="badge neutral">Custom range</span>
            <button className="btn btn-sm" onClick={() => openReport('SuperCoin orders')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><path d="M9 3v18" strokeDasharray="2 2"/></svg></div>
          <h4>Voucher failures</h4>
          <p>Date range + Voucher Generation Failed.</p>
          <div className="r-foot">
            <span className="badge neutral">Last 7 days</span>
            <button className="btn btn-sm" onClick={() => openReport('Voucher failures')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/><path d="M17 12h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z"/></svg></div>
          <h4>Wallet activity</h4>
          <p>Date range + wallet used / credited.</p>
          <div className="r-foot">
            <span className="badge neutral">Custom range</span>
            <button className="btn btn-sm" onClick={() => openReport('Wallet activity')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2" strokeLinecap="round"/></svg></div>
          <h4>Refund report</h4>
          <p>Date range + refund status.</p>
          <div className="r-foot">
            <span className="badge neutral">Last 30 days</span>
            <button className="btn btn-sm" onClick={() => openReport('Refund report')}>Run report</button>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4.2 1.7"/><path d="M17 8l5 5M22 8l-5 5"/></svg></div>
          <h4>Customer order history</h4>
          <p>Search customer / mobile → all authorized orders.</p>
          <div className="r-foot">
            <span className="badge neutral">Lookup</span>
            <button className="btn btn-sm" onClick={() => openReport('Customer order history')}>Run report</button>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: '26px' }}>
        <div>
          <h2>Recently generated</h2>
          <div className="desc">Reports run in the last 24 hours — re-download or re-run with the same filters</div>
        </div>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Report</th><th>Filters</th><th>Run by</th><th>Generated</th><th>Rows</th><th></th></tr></thead>
            <tbody>
              <tr><td>Voucher failures</td><td className="muted">Last 7 days · Voucher Generation Failed</td><td>Arjun K.</td><td className="num muted">10 min ago</td><td className="num">312</td>
                <td><RequireButton requires="export" className="btn btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> CSV</RequireButton></td></tr>
              <tr><td>Successful orders</td><td className="muted">01–27 Aug · Success</td><td>Meera J.</td><td className="num muted">44 min ago</td><td className="num">21,904</td>
                <td><RequireButton requires="export" className="btn btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> CSV</RequireButton></td></tr>
              <tr><td>Refund report</td><td className="muted">Last 30 days · All statuses</td><td>Ravi M.</td><td className="num muted">2h ago</td><td className="num">861</td>
                <td><RequireButton requires="export" className="btn btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> CSV</RequireButton></td></tr>
              <tr><td>Wallet activity</td><td className="muted">Last 10 days · Credited</td><td>Priya S.</td><td className="num muted">5h ago</td><td className="num">4,120</td>
                <td><RequireButton requires="export" className="btn btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> CSV</RequireButton></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="modal-head"><h3>{reportTitle}</h3><button className="icon-btn" onClick={() => setModalOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
        <div className="modal-body">
          <div className="field">
            <label>Date range</label>
            <div className="chip-group" style={{ width: 'fit-content' }}>
              <span className="chip">Today</span><span className="chip">7d</span><span className="chip active">10d</span><span className="chip">30d</span><span className="chip">Custom</span>
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>Status</label><select className="select" style={{ width: '100%' }}><option>Any</option><option>Success</option><option>Failed</option><option>Pending</option></select></div>
            <div className="field"><label>Order type</label><select className="select" style={{ width: '100%' }}><option>Any</option><option>Normal PG order</option><option>SuperCoin order</option></select></div>
          </div>
          <div className="field"><label>Output format</label><select className="select" style={{ width: '100%' }}><option>CSV</option><option>Excel (.xlsx)</option></select></div>
          <div className="locked-note"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> Large result sets are paginated server-side; exports run through the backend.</div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
          <RequireButton requires="export" className="btn btn-primary" onClick={() => { setModalOpen(false); toast('Report queued — you will be notified when export is ready.'); }}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> Generate</RequireButton>
        </div>
      </Modal>
    </>
  );
}
