import { Link } from "react-router-dom";
import { RequireButton } from "../shared/RequireButton";

export function BusinessOverview() {
  return (
    <div id="view-business">
      <div className="section-head">
        <div>
          <h2>Business Overview — MIS Snapshot</h2>
          <div className="desc">Mirrors the Gift360 Master MIS report · figures as of 27 Aug 2026, 14:32 IST</div>
        </div>
        <div className="flex gap-8">
          <span className="badge neutral">Source: Gift360 Master MIS</span>
          <RequireButton requires="export" className="btn btn-sm">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 11l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>{" "}
            Export MIS (Excel)
          </RequireButton>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>GMV</h3>
            <div className="desc">Gross Merchandise Value — order count and value by period</div>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid-3">
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="kpi-label">YTD</div>
              <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
                <div>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Count</div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>428,600</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Value</div>
                  <div className="kpi-value" style={{ fontSize: "18px", color: "var(--accent)" }}>₹42.86 Cr</div>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="flex gap-6" style={{ alignItems: "center" }}>
                <span className="kpi-label" style={{ margin: 0 }}>MTD</span>
                <select className="select" style={{ padding: "1px 5px", fontSize: "10.5px", borderRadius: "5px" }} title="Choose month for this MTD figure" defaultValue="Aug">
                  <option>Jan</option>
                  <option>Feb</option>
                  <option>Mar</option>
                  <option>Apr</option>
                  <option>May</option>
                  <option>Jun</option>
                  <option>Jul</option>
                  <option>Aug</option>
                  <option>Sep</option>
                  <option>Oct</option>
                  <option>Nov</option>
                  <option>Dec</option>
                </select>
              </div>
              <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
                <div>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Count</div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>38,240</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Value</div>
                  <div className="kpi-value" style={{ fontSize: "18px", color: "var(--accent)" }}>₹3.82 Cr</div>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="kpi-label">FTD</div>
              <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
                <div>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Count</div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>4,812</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Value</div>
                  <div className="kpi-value" style={{ fontSize: "18px", color: "var(--accent)" }}>₹31.85 L</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Transaction Count</h3>
              <div className="desc">MTD transaction outcomes</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MTD Transaction Count</th>
                    <th>Approved</th>
                    <th>Decline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">38,240</td>
                    <td className="num">36,910</td>
                    <td className="">
                      <span className="badge critical">1,330</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>User's</h3>
              <div className="desc">Unique vs. repeat vs. flagged usage</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Unique</th>
                    <th>Repeat User</th>
                    <th>Active User</th>
                    <th>Abuse User</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">21,480</td>
                    <td className="num">14,208</td>
                    <td className="num">19,652</td>
                    <td className="">
                      <Link to="/customers" className="badge critical" style={{ cursor: "pointer" }}>
                        63
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>VD Balance</h3>
            <div className="desc">Voucher discount balance run-rate</div>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid-3">
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="kpi-label">YTD</div>
              <div className="kpi-value" style={{ fontSize: "20px", color: "var(--accent)" }}>₹8.4 Cr</div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="flex gap-6" style={{ alignItems: "center" }}>
                <span className="kpi-label" style={{ margin: 0 }}>MTD</span>
                <select className="select" style={{ padding: "1px 5px", fontSize: "10.5px", borderRadius: "5px" }} title="Choose month for this MTD figure" defaultValue="Aug">
                  <option>Jan</option>
                  <option>Feb</option>
                  <option>Mar</option>
                  <option>Apr</option>
                  <option>May</option>
                  <option>Jun</option>
                  <option>Jul</option>
                  <option>Aug</option>
                  <option>Sep</option>
                  <option>Oct</option>
                  <option>Nov</option>
                  <option>Dec</option>
                </select>
              </div>
              <div className="kpi-value" style={{ fontSize: "20px", color: "var(--accent)" }}>₹72.6 L</div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="kpi-label">FTD</div>
              <div className="kpi-value" style={{ fontSize: "20px", color: "var(--accent)" }}>₹6.1 L</div>
            </div>
          </div>
          <div style={{ marginTop: "10px" }} className="kv-row">
            <span className="k">Run Rate</span>
            <span className="v">₹2.4 Cr / month</span>
          </div>
          <div className="kv-row">
            <span className="k">Saving thru Gift360 — Value</span>
            <span className="v">₹1.94 Cr</span>
          </div>
          <div className="kv-row">
            <span className="k">Saving thru Gift360 — %</span>
            <span className="v">4.55%</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>SuperCoins</h3>
            <div className="desc">Flipkart SuperCoins (Flipkart SC) earned and burned on the platform — consolidated in one place</div>
          </div>
        </div>
        <div className="panel-body">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Coins</th>
                  <th>Value</th>
                  <th>% of Total Voucher Value</th>
                  <th>Flipkart Contribution</th>
                  <th>Gift360 Contribution</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Flipkart SC Earned</td>
                  <td className="num">2,41,000</td>
                  <td className="num">₹24.1 L</td>
                  <td className="num">4.6%</td>
                  <td className="num">₹18.2 L</td>
                  <td className="num">₹5.9 L</td>
                </tr>
                <tr>
                  <td className="row-label">Flipkart SC Burned</td>
                  <td className="num">1,94,000</td>
                  <td className="num">₹19.4 L</td>
                  <td className="num">3.8%</td>
                  <td className="num">₹14.6 L</td>
                  <td className="num">₹4.8 L</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Gift360 Earn</h3>
              <div className="desc">Revenue Gift360 earns from the platform (voucher discount, platform fee &amp; FK rewards)</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-label">Value Discount</td>
                    <td className="num">₹6.4 Cr</td>
                  </tr>
                  <tr>
                    <td className="row-label">Platform Fee</td>
                    <td className="num">₹1.12 Cr</td>
                  </tr>
                  <tr>
                    <td className="row-label">FK Rewards</td>
                    <td className="num">₹42.8 L</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Gift360 Burn</h3>
              <div className="desc">Cash back Gift360 pays out to customers — mirrors Customer Earn</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>% of Total Voucher Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-label">Gift360 Cash Back Points</td>
                    <td className="num">₹18.4 L</td>
                    <td className="num">4.3%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Customer Earn</h3>
              <div className="desc">Rewards accrued to customers — mirrors Gift360 Burn, plus SuperCoins earned</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>% of Total Voucher Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-label">Gift360 Cash Back Points</td>
                    <td className="num">₹18.4 L</td>
                    <td className="num">4.3%</td>
                  </tr>
                  <tr>
                    <td className="row-label">SC Earned</td>
                    <td className="num">₹24.1 L</td>
                    <td className="num">4.6%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Customer Burn</h3>
              <div className="desc">SuperCoins burned by customers on the platform</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>% of Total Voucher Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-label">SC Burn</td>
                    <td className="num">₹19.4 L</td>
                    <td className="num">3.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>MDR</h3>
              <div className="desc">Merchant discount rate by payment mode</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UPI</th>
                    <th>Debit Card</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">0.30%</td>
                    <td className="num">0.90%</td>
                    <td className="num">1.80%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Profit</h3>
              <div className="desc">Net platform profit</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Value</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">₹1.86 Cr</td>
                    <td className="num">4.35%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: "6px" }}>
        <div>
          <h2>Voucher brand watchlist</h2>
          <div className="desc">Margin and volume outliers by brand — from the voucher catalogue</div>
        </div>
        <Link to="/vouchers" className="btn btn-ghost btn-sm">
          Open Vouchers{" "}
          <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </div>
      <div className="report-grid">
        <div className="report-card">
          <div className="r-icon">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <h4>High Margin Vouchers</h4>
          <p>Best contribution margin this month.</p>
          <div className="r-foot">
            <span className="badge success">Tanishq · 18.2%</span>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
          <h4>Low Margin Vouchers</h4>
          <p>Thinnest margin — review commercial terms.</p>
          <div className="r-foot">
            <span className="badge warning">Amazon Pay · 1.1%</span>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20V10M11 20V4M18 20v-7" />
            </svg>
          </div>
          <h4>High Sale Brand</h4>
          <p>Most redeemed brand, last 30 days.</p>
          <div className="r-foot">
            <span className="badge info">Flipkart · 12,400 units</span>
          </div>
        </div>
        <div className="report-card">
          <div className="r-icon">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20z" />
              <path d="M12 10v4M12 17h.01" />
            </svg>
          </div>
          <h4>Low Sale Brand</h4>
          <p>No redemptions in the last 30 days.</p>
          <div className="r-foot">
            <span className="badge critical">Nykaa Fashion · 0 units</span>
          </div>
        </div>
      </div>
    </div>
  );
}
