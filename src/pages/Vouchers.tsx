import { useState } from "react";
import { RequireButton } from "../shared/RequireButton";
import { Modal, CloseIcon } from "../shared/Modal";
import { useToast } from "../shared/ToastContext";
import { CountUp } from "../shared/CountUp";

export function Vouchers() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"generation" | "config">("generation");

  const [retryOpen, setRetryOpen] = useState(false);
  const [retryOrder, setRetryOrder] = useState("GF-88213");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <>
      <div className="tabs">
        <a
          className={"tab" + (activeTab === "generation" ? " active" : "")}
          href="#generation"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("generation");
          }}
        >
          Voucher Generation
        </a>
        <a
          className={"tab" + (activeTab === "config" ? " active" : "")}
          href="#config"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("config");
          }}
        >
          Discount Configuration
        </a>
      </div>

      <div id="generation" style={{ marginTop: "18px" }}>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <div className="kpi-card">
            <span className="kpi-bar success"></span>
            <div className="kpi-label">Generated</div>
            <CountUp target={4106} className="kpi-value" />
          </div>
          <div className="kpi-card warn">
            <span className="kpi-bar warning"></span>
            <div className="kpi-label">Pending</div>
            <CountUp target={312} className="kpi-value" />
          </div>
          <div className="kpi-card crit">
            <span className="kpi-bar critical"></span>
            <div className="kpi-label">Failed</div>
            <CountUp target={187} className="kpi-value" />
          </div>
          <div className="kpi-card">
            <span className="kpi-bar info"></span>
            <div className="kpi-label">Retry-eligible</div>
            <CountUp target={89} className="kpi-value" />
          </div>
        </div>

        <div className="panel">
          <div className="filterbar">
            <div className="chip-group">
              <span className="chip">All</span>
              <span className="chip active">Failed</span>
              <span className="chip">Pending</span>
              <span className="chip">Retry-eligible</span>
            </div>
            <div className="search-wrap grow">
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input className="input" placeholder="Order ID or customer…" />
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Failure reason</th>
                  <th>Retry count</th>
                  <th>Last attempt</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="id-cell">GF-88213</td>
                  <td>Neha Kapoor</td>
                  <td>
                    <span className="badge critical">Failed</span>
                  </td>
                  <td className="muted">Provider timeout (504)</td>
                  <td className="num">1</td>
                  <td className="num muted">14:29</td>
                  <td>
                    <RequireButton
                      requires="retry"
                      className="btn btn-sm"
                      onClick={() => {
                        setRetryOrder("GF-88213");
                        setRetryOpen(true);
                      }}
                    >
                      <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 3-6.7" />
                        <path d="M3 4v5h5" />
                        <path d="M12 8v4l3 2" />
                      </svg>{" "}
                      Retry
                    </RequireButton>
                  </td>
                </tr>
                <tr>
                  <td className="id-cell">GF-88176</td>
                  <td>Divya Nair</td>
                  <td>
                    <span className="badge success">Success</span>
                  </td>
                  <td className="muted">Recovered on retry #2</td>
                  <td className="num">2</td>
                  <td className="num muted">13:59</td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => setHistoryOpen(true)}>
                      History
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="id-cell">GF-88099</td>
                  <td>Ritu Sharma</td>
                  <td>
                    <span className="badge critical">Failed</span>
                  </td>
                  <td className="muted">Invalid SuperCoin balance snapshot</td>
                  <td className="num">0</td>
                  <td className="num muted">12:58</td>
                  <td>
                    <RequireButton
                      requires="retry"
                      className="btn btn-sm"
                      onClick={() => {
                        setRetryOrder("GF-88099");
                        setRetryOpen(true);
                      }}
                    >
                      <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 3-6.7" />
                        <path d="M3 4v5h5" />
                        <path d="M12 8v4l3 2" />
                      </svg>{" "}
                      Retry
                    </RequireButton>
                  </td>
                </tr>
                <tr>
                  <td className="id-cell">GF-87994</td>
                  <td>Anil Roy</td>
                  <td>
                    <span className="badge warning">Retry-eligible</span>
                  </td>
                  <td className="muted">Provider 5xx — auto backoff exhausted</td>
                  <td className="num">1</td>
                  <td className="num muted">11:40</td>
                  <td>
                    <RequireButton
                      requires="retry"
                      className="btn btn-sm"
                      onClick={() => {
                        setRetryOrder("GF-87994");
                        setRetryOpen(true);
                      }}
                    >
                      <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 3-6.7" />
                        <path d="M3 4v5h5" />
                        <path d="M12 8v4l3 2" />
                      </svg>{" "}
                      Retry
                    </RequireButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="config">
        <div className="section-head">
          <h2>Voucher discount configuration</h2>
        </div>
        <div className="grid-2">
          <div className="config-card">
            <span className="cur-label">Current discount percentage</span>
            <span className="cur-value">15%</span>
            <div className="dim" style={{ fontSize: "11.5px" }}>
              Last changed 14:10 IST by Arjun K. — festive campaign.
            </div>
            <hr className="rule" />
            <div className="field">
              <label>New discount percentage</label>
              <input className="input" type="number" placeholder="e.g. 18" min={0} max={50} style={{ width: "100%" }} />
              <div className="hint">Permitted range: 0%–50%. Values outside range are rejected server-side.</div>
            </div>
            <div className="field">
              <label>
                Reason for change <span className="dim">(required)</span>
              </label>
              <textarea className="input" placeholder="e.g. Reverting festive campaign rate"></textarea>
            </div>
            <RequireButton requires="config" className="btn btn-primary" onClick={() => setConfigOpen(true)}>
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>{" "}
              Save change
            </RequireButton>
            <div className="locked-note">
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>{" "}
              Production-impacting — requires confirmation and is fully audited.
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-head">
              <h3>Change history</h3>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Old</th>
                    <th>New</th>
                    <th>Admin</th>
                    <th>When</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">12%</td>
                    <td className="num">15%</td>
                    <td>Arjun K.</td>
                    <td className="muted">Today, 14:10</td>
                    <td className="muted">Festive campaign</td>
                  </tr>
                  <tr>
                    <td className="num">15%</td>
                    <td className="num">12%</td>
                    <td>Meera J.</td>
                    <td className="muted">18 Aug</td>
                    <td className="muted">Campaign end</td>
                  </tr>
                  <tr>
                    <td className="num">10%</td>
                    <td className="num">15%</td>
                    <td>Ravi M.</td>
                    <td className="muted">02 Aug</td>
                    <td className="muted">Onboarding promo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal open={retryOpen} onClose={() => setRetryOpen(false)}>
        <div className="modal-head">
          <h3>Retry voucher generation</h3>
          <CloseIcon onClick={() => setRetryOpen(false)} />
        </div>
        <div className="modal-body">
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Order</span>
              <span className="v">{retryOrder}</span>
            </div>
          </div>
          <div className="impact-box">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <span>Retry is idempotent — re-issuing will not duplicate a voucher if one already exists for this order.</span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setRetryOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setRetryOpen(false);
              toast("Retry queued for " + retryOrder + ".");
            }}
          >
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 8v4l3 2" />
            </svg>{" "}
            Confirm retry
          </button>
        </div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)}>
        <div className="modal-head">
          <h3>Retry history — GF-88176</h3>
          <CloseIcon onClick={() => setHistoryOpen(false)} />
        </div>
        <div className="modal-body">
          <div className="timeline">
            <div className="t-item">
              <span className="t-dot success"></span>
              <div className="t-time">13:59:04</div>
              <div className="t-title">Retry #2 succeeded</div>
              <div className="t-desc">Voucher issued. Idempotency key matched no prior success.</div>
            </div>
            <div className="t-item">
              <span className="t-dot critical"></span>
              <div className="t-time">13:58:10</div>
              <div className="t-title">Retry #1 failed</div>
              <div className="t-desc">Provider returned 502.</div>
            </div>
            <div className="t-item">
              <span className="t-dot critical"></span>
              <div className="t-time">13:58:02</div>
              <div className="t-title">Initial generation failed</div>
              <div className="t-desc">Provider timeout (504).</div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setHistoryOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      <Modal open={configOpen} onClose={() => setConfigOpen(false)}>
        <div className="modal-head">
          <h3>Confirm discount change</h3>
          <CloseIcon onClick={() => setConfigOpen(false)} />
        </div>
        <div className="modal-body">
          <div className="impact-box">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <span>This change applies to all new voucher generations immediately and affects live customers.</span>
          </div>
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Current value</span>
              <span className="v">15%</span>
            </div>
            <div className="kv-row">
              <span className="k">New value</span>
              <span className="v">—</span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setConfigOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setConfigOpen(false);
              toast("Voucher discount updated. Recorded to audit log.");
            }}
          >
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>{" "}
            Confirm & save
          </button>
        </div>
      </Modal>
    </>
  );
}
