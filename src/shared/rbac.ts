export const SESSION = {
  name: "Ravi Menon",
  role: "Operations Admin", // Super Admin | Operations Admin | Finance | Support | Read Only
  initials: "RM",
};

type Action = "block" | "unblock" | "config" | "retry" | "refund" | "export";

const ROLE_CAN: Record<string, Record<Action, boolean>> = {
  "Super Admin": { block: true, unblock: true, config: true, retry: true, refund: true, export: true },
  "Operations Admin": { block: true, unblock: true, config: false, retry: true, refund: false, export: true },
  Finance: { block: false, unblock: false, config: true, retry: false, refund: true, export: true },
  Support: { block: false, unblock: false, config: false, retry: true, refund: false, export: false },
  "Read Only": { block: false, unblock: false, config: false, retry: false, refund: false, export: false },
};

export function can(action: Action): boolean {
  return !!ROLE_CAN[SESSION.role]?.[action];
}

export function requiresTitle(action: Action): string {
  return `Requires elevated permission (${SESSION.role} cannot ${action}).`;
}
