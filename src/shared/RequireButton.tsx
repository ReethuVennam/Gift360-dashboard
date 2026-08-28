import type { ButtonHTMLAttributes } from "react";
import { can, requiresTitle } from "./rbac";

type Action = "block" | "unblock" | "config" | "retry" | "refund" | "export";

interface RequireButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  requires: Action;
}

export function RequireButton({ requires, title, ...rest }: RequireButtonProps) {
  const allowed = can(requires);
  return <button {...rest} disabled={!allowed} title={!allowed ? requiresTitle(requires) : title} />;
}
