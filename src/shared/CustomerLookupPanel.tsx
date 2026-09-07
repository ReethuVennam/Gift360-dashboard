import { useEffect, useMemo, useState } from "react";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { RegenerateVoucherButton } from "./RegenerateVoucherButton";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

interface CustomerRow {
  client_id: string;
  client_name: string;
  client_email: string;
  client_mobile: string;
  client_account_status: string;
  total_orders: number;
  total_spent: number;
  vouchers_received: number;
  supercoins_earned: number;
  last_order_at: string | null;
}

interface OrderSearchRow {
  order_number: string;
  client_email: string;
  client_mobile: string;
}

interface JourneyRow {
  event_at: string;
  event_type: string;
  ref: string;
  status_detail: string | null;
  amount: number | null;
  detail: string | null;
}

interface AdminActivityRow {
  admin_username: string;
  action: string;
  target_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

interface TxnNode {
  ref: string;
  events: JourneyRow[];
  latestAt: string;
  latestStatus: string | null;
}

interface OrderSummary {
  order_status: string;
  voucher_status: string;
  order_item_id: string;
}

const PAGE_SIZE = 10;

function statusBadgeClass(status: string | null): string {
  const s = (status ?? "").toUpperCase();
  if (s === "ACTIVE" || s === "SUCCESS" || s === "GENERATED" || s === "PAID") return "success";
  if (s === "SUSPENDED" || s === "CLOSED" || s === "FAILURE" || s === "FAILED") return "critical";
  return "warning";
}

// Same condition as Orders.tsx / Vouchers.tsx: money debited (order paid) but voucher not generated.
function needsVoucherRegeneration(row: OrderSummary): boolean {
  const orderPaid = row.order_status?.toUpperCase() === "PAID" || row.order_status?.toUpperCase() === "SUCCESS";
  const voucherMissing = row.voucher_status?.toUpperCase() !== "GENERATED";
  return orderPaid && voucherMissing;
}

function groupJourney(rows: JourneyRow[]): TxnNode[] {
  const map = new Map<string, JourneyRow[]>();
  for (const row of rows) {
    const key = row.ref || "(no reference)";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  const nodes: TxnNode[] = Array.from(map.entries()).map(([ref, events]) => {
    const sorted = [...events].sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
    return { ref, events: sorted, latestAt: sorted[0]?.event_at ?? "", latestStatus: sorted[0]?.status_detail ?? null };
  });
  nodes.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  return nodes;
}

export function CustomerLookupPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);

  const [journeyRows, setJourneyRows] = useState<JourneyRow[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [orderSummaries, setOrderSummaries] = useState<Record<string, OrderSummary | null>>({});

  const audit = useFetch(
    () => (customer ? api.get<{ data: AdminActivityRow[] }>("/audit", { module: "customer", page: 0, size: 50 }) : Promise.resolve({ data: [] as AdminActivityRow[] })),
    [customer]
  );
  const adminActivityRows = (audit.data?.data ?? []).filter((r) => r.target_id === customer?.client_id);

  const allNodes = useMemo(() => groupJourney(journeyRows), [journeyRows]);
  const pageCount = Math.max(1, Math.ceil(allNodes.length / PAGE_SIZE));
  const pagedNodes = allNodes.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageRefsKey = pagedNodes.map((n) => n.ref).join(",");

  useEffect(() => {
    const refs = pageRefsKey ? pageRefsKey.split(",") : [];
    const toFetch = refs.filter((ref) => !(ref in orderSummaries));
    if (toFetch.length === 0) return;
    let cancelled = false;
    Promise.all(
      toFetch.map(async (ref) => {
        try {
          const res = await api.get<{ data: OrderSummary[] }>("/orders", { search: ref, size: 1 });
          return [ref, res.data[0] ?? null] as const;
        } catch {
          return [ref, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setOrderSummaries((prev) => {
        const next = { ...prev };
        for (const [ref, summary] of entries) next[ref] = summary;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageRefsKey]);

  async function loadJourney(clientId: string) {
    setJourneyLoading(true);
    setJourneyError(null);
    try {
      const res = await api.get<{ data: JourneyRow[] }>(`/customers/${clientId}/journey`);
      setJourneyRows(res.data);
    } catch (err) {
      setJourneyError(err instanceof ApiError ? err.message : "Failed to load transaction history");
    } finally {
      setJourneyLoading(false);
    }
  }

  async function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setLookupError(null);
    setCustomer(null);
    setJourneyRows([]);
    setExpanded(new Set());
    setPage(0);
    try {
      let rows = (await api.get<{ data: CustomerRow[] }>("/customers", { search: q, size: 5 })).data;
      if (rows.length === 0) {
        const orderRows = (await api.get<{ data: OrderSearchRow[] }>("/orders", { search: q, size: 1 })).data;
        const match = orderRows[0];
        if (match) {
          const byEmail = (await api.get<{ data: CustomerRow[] }>("/customers", { search: match.client_email, size: 1 })).data;
          rows = byEmail.length ? byEmail : (await api.get<{ data: CustomerRow[] }>("/customers", { search: match.client_mobile, size: 1 })).data;
        }
      }
      const found = rows[0] ?? null;
      if (!found) {
        setLookupError(`No customer found for "${q}".`);
        return;
      }
      setCustomer(found);
      await loadJourney(found.client_id);
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(ref: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Customer lookup</h3>
            <div className="desc">Search by name, email, mobile or order ID for the full customer profile and transaction history</div>
          </div>
        </div>
        <div className="panel-body">
          <div className="search-wrap lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input
              className="input"
              placeholder="Search by name, email, mobile or order ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <button className="btn btn-primary" disabled={!query.trim() || loading} onClick={handleSubmit}>
              {loading ? "Searching…" : "Submit"}
            </button>
          </div>

          {lookupError && <div className="impact-box" style={{ marginTop: "12px" }}><span>{lookupError}</span></div>}

          {customer && (
            <>
              <div className="drawer-section" style={{ marginTop: "18px" }}>
                <h4>Profile</h4>
                <div className="kv-list">
                  <div className="kv-row"><span className="k">Name</span><span className="v">{customer.client_name}</span></div>
                  <div className="kv-row"><span className="k">Customer ID</span><span className="v mono">{customer.client_id}</span></div>
                  <div className="kv-row"><span className="k">Mobile</span><span className="v mono">{customer.client_mobile}</span></div>
                  <div className="kv-row"><span className="k">Email</span><span className="v mono">{customer.client_email}</span></div>
                  <div className="kv-row"><span className="k">Status</span><span className="v"><span className={"badge " + statusBadgeClass(customer.client_account_status)}>{customer.client_account_status}</span></span></div>
                  <div className="kv-row"><span className="k">Total orders</span><span className="v">{customer.total_orders}</span></div>
                  <div className="kv-row"><span className="k">Total spent</span><span className="v">₹{customer.total_spent}</span></div>
                  <div className="kv-row"><span className="k">SuperCoins earned</span><span className="v">{customer.supercoins_earned}</span></div>
                  <div className="kv-row"><span className="k">Vouchers received</span><span className="v">{customer.vouchers_received}</span></div>
                  <div className="kv-row"><span className="k">Last order</span><span className="v">{customer.last_order_at ? new Date(customer.last_order_at).toLocaleString() : "—"}</span></div>
                </div>
              </div>

              <div className="drawer-section">
                <h4>Transactions</h4>
                {journeyLoading && allNodes.length === 0 && <p className="dim">Loading…</p>}
                {journeyError && <div className="impact-box"><span>{journeyError}</span></div>}
                {!journeyLoading && !journeyError && allNodes.length === 0 && <p className="dim">No transaction history found.</p>}
                {allNodes.length > 0 && (
                  <>
                    <div className="txn-tree">
                      {pagedNodes.map((node) => (
                        <div className={"txn-node" + (expanded.has(node.ref) ? " expanded" : "")} key={node.ref}>
                          <div className="txn-node-head" onClick={() => toggleExpand(node.ref)}>
                            <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                            <span className="ref">{node.ref}</span>
                            {node.latestStatus && <span className={"badge " + statusBadgeClass(node.latestStatus)}>{node.latestStatus}</span>}
                            <span className="meta">{node.events.length} event{node.events.length === 1 ? "" : "s"} · {node.latestAt ? new Date(node.latestAt).toLocaleString() : "—"}</span>
                            {orderSummaries[node.ref] && needsVoucherRegeneration(orderSummaries[node.ref]!) && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <RegenerateVoucherButton
                                  orderNumber={node.ref}
                                  orderItemId={orderSummaries[node.ref]!.order_item_id}
                                  onRegenerated={() => customer && loadJourney(customer.client_id)}
                                />
                              </div>
                            )}
                            <button
                              className="btn btn-sm"
                              onClick={(e) => { e.stopPropagation(); setSelectedOrderNumber(node.ref); setDrawerOpen(true); }}
                            >
                              View order
                            </button>
                          </div>
                          {expanded.has(node.ref) && (
                            <div className="txn-children">
                              {node.events.map((ev, i) => (
                                <div className="txn-child-row" key={i}>
                                  <span className="k">{ev.event_type}</span>
                                  <span className="v">{ev.status_detail ?? "—"}</span>
                                  {ev.amount != null && <span className="v">₹{ev.amount}</span>}
                                  <span className="v muted">{new Date(ev.event_at).toLocaleString()}</span>
                                  {ev.detail && <span className="v dim">{ev.detail}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {allNodes.length > PAGE_SIZE && (
                      <div className="pager">
                        <span className="mono">Page {page + 1} of {pageCount}</span>
                        <div className="pager-btns">
                          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
                          <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>Next</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="drawer-section">
                <h4>Admin activity</h4>
                {audit.loading && <p className="dim">Loading…</p>}
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Timestamp</th><th>Action</th><th>Admin</th><th>Previous → New</th><th>Reason</th></tr></thead>
                    <tbody>
                      {!audit.loading && adminActivityRows.length === 0 && <tr><td colSpan={5} className="dim">No recorded admin actions for this customer.</td></tr>}
                      {adminActivityRows.map((r, i) => (
                        <tr key={i}>
                          <td className="num muted">{new Date(r.created_at).toLocaleString()}</td>
                          <td><span className="badge critical">{r.action}</span></td>
                          <td>{r.admin_username}</td>
                          <td className="mono">{r.previous_value ?? "—"} → {r.new_value ?? "—"}</td>
                          <td>{r.reason ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <OrderDetailDrawer orderNumber={selectedOrderNumber} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
