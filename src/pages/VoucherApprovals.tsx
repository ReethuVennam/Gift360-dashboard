import { useEffect, useState } from "react";
import { Modal } from "../shared/Modal";
import { useToast } from "../shared/ToastContext";
import { api, ApiError } from "../lib/api";

interface RetryHistoryEntry {
  id: number;
  attemptNumber: number;
  maxAttempts: number;
  lastStatus: string;
  lastError: string | null;
  lastEvcCode: string | null;
  createdBy: string;
  createdAt: string;
}

interface ApprovalRequest {
  id: string;
  request_type: string;
  target_id: string | null;
  payload: string;
  status: string; // 'pending' | 'approved' | 'processed' | 'rejected' | 'failed'
  requested_by: string;
  requested_by_username: string;
  approved_by: string | null;
  approved_by_username: string | null;
  requested_at: string;
  approved_at: string | null;
  reason: string | null;
  note: string | null;
  result: string | null;
}

interface VoucherRetryPayload {
  orderNumber?: string;
  orderItemId?: string;
  reason?: string;
}

interface VoucherRetryResult {
  retryStatus?: string;
  message?: string;
  attemptNumber?: number;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function statusBadgeClass(status: string): string {
  const s = status?.toLowerCase();
  if (s === "approved" || s === "processed") return "success";
  if (s === "pending") return "warning";
  return "critical";
}

export function VoucherApprovals() {
  const toast = useToast();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [rows, setRows] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    api
      .get<{ data: ApprovalRequest[] }>("/vouchers/retry-requests", filter === "pending" ? { status: "pending" } : undefined)
      .then((res) => setRows(res.data ?? []))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load requests"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [tab, setTab] = useState<"details" | "history">("details");
  const [history, setHistory] = useState<RetryHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [reason, setReason] = useState("");

  const payload = selected ? parseJson<VoucherRetryPayload>(selected.payload) ?? {} : {};
  const result = selected ? parseJson<VoucherRetryResult>(selected.result) : null;

  function openDetail(row: ApprovalRequest) {
    setSelected(row);
    setTab("details");
    setReason("");
    setHistory([]);
    setHistoryError(null);
  }

  function loadHistory(row: ApprovalRequest) {
    if (history.length || historyLoading) return;
    const p = parseJson<VoucherRetryPayload>(row.payload) ?? {};
    if (!p.orderNumber || !p.orderItemId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    api
      .get<{ data: RetryHistoryEntry[] }>(`/vouchers/${p.orderNumber}/${p.orderItemId}/retry-history`)
      .then((res) => setHistory(res.data ?? []))
      .catch((err) => setHistoryError(err instanceof ApiError ? err.message : "Failed to load retry history"))
      .finally(() => setHistoryLoading(false));
  }

  async function handleApprove() {
    if (!selected) return;
    setDeciding(true);
    try {
      const res = await api.post<{ data: { status: string; result?: unknown } }>(`/vouchers/retry-requests/${selected.id}/approve`);
      toast(`Request ${res.data.status}.`);
      load();
      setSelected(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Approve failed", "err");
      load();
      setSelected(null);
    } finally {
      setDeciding(false);
    }
  }

  async function handleReject() {
    if (!selected || !reason.trim()) return;
    setDeciding(true);
    try {
      await api.post(`/vouchers/retry-requests/${selected.id}/reject`, { reason: reason.trim() });
      toast("Request rejected.");
      load();
      setSelected(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Reject failed", "err");
    } finally {
      setDeciding(false);
    }
  }

  return (
    <>
      <div className="panel">
        <div className="filterbar">
          <div className="chip-group">
            <span className={"chip" + (filter === "pending" ? " active" : "")} onClick={() => setFilter("pending")}>
              Pending
            </span>
            <span className={"chip" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>
              All
            </span>
          </div>
        </div>
        {error && (
          <div className="impact-box">
            <span>{error}</span>
          </div>
        )}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Item</th>
                <th>Requested by</th>
                <th>Requested at</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="dim">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="dim">
                    No {filter === "pending" ? "pending" : ""} regeneration requests.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const p = parseJson<VoucherRetryPayload>(r.payload) ?? {};
                return (
                  <tr key={r.id} onClick={() => openDetail(r)}>
                    <td className="id-cell">{p.orderNumber ?? r.target_id}</td>
                    <td className="mono muted" style={{ fontSize: "11px" }}>
                      {p.orderItemId ?? "—"}
                    </td>
                    <td>{r.requested_by_username}</td>
                    <td className="num muted">{new Date(r.requested_at).toLocaleString()}</td>
                    <td>
                      <span className={"badge " + statusBadgeClass(r.status)}>{r.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(r);
                        }}
                      >
                        {r.status === "pending" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="modal-head">
              <h3>Voucher regeneration request</h3>
              <button className="icon-btn" onClick={() => setSelected(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="kv-list">
                <div className="kv-row">
                  <span className="k">Order</span>
                  <span className="v mono">{payload?.orderNumber ?? selected.target_id ?? "—"}</span>
                </div>
                <div className="kv-row">
                  <span className="k">Item</span>
                  <span className="v mono">{payload?.orderItemId ?? "—"}</span>
                </div>
                <div className="kv-row">
                  <span className="k">Requested by</span>
                  <span className="v">
                    {selected.requested_by_username} · {new Date(selected.requested_at).toLocaleString()}
                  </span>
                </div>
                {selected.approved_by_username && (
                  <div className="kv-row">
                    <span className="k">Decided by</span>
                    <span className="v">
                      {selected.approved_by_username} · {selected.approved_at ? new Date(selected.approved_at).toLocaleString() : "—"}
                    </span>
                  </div>
                )}
              </div>

              <div className="tabs" style={{ margin: "14px 0 0", padding: 0 }}>
                <a
                  className={"tab" + (tab === "details" ? " active" : "")}
                  href="#details"
                  onClick={(e) => {
                    e.preventDefault();
                    setTab("details");
                  }}
                >
                  Details
                </a>
                <a
                  className={"tab" + (tab === "history" ? " active" : "")}
                  href="#history"
                  onClick={(e) => {
                    e.preventDefault();
                    setTab("history");
                    loadHistory(selected);
                  }}
                >
                  Retry history
                </a>
              </div>

              {tab === "details" && (
                <div style={{ marginTop: "14px" }}>
                  <p className="dim">
                    Approving calls the voucher provider (ValueDesign GetEVC) and generates the voucher for this order
                    item.
                  </p>
                  {selected.note && (
                    <div className="impact-box">
                      <span>Note: {selected.note}</span>
                    </div>
                  )}
                  {result && (
                    <div className="impact-box">
                      <span>
                        <span className={"badge " + statusBadgeClass(result.retryStatus ?? "")}>{result.retryStatus}</span>{" "}
                        {result.message} {result.attemptNumber != null ? `(attempt ${result.attemptNumber})` : ""}
                      </span>
                    </div>
                  )}
                  {selected.status === "pending" && (
                    <div className="field">
                      <label>
                        Rejection reason <span className="dim">(required to reject)</span>
                      </label>
                      <textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                  )}
                </div>
              )}

              {tab === "history" && (
                <div className="table-wrap" style={{ marginTop: "14px" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Attempt</th>
                        <th>Status</th>
                        <th>EVC code</th>
                        <th>Error</th>
                        <th>By</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading && (
                        <tr>
                          <td colSpan={6} className="dim">
                            Loading…
                          </td>
                        </tr>
                      )}
                      {historyError && (
                        <tr>
                          <td colSpan={6} className="dim">
                            {historyError}
                          </td>
                        </tr>
                      )}
                      {!historyLoading && !historyError && history.length === 0 && (
                        <tr>
                          <td colSpan={6} className="dim">
                            No previous attempts.
                          </td>
                        </tr>
                      )}
                      {history.map((h) => (
                        <tr key={h.id}>
                          <td className="num">
                            {h.attemptNumber}/{h.maxAttempts}
                          </td>
                          <td>
                            <span className={"badge " + statusBadgeClass(h.lastStatus)}>{h.lastStatus}</span>
                          </td>
                          <td className="mono">{h.lastEvcCode ?? "—"}</td>
                          <td className="muted">{h.lastError ?? "—"}</td>
                          <td>{h.createdBy}</td>
                          <td className="num muted">{new Date(h.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {selected.status === "pending" && (
              <div className="modal-foot">
                <button className="btn" onClick={handleReject} disabled={deciding || !reason.trim()}>
                  Reject
                </button>
                <button className="btn btn-primary" onClick={handleApprove} disabled={deciding}>
                  {deciding ? "Approving…" : "Approve & regenerate"}
                </button>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
