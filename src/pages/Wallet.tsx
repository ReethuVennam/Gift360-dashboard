import { useState } from "react";
import { RequireButton } from "../shared/RequireButton";
import { Modal } from "../shared/Modal";
import { useToast } from "../shared/ToastContext";
import { CountUp } from "../shared/CountUp";

export function Wallet() {
  const toast = useToast();
  const [deductionOpen, setDeductionOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="kpi-card">
          <span className="kpi-bar accent"></span>
          <div className="kpi-label">Wallet used today</div>
          <CountUp target={512340} prefix="₹" className="kpi-value" />
        </div>
        <div className="kpi-card">
          <span className="kpi-bar success"></span>
          <div className="kpi-label">Wallet credited today</div>
          <CountUp target={98410} prefix="₹" className="kpi-value" />
        </div>
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-label">SuperCoins used</div>
          <CountUp target={41820} className="kpi-value" />
        </div>
        <div className="kpi-card">
          <span className="kpi-bar info"></span>
          <div className="kpi-label">SuperCoins credited</div>
          <CountUp target={12990} className="kpi-value" />
        </div>
      </div>

      <div className="grid-2">
        <div className="config-card">
          <span className="cur-label">Wallet deduction rate</span>
          <span className="cur-value">2.0%</span>
          <div className="dim" style={{ fontSize: "11.5px" }}>Last changed 18 Aug by Meera J.</div>
          <hr className="rule" />
          <div className="field">
            <label>New deduction rate (%)</label>
            <input className="input" type="number" placeholder="e.g. 2.5" style={{ width: "100%" }} />
          </div>
          <div className="field">
            <label>Reason for change <span className="dim">(required)</span></label>
            <textarea className="input" placeholder="Reason for updating deduction rate"></textarea>
          </div>
          <RequireButton requires="config" className="btn btn-primary" onClick={() => setDeductionOpen(true)}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>{" "}
            Save deduction rate
          </RequireButton>
        </div>

        <div className="config-card">
          <span className="cur-label">Wallet credit rate</span>
          <span className="cur-value">1.5%</span>
          <div className="dim" style={{ fontSize: "11.5px" }}>Last changed 02 Aug by Ravi M.</div>
          <hr className="rule" />
          <div className="field">
            <label>New credit rate (%)</label>
            <input className="input" type="number" placeholder="e.g. 1.8" style={{ width: "100%" }} />
          </div>
          <div className="field">
            <label>Reason for change <span className="dim">(required)</span></label>
            <textarea className="input" placeholder="Reason for updating credit rate"></textarea>
          </div>
          <RequireButton requires="config" className="btn btn-primary" onClick={() => setCreditOpen(true)}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>{" "}
            Save credit rate
          </RequireButton>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Change history</h3>
            <div className="desc">Old value, new value, admin, timestamp and reason — every configuration change</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Old</th>
                <th>New</th>
                <th>Admin</th>
                <th>When</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Deduction rate</td>
                <td className="num">1.8%</td>
                <td className="num">2.0%</td>
                <td>Meera J.</td>
                <td className="muted">18 Aug</td>
                <td className="muted">Aligning with provider cost update</td>
              </tr>
              <tr>
                <td>Credit rate</td>
                <td className="num">1.2%</td>
                <td className="num">1.5%</td>
                <td>Ravi M.</td>
                <td className="muted">02 Aug</td>
                <td className="muted">Loyalty program boost</td>
              </tr>
              <tr>
                <td>Deduction rate</td>
                <td className="num">2.0%</td>
                <td className="num">1.8%</td>
                <td>Arjun K.</td>
                <td className="muted">14 Jul</td>
                <td className="muted">Temporary promo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Recent wallet / SuperCoins activity</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Wallet used</th>
                <th>Wallet credited</th>
                <th>SuperCoins used</th>
                <th>SuperCoins credited</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="id-cell">GF-88199</td>
                <td>Ayesha Khan</td>
                <td className="num">₹150</td>
                <td className="num">₹0</td>
                <td className="num">0</td>
                <td className="num">12</td>
                <td className="num muted">14:15</td>
              </tr>
              <tr>
                <td className="id-cell">GF-88150</td>
                <td>Farhan Sheikh</td>
                <td className="num">₹500</td>
                <td className="num">₹0</td>
                <td className="num">0</td>
                <td className="num">45</td>
                <td className="num muted">13:41</td>
              </tr>
              <tr>
                <td className="id-cell">GF-88041</td>
                <td>Priya S.</td>
                <td className="num">₹0</td>
                <td className="num">₹80</td>
                <td className="num">30</td>
                <td className="num">0</td>
                <td className="num muted">13:10</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={deductionOpen} onClose={() => setDeductionOpen(false)}>
        <div className="modal-head">
          <h3>Confirm deduction rate change</h3>
          <button className="icon-btn" onClick={() => setDeductionOpen(false)}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="impact-box">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <span>This rate applies to all wallet deductions from the next transaction onward.</span>
          </div>
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Current</span>
              <span className="v">2.0%</span>
            </div>
            <div className="kv-row">
              <span className="k">New</span>
              <span className="v">as entered</span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setDeductionOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setDeductionOpen(false);
              toast("Wallet deduction rate updated. Recorded to audit log.");
            }}
          >
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>{" "}
            Confirm
          </button>
        </div>
      </Modal>

      <Modal open={creditOpen} onClose={() => setCreditOpen(false)}>
        <div className="modal-head">
          <h3>Confirm credit rate change</h3>
          <button className="icon-btn" onClick={() => setCreditOpen(false)}>
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="impact-box">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
            <span>This rate applies to all wallet credits from the next transaction onward.</span>
          </div>
          <div className="kv-list">
            <div className="kv-row">
              <span className="k">Current</span>
              <span className="v">1.5%</span>
            </div>
            <div className="kv-row">
              <span className="k">New</span>
              <span className="v">as entered</span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => setCreditOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setCreditOpen(false);
              toast("Wallet credit rate updated. Recorded to audit log.");
            }}
          >
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>{" "}
            Confirm
          </button>
        </div>
      </Modal>
    </>
  );
}
