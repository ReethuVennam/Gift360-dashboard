import { useState } from "react";
import { VoucherApprovals } from "./VoucherApprovals";
import { RequestApprovalQueue, statusBadgeClass, type ApprovalRow } from "../shared/RequestApprovalQueue";

interface ReactivationPayload {
  client_id?: string;
  reason?: string;
}

interface RefundPayload {
  orderNumber?: string;
  client_id?: string;
  refund_mode?: string;
  amount?: number;
  reason?: string;
}

interface WalletAdjustmentPayload {
  client_id?: string;
  amount?: number;
  direction?: string;
  reason?: string;
}

type Tab = "vouchers" | "reactivations" | "refunds" | "wallet";

const TABS: { key: Tab; label: string }[] = [
  { key: "vouchers", label: "Vouchers" },
  { key: "reactivations", label: "Customer Reactivations" },
  { key: "refunds", label: "Refunds" },
  { key: "wallet", label: "Wallet Adjustments" },
];

function DetailRow({ k, v }: { k: string; v: string | number | null | undefined }) {
  return (
    <div className="kv-row">
      <span className="k">{k}</span>
      <span className="v">{v ?? "—"}</span>
    </div>
  );
}

function CommonMeta({ row }: { row: ApprovalRow }) {
  return (
    <>
      <DetailRow k="Reason" v={row.reason} />
      <DetailRow k="Requested by" v={`${row.requested_by_username} · ${new Date(row.requested_at).toLocaleString()}`} />
      {row.approved_by_username && (
        <DetailRow k="Decided by" v={`${row.approved_by_username} · ${row.approved_at ? new Date(row.approved_at).toLocaleString() : "—"}`} />
      )}
      {row.note && <DetailRow k="Decision note" v={row.note} />}
    </>
  );
}

export function Approvals() {
  const [tab, setTab] = useState<Tab>("vouchers");

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <a
            key={t.key}
            className={"tab" + (tab === t.key ? " active" : "")}
            href={"#" + t.key}
            onClick={(e) => {
              e.preventDefault();
              setTab(t.key);
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div style={{ marginTop: "18px" }}>
        {tab === "vouchers" && <VoucherApprovals />}

        {tab === "reactivations" && (
          <RequestApprovalQueue<ReactivationPayload>
            requiresPermission="customers:reactivate:approve"
            listPath="/customers/reactivation-requests"
            approvePath={(r) => `/customers/reactivation-requests/${r.id}/approve`}
            rejectPath={(r) => `/customers/reactivation-requests/${r.id}/reject`}
            approveLabel="Approve & reactivate"
            emptyLabel="reactivation requests"
            columns={[
              { header: "Customer ID", render: (r, p) => p.client_id ?? r.target_id },
              { header: "Requested by", render: (r) => r.requested_by_username },
              { header: "Requested at", render: (r) => new Date(r.requested_at).toLocaleString() },
              { header: "Status", render: (r) => <span className={"badge " + statusBadgeClass(r.status)}>{r.status}</span> },
            ]}
            renderDetail={(r, p) => (
              <div className="kv-list">
                <DetailRow k="Customer ID" v={p.client_id ?? r.target_id} />
                <CommonMeta row={r} />
              </div>
            )}
          />
        )}

        {tab === "refunds" && (
          <RequestApprovalQueue<RefundPayload>
            requiresPermission="refunds:approve"
            listPath="/refunds/requests"
            approvePath={(r) => `/refunds/requests/${r.id}/approve`}
            rejectPath={(r) => `/refunds/requests/${r.id}/reject`}
            approveLabel="Approve refund"
            emptyLabel="refund requests"
            columns={[
              { header: "Order", render: (r, p) => p.orderNumber ?? r.target_id },
              { header: "Amount", render: (_r, p) => (p.amount != null ? `₹${p.amount}` : "—") },
              { header: "Mode", render: (_r, p) => p.refund_mode ?? "—" },
              { header: "Requested by", render: (r) => r.requested_by_username },
              { header: "Requested at", render: (r) => new Date(r.requested_at).toLocaleString() },
              { header: "Status", render: (r) => <span className={"badge " + statusBadgeClass(r.status)}>{r.status}</span> },
            ]}
            renderDetail={(r, p) => (
              <div className="kv-list">
                <DetailRow k="Order" v={p.orderNumber ?? r.target_id} />
                <DetailRow k="Amount" v={p.amount != null ? `₹${p.amount}` : "—"} />
                <DetailRow k="Refund mode" v={p.refund_mode} />
                <CommonMeta row={r} />
                {r.status === "pending" && (
                  <div className="impact-box" style={{ marginTop: "8px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3 2 20h20z" />
                      <path d="M12 10v4M12 17h.01" />
                    </svg>
                    <span>Approving records the refund and marks the order REFUNDED — gateway settlement back to the customer is still separate/pending.</span>
                  </div>
                )}
              </div>
            )}
          />
        )}

        {tab === "wallet" && (
          <RequestApprovalQueue<WalletAdjustmentPayload>
            requiresPermission="wallet:adjust:approve"
            listPath="/wallet/adjustment-requests"
            approvePath={(r) => `/wallet/adjustment-requests/${r.id}/approve`}
            rejectPath={(r) => `/wallet/adjustment-requests/${r.id}/reject`}
            approveLabel="Approve & apply"
            emptyLabel="wallet adjustment requests"
            columns={[
              { header: "Customer ID", render: (r, p) => p.client_id ?? r.target_id },
              { header: "Amount", render: (_r, p) => `₹${p.amount}` },
              { header: "Direction", render: (_r, p) => p.direction ?? "—" },
              { header: "Requested by", render: (r) => r.requested_by_username },
              { header: "Requested at", render: (r) => new Date(r.requested_at).toLocaleString() },
              { header: "Status", render: (r) => <span className={"badge " + statusBadgeClass(r.status)}>{r.status}</span> },
            ]}
            renderDetail={(r, p) => (
              <div className="kv-list">
                <DetailRow k="Customer ID" v={p.client_id ?? r.target_id} />
                <DetailRow k="Amount" v={`₹${p.amount}`} />
                <DetailRow k="Direction" v={p.direction} />
                <CommonMeta row={r} />
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
