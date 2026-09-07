import { useState } from "react";
import { OrderDetailDrawer } from "../shared/OrderDetailDrawer";
import { RegenerateVoucherButton } from "../shared/RegenerateVoucherButton";
import { api } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface OrderRow {
  order_id: string;
  order_number: string;
  client_name: string;
  client_email: string;
  client_mobile: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  wallet_used: boolean;
  wallet_amount: number;
  payment_method: string;
  coins_earned: number;
  coins_redeemed: number;
  quantity: number;
  is_gift: boolean;
  brand_name: string;
  voucher_status: string;
  order_item_id: string;
}

function statusBadgeClass(status: string): string {
  const s = status?.toUpperCase();
  if (s === "PAID" || s === "SUCCESS" || s === "GENERATED") return "success";
  if (s === "PENDING" || s === "NOT_APPLICABLE_PENDING") return "warning";
  return "critical";
}

function needsVoucherRegeneration(row: OrderRow): boolean {
  const orderPaid = row.order_status?.toUpperCase() === "PAID" || row.order_status?.toUpperCase() === "SUCCESS";
  const voucherMissing = row.voucher_status?.toUpperCase() !== "GENERATED";
  return orderPaid && voucherMissing;
}

const VOUCHER_STATUSES = ["GENERATED", "FAILED", "NOT_APPLICABLE_PENDING", "NOT_APPLICABLE_FAILED"];
const PAYMENT_METHODS = ["UPI", "CARD", "WALLET"];

export function Orders() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [voucherStatus, setVoucherStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [page, setPage] = useState(0);

  const list = useFetch(
    () =>
      api.get<{ data: OrderRow[]; page: number; size: number }>("/orders", {
        search: search || undefined,
        voucherStatus: voucherStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        page,
        size: 50,
      }),
    [search, voucherStatus, paymentMethod, page]
  );

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="panel">
        <div className="filterbar">
          <select className="select" value={voucherStatus} onChange={(e) => { setPage(0); setVoucherStatus(e.target.value); }}>
            <option value="">All voucher statuses</option>
            {VOUCHER_STATUSES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select className="select" value={paymentMethod} onChange={(e) => { setPage(0); setPaymentMethod(e.target.value); }}>
            <option value="">All payment methods</option>
            {PAYMENT_METHODS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <div className="search-wrap grow">
            <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input
              className="input"
              placeholder="Order #, customer, mobile or client ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setPage(0); setSearch(searchInput); }
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(0); setSearch(searchInput); }}>Search</button>
        </div>

        {list.error && <div className="impact-box"><span>{list.error}</span></div>}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th><th>Timestamp</th><th>Customer</th><th>Brand</th><th>Qty</th>
                <th>Payment</th><th>Wallet Used</th><th>Coins Earned</th><th>Coins Redeemed</th>
                <th>Total</th><th>Gift</th><th>Voucher</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.loading && (
                <tr><td colSpan={13} className="dim">Loading…</td></tr>
              )}
              {!list.loading && (list.data?.data.length ?? 0) === 0 && (
                <tr><td colSpan={13} className="dim">No orders found.</td></tr>
              )}
              {list.data?.data.map((row) => (
                <tr
                  key={row.order_id}
                  onClick={() => {
                    setSelectedOrder(row.order_number);
                    setDrawerOpen(true);
                  }}
                >
                  <td className="id-cell">{row.order_number}</td>
                  <td className="num muted">{new Date(row.created_at).toLocaleString()}</td>
                  <td>{row.client_name}</td>
                  <td>{row.brand_name}</td>
                  <td className="num">{row.quantity}</td>
                  <td><span className="badge info">{row.payment_method}</span></td>
                  <td className="num">₹{row.wallet_amount}</td>
                  <td className="num">{row.coins_earned ?? "—"}</td>
                  <td className="num">{row.coins_redeemed ?? "—"}</td>
                  <td className="num">₹{row.total_amount}</td>
                  <td><span className={"badge " + (row.is_gift ? "success" : "neutral")}>{row.is_gift ? "Yes" : "No"}</span></td>
                  <td>
                    <span className={"badge " + statusBadgeClass(row.voucher_status)}>{row.voucher_status}</span>
                    {needsVoucherRegeneration(row) && (
                      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "6px" }}>
                        <RegenerateVoucherButton
                          orderNumber={row.order_number}
                          orderItemId={row.order_item_id}
                          onRegenerated={() => list.refetch()}
                        />
                      </div>
                    )}
                  </td>
                  <td><span className={"badge " + statusBadgeClass(row.order_status)}>{row.order_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>Page <b className="mono">{page + 1}</b></span>
          <div className="pager-btns">
            <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <svg className="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button
              disabled={(list.data?.data.length ?? 0) < 50}
              onClick={() => setPage((p) => p + 1)}
            >
              <svg className="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <OrderDetailDrawer orderNumber={selectedOrder} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
