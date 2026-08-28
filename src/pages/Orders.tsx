import { useState } from "react";
import { Link } from "react-router-dom";
import { RequireButton } from "../shared/RequireButton";
import { Drawer } from "../shared/Drawer";

interface OrderRow {
  order: string;
  timestamp: string;
  customer: string;
  customerCell: string;
  type: string;
  typeBadge: string;
  typeBadgeClass: string;
  walletUsedCredited: string;
  superCoinsUsedCredited: string;
  pgAmount: string;
  pgRef: string;
  voucherLabel: string;
  voucherClass: string;
  status: string;
}

const ORDER_ROWS: OrderRow[] = [
  {
    order: "GF-88213",
    timestamp: "27 Aug, 14:29",
    customer: "Neha Kapoor · +91 98221xxxxx",
    customerCell: "Neha Kapoor",
    type: "Normal PG order",
    typeBadge: "PG",
    typeBadgeClass: "info",
    walletUsedCredited: "₹0 / ₹0",
    superCoinsUsedCredited: "0 / 0",
    pgAmount: "₹2,499",
    pgRef: "PG-TXN-9931",
    voucherLabel: "Failed",
    voucherClass: "critical",
    status: "Failed",
  },
  {
    order: "GF-88207",
    timestamp: "27 Aug, 14:22",
    customer: "Suresh Iyer · +91 90001xxxxx",
    customerCell: "Suresh Iyer",
    type: "SuperCoin order",
    typeBadge: "SuperCoin",
    typeBadgeClass: "neutral",
    walletUsedCredited: "₹0 / ₹0",
    superCoinsUsedCredited: "340 / 0",
    pgAmount: "₹0",
    pgRef: "—",
    voucherLabel: "Generated",
    voucherClass: "success",
    status: "Success",
  },
  {
    order: "GF-88199",
    timestamp: "27 Aug, 14:15",
    customer: "Ayesha Khan · +91 99887xxxxx",
    customerCell: "Ayesha Khan",
    type: "Normal PG order",
    typeBadge: "PG",
    typeBadgeClass: "info",
    walletUsedCredited: "₹150 / ₹0",
    superCoinsUsedCredited: "0 / 12",
    pgAmount: "₹1,850",
    pgRef: "PG-TXN-9924",
    voucherLabel: "Generated",
    voucherClass: "success",
    status: "Success",
  },
  {
    order: "GF-88190",
    timestamp: "27 Aug, 14:03",
    customer: "Karan Bose · +91 91234xxxxx",
    customerCell: "Karan Bose",
    type: "Normal PG order",
    typeBadge: "PG",
    typeBadgeClass: "info",
    walletUsedCredited: "₹0 / ₹0",
    superCoinsUsedCredited: "0 / 0",
    pgAmount: "₹3,999",
    pgRef: "PG-TXN-9915",
    voucherLabel: "Pending",
    voucherClass: "warning",
    status: "Pending",
  },
  {
    order: "GF-88176",
    timestamp: "27 Aug, 13:58",
    customer: "Divya Nair · +91 96543xxxxx",
    customerCell: "Divya Nair",
    type: "Normal PG order",
    typeBadge: "PG",
    typeBadgeClass: "info",
    walletUsedCredited: "₹0 / ₹0",
    superCoinsUsedCredited: "0 / 0",
    pgAmount: "₹999",
    pgRef: "PG-TXN-9902",
    voucherLabel: "Failed",
    voucherClass: "critical",
    status: "Success",
  },
  {
    order: "GF-88150",
    timestamp: "27 Aug, 13:41",
    customer: "Farhan Sheikh · +91 93456xxxxx",
    customerCell: "Farhan Sheikh",
    type: "Normal PG order",
    typeBadge: "PG",
    typeBadgeClass: "info",
    walletUsedCredited: "₹500 / ₹0",
    superCoinsUsedCredited: "0 / 45",
    pgAmount: "₹4,250",
    pgRef: "PG-TXN-9887",
    voucherLabel: "Generated",
    voucherClass: "success",
    status: "Success",
  },
  {
    order: "GF-88099",
    timestamp: "27 Aug, 12:58",
    customer: "Ritu Sharma · +91 92345xxxxx",
    customerCell: "Ritu Sharma",
    type: "SuperCoin order",
    typeBadge: "SuperCoin",
    typeBadgeClass: "neutral",
    walletUsedCredited: "₹0 / ₹0",
    superCoinsUsedCredited: "220 / 0",
    pgAmount: "₹0",
    pgRef: "—",
    voucherLabel: "Failed",
    voucherClass: "critical",
    status: "Failed",
  },
];

function statusBadgeClass(status: string): string {
  return status === "Success" ? "success" : status === "Pending" ? "warning" : "critical";
}

export function Orders() {
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const odId = selected?.order ?? "GF-88213";
  const odCustomer = selected?.customer ?? "Neha Kapoor";
  const odType = selected?.type ?? "Normal PG order";
  const odStatus = selected?.status ?? "Failed";

  return (
    <>
      <div className="panel">
        <div className="filterbar">
          <div className="chip-group">
            <span className="chip">Today</span>
            <span className="chip">Yesterday</span>
            <span className="chip">7d</span>
            <span className="chip active">10d</span>
            <span className="chip">30d</span>
            <span className="chip">Custom</span>
          </div>
          <select className="select">
            <option>All statuses</option>
            <option>Success</option>
            <option>Failed</option>
            <option>Pending</option>
          </select>
          <select className="select">
            <option>All order types</option>
            <option>Normal PG order</option>
            <option>SuperCoin order</option>
          </select>
          <select className="select">
            <option>All payment types</option>
            <option>Card</option>
            <option>UPI</option>
            <option>Wallet</option>
          </select>
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input className="input" placeholder="Order ID, customer, mobile or reference…" />
          </div>
          <button className="btn"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16M7 10h10M10 15h4"/></svg> More filters</button>
          <RequireButton requires="export" className="btn btn-primary"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 19h16"/></svg> Export</RequireButton>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Timestamp</th><th>Customer</th><th>Type</th>
                <th>Wallet Used / Credited</th><th>SuperCoins Used / Credited</th>
                <th>PG Amount</th><th>PG Ref</th><th>Voucher</th><th>Status</th>
              </tr>
            </thead>
            <tbody id="orders-body">
              {ORDER_ROWS.map((row) => (
                <tr
                  key={row.order}
                  onClick={() => {
                    setSelected(row);
                    setDrawerOpen(true);
                  }}
                >
                  <td className="id-cell">{row.order}</td><td className="num muted">{row.timestamp}</td><td>{row.customerCell}</td>
                  <td><span className={"badge " + row.typeBadgeClass}>{row.typeBadge}</span></td><td className="num">{row.walletUsedCredited}</td><td className="num">{row.superCoinsUsedCredited}</td>
                  <td className="num">{row.pgAmount}</td><td className="num muted">{row.pgRef}</td>
                  <td><span className={"badge " + row.voucherClass}>{row.voucherLabel}</span></td><td><span className={"badge " + statusBadgeClass(row.status)}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>Showing <b className="mono">1–7</b> of <b className="mono">4,812</b> orders</span>
          <div className="pager-btns">
            <button><svg className="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
            <button className="active">1</button><button>2</button><button>3</button><button>…</button><button>688</button>
            <button><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
          </div>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="drawer-head">
          <div>
            <div className="dim" style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".06em" }}>Order detail</div>
            <h3 id="od-id" className="mono" style={{ fontSize: "16px", marginTop: "2px" }}>{odId}</h3>
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <h4>Status</h4>
            <div className="flex gap-8">
              <span className={"badge " + statusBadgeClass(odStatus)} id="od-status">{odStatus}</span>
              <span className="badge info" id="od-type">{odType}</span>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Customer</h4>
            <div className="kv-list">
              <div className="kv-row"><span className="k">Customer</span><span className="v" id="od-customer">{odCustomer}</span></div>
              <div className="kv-row"><span className="k">Placed</span><span className="v">27 Aug, 14:29 IST</span></div>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Payment breakdown</h4>
            <div className="kv-list">
              <div className="kv-row"><span className="k">PG amount</span><span className="v">₹2,499</span></div>
              <div className="kv-row"><span className="k">PG reference</span><span className="v">PG-TXN-9931</span></div>
              <div className="kv-row"><span className="k">Wallet used / credited</span><span className="v">₹0 / ₹0</span></div>
              <div className="kv-row"><span className="k">SuperCoins used / credited</span><span className="v">0 / 0</span></div>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Voucher</h4>
            <div className="kv-list">
              <div className="kv-row"><span className="k">Generation status</span><span className="v"><span className="badge critical">Failed</span></span></div>
              <div className="kv-row"><span className="k">Failure reason</span><span className="v" style={{ fontFamily: "inherit" }}>Provider timeout (504)</span></div>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Timeline</h4>
            <div className="timeline">
              <div className="t-item"><span className="t-dot critical"></span><div className="t-time">14:29:41</div><div className="t-title">Voucher generation failed</div><div className="t-desc">Provider returned timeout after 8.2s.</div></div>
              <div className="t-item"><span className="t-dot success"></span><div className="t-time">14:29:22</div><div className="t-title">Payment captured</div><div className="t-desc">PG-TXN-9931 · ₹2,499 captured.</div></div>
              <div className="t-item"><span className="t-dot success"></span><div className="t-time">14:29:02</div><div className="t-title">Order created</div><div className="t-desc">Order placed by customer.</div></div>
            </div>
          </div>
          <div className="drawer-section">
            <h4>Actions</h4>
            <div className="flex gap-8">
              <RequireButton requires="retry" className="btn btn-primary btn-sm"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg> Retry voucher</RequireButton>
              <Link className="btn btn-sm" to="/exceptions"><svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg> Open in Exceptions</Link>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
