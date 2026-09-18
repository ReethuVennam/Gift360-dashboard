import { useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { requiresTitle } from "./rbac";
import { useToast } from "./ToastContext";
import { Modal } from "./Modal";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/useApi";

export interface ApprovalRow {
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

export function parsePayload<T>(row: ApprovalRow): T {
  try {
    return JSON.parse(row.payload || "{}") as T;
  } catch {
    return {} as T;
  }
}

export function statusBadgeClass(status: string): string {
  const s = status?.toLowerCase();
  if (s === "approved" || s === "processed") return "success";
  if (s === "pending") return "warning";
  return "critical";
}

export interface ApprovalColumn<P> {
  header: string;
  render: (row: ApprovalRow, payload: P) => ReactNode;
}

interface RequestApprovalQueueProps<P> {
  requiresPermission: string;
  listPath: string;
  approvePath: (row: ApprovalRow) => string;
  rejectPath: (row: ApprovalRow) => string;
  columns: ApprovalColumn<P>[];
  renderDetail: (row: ApprovalRow, payload: P) => ReactNode;
  approveLabel?: string;
  emptyLabel?: string;
  onApproved?: () => void;
}

export function RequestApprovalQueue<P>({
  requiresPermission,
  listPath,
  approvePath,
  rejectPath,
  columns,
  renderDetail,
  approveLabel = "Approve",
  emptyLabel = "requests",
  onApproved,
}: RequestApprovalQueueProps<P>) {
  const toast = useToast();
  const { can } = useAuth();
  const allowed = can(requiresPermission);

  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const list = useFetch(
    () => api.get<{ data: ApprovalRow[] }>(listPath, filter === "pending" ? { status: "pending" } : undefined),
    [filter, listPath]
  );

  const [selected, setSelected] = useState<ApprovalRow | null>(null);
  const [reason, setReason] = useState("");
  const [deciding, setDeciding] = useState(false);

  function openDetail(row: ApprovalRow) {
    setSelected(row);
    setReason("");
  }

  async function handleApprove() {
    if (!selected) return;
    setDeciding(true);
    try {
      const res = await api.post<{ data: { status: string } }>(approvePath(selected));
      toast(`Request ${res.data.status}.`);
      list.refetch();
      onApproved?.();
      setSelected(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Approve failed", "err");
      list.refetch();
      setSelected(null);
    } finally {
      setDeciding(false);
    }
  }

  async function handleReject() {
    if (!selected || !reason.trim()) return;
    setDeciding(true);
    try {
      await api.post(rejectPath(selected), { reason: reason.trim() });
      toast("Request rejected.");
      list.refetch();
      setSelected(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Reject failed", "err");
    } finally {
      setDeciding(false);
    }
  }

  const rows = list.data?.data ?? [];

  return (
    <>
      {!allowed && (
        <div className="impact-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 2 20h20z" />
            <path d="M12 10v4M12 17h.01" />
          </svg>
          <span>{requiresTitle(requiresPermission)}</span>
        </div>
      )}

      {allowed && (
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
          {list.error && (
            <div className="impact-box">
              <span>{list.error}</span>
            </div>
          )}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((c, i) => (
                    <th key={i}>{c.header}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.loading && (
                  <tr>
                    <td colSpan={columns.length + 1} className="dim">
                      Loading…
                    </td>
                  </tr>
                )}
                {!list.loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="dim">
                      No {filter === "pending" ? "pending" : ""} {emptyLabel}.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const payload = parsePayload<P>(row);
                  return (
                    <tr key={row.id} onClick={() => openDetail(row)}>
                      {columns.map((c, i) => (
                        <td key={i}>{c.render(row, payload)}</td>
                      ))}
                      <td>
                        <button
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(row);
                          }}
                        >
                          {row.status === "pending" ? "Review" : "View"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="modal-head">
              <h3>Request detail</h3>
              <button className="icon-btn" onClick={() => setSelected(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {renderDetail(selected, parsePayload<P>(selected))}
              {selected.status === "pending" && (
                <div className="field">
                  <label>
                    Rejection reason <span className="dim">(required to reject)</span>
                  </label>
                  <textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
            </div>
            {selected.status === "pending" && (
              <div className="modal-foot">
                <button className="btn" onClick={handleReject} disabled={deciding || !reason.trim()}>
                  Reject
                </button>
                <button className="btn btn-primary" onClick={handleApprove} disabled={deciding}>
                  {deciding ? "Working…" : approveLabel}
                </button>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
