import type { ButtonHTMLAttributes } from "react";
import { useAuth } from "./AuthContext";
import { requiresTitle } from "./rbac";

interface RequireButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  requires: string;
}

export function RequireButton({ requires, title, ...rest }: RequireButtonProps) {
  const { can } = useAuth();
  const allowed = can(requires);
  return <button {...rest} disabled={!allowed} title={!allowed ? requiresTitle(requires) : title} />;
}
