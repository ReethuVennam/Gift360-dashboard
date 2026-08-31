import { useState } from "react";
import { Link } from "react-router-dom";
import { RequireButton } from "../shared/RequireButton";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

type Row = Record<string, unknown>;

interface BusinessOverviewData {
  gmv: Row[];
  transactions: Row;
  users: Row;
  vd_balance: Row[];
  supercoins: Row;
  gift360_earn: Row;
  gift360_burn: Row;
  customer_earn: Row;
  customer_burn: Row;
  mdr: Row[];
  profit: Row;
  brand_watchlist: {
    high_margin_brands: Row[];
    low_margin_brands: Row[];
    high_sale_brands: Row[];
    low_sale_brands: Row[];
  };
  meta: { from: string; to: string; month: number; year: number };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function emptyOverview(from: string, to: string, month: number, year: number): BusinessOverviewData {
  return {
    gmv: [],
    transactions: {},
    users: {},
    vd_balance: [],
    supercoins: {},
    gift360_earn: {},
    gift360_burn: {},
    customer_earn: {},
    customer_burn: {},
    mdr: [],
    profit: {},
    brand_watchlist: {
      high_margin_brands: [],
      low_margin_brands: [],
      high_sale_brands: [],
      low_sale_brands: [],
    },
    meta: { from, to, month, year },
  };
}

function fmt(val: unknown, prefix = ""): string {
  if (val === null || val === undefined) return "—";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n >= 10_000_000) return `${prefix}${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `${prefix}${(n / 100_000).toFixed(2)} L`;
  return `${prefix}${n.toLocaleString("en-IN")}`;
}

function pct(val: unknown): string {
  if (val === null || val === undefined) return "—";
  const n = Number(val);
  return isNaN(n) ? String(val) : `${n.toFixed(1)}%`;
}

function rowVal(row: Row | undefined | null, key: string): unknown {
  return row?.[key];
}

export function BusinessOverview() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const toDate = now.toISOString().slice(0, 10);
  const fromDate = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const overview = useFetch(
    async () => {
      try {
        return await api.get<BusinessOverviewData>("/business/overview", { from: fromDate, to: toDate, month, year });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return emptyOverview(fromDate, toDate, month, year);
        }
        throw err;
      }
    },
    [fromDate, toDate, month, year]
  );

  const d = overview.data;
  const gmv = d?.gmv ?? [];
  const vdBalance = d?.vd_balance ?? [];
  const mdr = d?.mdr ?? [];
  const wl = d?.brand_watchlist;

  const gmvYtd = gmv.find((r: Row) => String(r.period ?? r.label ?? "").toLowerCase().includes("ytd")) ?? gmv[0];
  const gmvMtd = gmv.find((r: Row) => String(r.period ?? r.label ?? "").toLowerCase().includes("mtd")) ?? gmv[1];
  const gmvFtd = gmv.find((r: Row) => String(r.period ?? r.label ?? "").toLowerCase().includes("ftd")) ?? gmv[2];

  const vdYtd = vdBalance.find((r: Row) => String(r.period ?? r.label ?? "").toLowerCase().includes("ytd")) ?? vdBalance[0];
  const vdMtd = vdBalance.find((r: Row) => String(r.period ?? r.label ?? "").toLowerCase().includes("mtd")) ?? vdBalance[1];
  const vdFtd = vdBalance.find((r: Row) => String(r.period ?? r.label ?? "").toLowerCase().includes("ftd")) ?? vdBalance[2];

  return (
    <div id="view-business">
      <div className="section-head">
        <div>
          <h2>Business Overview — MIS Snapshot</h2>
          <div className="desc">
            {d ? `Data from ${d.meta.from} to ${d.meta.to}` : "Loading business overview…"}
          </div>
        </div>
        <div className="flex gap-8">
          <span className="badge neutral">Source: Gift360 Master MIS</span>
          <RequireButton requires="reports:export" className="btn btn-sm">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 11l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>{" "}
            Export MIS (Excel)
          </RequireButton>
        </div>
      </div>

      {overview.loading && <div className="impact-box"><span>Loading business overview…</span></div>}
      {overview.error && <div className="impact-box"><span>{overview.error}</span></div>}

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
              <div className="flex gap-6" style={{ alignItems: "center" }}>
                <span className="kpi-label" style={{ margin: 0 }}>YTD</span>
                <select
                  className="select"
                  style={{ padding: "1px 5px", fontSize: "10.5px", borderRadius: "5px" }}
                  title="Choose year for this YTD figure"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>
              <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
                <div>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Count</div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>{Number(rowVal(gmvYtd, "order_count") ?? 0).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Value</div>
                  <div className="kpi-value" style={{ fontSize: "18px", color: "var(--accent)" }}>{fmt(rowVal(gmvYtd, "order_value"), "₹")}</div>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="flex gap-6" style={{ alignItems: "center" }}>
                <span className="kpi-label" style={{ margin: 0 }}>MTD</span>
                <select
                  className="select"
                  style={{ padding: "1px 5px", fontSize: "10.5px", borderRadius: "5px" }}
                  title="Choose month for this MTD figure"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
                <div>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Count</div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>{Number(rowVal(gmvMtd, "order_count") ?? 0).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Value</div>
                  <div className="kpi-value" style={{ fontSize: "18px", color: "var(--accent)" }}>{fmt(rowVal(gmvMtd, "order_value"), "₹")}</div>
                </div>
              </div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="kpi-label">FTD</div>
              <div className="flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
                <div>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Count</div>
                  <div className="kpi-value" style={{ fontSize: "18px" }}>{Number(rowVal(gmvFtd, "order_count") ?? 0).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="dim" style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: ".05em" }}>Value</div>
                  <div className="kpi-value" style={{ fontSize: "18px", color: "var(--accent)" }}>{fmt(rowVal(gmvFtd, "order_value"), "₹")}</div>
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
                    <td className="num">{Number(rowVal(d?.transactions, "mtd_transaction_count") ?? 0).toLocaleString("en-IN")}</td>
                    <td className="num">{Number(rowVal(d?.transactions, "approved_count") ?? 0).toLocaleString("en-IN")}</td>
                    <td className="">
                      <span className="badge critical">{Number(rowVal(d?.transactions, "declined_count") ?? 0).toLocaleString("en-IN")}</span>
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
                    <td className="num">{Number(rowVal(d?.users, "unique_users") ?? 0).toLocaleString("en-IN")}</td>
                    <td className="num">{Number(rowVal(d?.users, "repeat_users") ?? 0).toLocaleString("en-IN")}</td>
                    <td className="num">{Number(rowVal(d?.users, "active_users") ?? 0).toLocaleString("en-IN")}</td>
                    <td className="">
                      <Link to="/customers" className="badge critical" style={{ cursor: "pointer" }}>
                        {Number(rowVal(d?.users, "abuse_users") ?? 0).toLocaleString("en-IN")}
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
              <div className="kpi-value" style={{ fontSize: "20px", color: "var(--accent)" }}>{fmt(rowVal(vdYtd, "voucher_value"), "₹")}</div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="flex gap-6" style={{ alignItems: "center" }}>
                <span className="kpi-label" style={{ margin: 0 }}>MTD</span>
                <select
                  className="select"
                  style={{ padding: "1px 5px", fontSize: "10.5px", borderRadius: "5px" }}
                  title="Choose month for this MTD figure"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="kpi-value" style={{ fontSize: "20px", color: "var(--accent)" }}>{fmt(rowVal(vdMtd, "voucher_value"), "₹")}</div>
            </div>
            <div className="kpi-card">
              <span className="kpi-bar accent"></span>
              <div className="kpi-label">FTD</div>
              <div className="kpi-value" style={{ fontSize: "20px", color: "var(--accent)" }}>{fmt(rowVal(vdFtd, "voucher_value"), "₹")}</div>
            </div>
          </div>
          <div style={{ marginTop: "10px" }} className="kv-row">
            <span className="k">Saving thru Gift360 — Value</span>
            <span className="v">{fmt(rowVal(vdYtd, "saving_value"), "₹")}</span>
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
                  <th>Gift360 Contribution %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Flipkart SC Earned</td>
                  <td className="num">{Number(rowVal(d?.supercoins, "flipkart_sc_earned_coins") ?? 0).toLocaleString("en-IN")}</td>
                  <td className="num">{fmt(rowVal(d?.supercoins, "flipkart_sc_earned_value"), "₹")}</td>
                  <td className="num">{pct(rowVal(d?.supercoins, "gift360_contribution_pct"))}</td>
                </tr>
                <tr>
                  <td className="row-label">Flipkart SC Burned</td>
                  <td className="num">{Number(rowVal(d?.supercoins, "flipkart_sc_burned_coins") ?? 0).toLocaleString("en-IN")}</td>
                  <td className="num">{fmt(rowVal(d?.supercoins, "flipkart_sc_burned_value"), "₹")}</td>
                  <td className="num">—</td>
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
                    <td className="num">{fmt(rowVal(d?.gift360_earn, "value_discount"), "₹")}</td>
                  </tr>
                  <tr>
                    <td className="row-label">Platform Fee</td>
                    <td className="num">{fmt(rowVal(d?.gift360_earn, "platform_fee"), "₹")}</td>
                  </tr>
                  <tr>
                    <td className="row-label">FK Rewards</td>
                    <td className="num">{fmt(rowVal(d?.gift360_earn, "fk_rewards"), "₹")}</td>
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
                    <td className="num">{fmt(rowVal(d?.gift360_burn, "cashback_points_value"), "₹")}</td>
                    <td className="num">{pct(rowVal(d?.gift360_burn, "cashback_pct"))}</td>
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
                    <td className="num">{fmt(rowVal(d?.customer_earn, "gift360_cashback_value"), "₹")}</td>
                    <td className="num">{pct(rowVal(d?.customer_earn, "gift360_cashback_pct"))}</td>
                  </tr>
                  <tr>
                    <td className="row-label">SC Earned</td>
                    <td className="num">{fmt(rowVal(d?.customer_earn, "sc_earned_value"), "₹")}</td>
                    <td className="num">{pct(rowVal(d?.customer_earn, "sc_earned_pct"))}</td>
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
                    <td className="num">{fmt(rowVal(d?.customer_burn, "sc_burn_value"), "₹")}</td>
                    <td className="num">{pct(rowVal(d?.customer_burn, "sc_burn_pct"))}</td>
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
                    {mdr.map((r: Row, i: number) => (
                      <th key={i}>{String(r.payment_mode ?? r.mode ?? `Mode ${i + 1}`)}</th>
                    ))}
                    {mdr.length === 0 && (<><th>UPI</th><th>Debit Card</th><th>Credit</th></>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {mdr.map((r: Row, i: number) => (
                      <td key={i} className="num">{pct(rowVal(r, "mdr_pct"))}</td>
                    ))}
                    {mdr.length === 0 && (<><td className="num">—</td><td className="num">—</td><td className="num">—</td></>)}
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
                    <th>Revenue</th>
                    <th>Profit</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="num">{fmt(rowVal(d?.profit, "revenue"), "₹")}</td>
                    <td className="num">{fmt(rowVal(d?.profit, "profit_value"), "₹")}</td>
                    <td className="num">{pct(rowVal(d?.profit, "profit_pct"))}</td>
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
            {wl?.high_margin_brands?.slice(0, 3).map((b: Row, i: number) => (
              <span key={i} className="badge success">{String(b.brand_name ?? "—")} · {pct(rowVal(b, "margin_pct"))}</span>
            ))}
            {(!wl?.high_margin_brands || wl.high_margin_brands.length === 0) && <span className="badge success">—</span>}
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
            {wl?.low_margin_brands?.slice(0, 3).map((b: Row, i: number) => (
              <span key={i} className="badge warning">{String(b.brand_name ?? "—")} · {pct(rowVal(b, "margin_pct"))}</span>
            ))}
            {(!wl?.low_margin_brands || wl.low_margin_brands.length === 0) && <span className="badge warning">—</span>}
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
            {wl?.high_sale_brands?.slice(0, 3).map((b: Row, i: number) => (
              <span key={i} className="badge info">{String(b.brand_name ?? "—")} · {Number(rowVal(b, "units_sold") ?? 0).toLocaleString("en-IN")} units</span>
            ))}
            {(!wl?.high_sale_brands || wl.high_sale_brands.length === 0) && <span className="badge info">—</span>}
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
            {wl?.low_sale_brands?.slice(0, 3).map((b: Row, i: number) => (
              <span key={i} className="badge critical">{String(b.brand_name ?? "—")} · {Number(rowVal(b, "units_sold") ?? 0).toLocaleString("en-IN")} units</span>
            ))}
            {(!wl?.low_sale_brands || wl.low_sale_brands.length === 0) && <span className="badge critical">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
