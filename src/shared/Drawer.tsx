import { useEffect, type ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, children, width }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={"drawer-overlay" + (open ? " open" : "")} onClick={onClose} />
      <div className={"drawer" + (open ? " open" : "")} style={width ? { width } : undefined}>
        {children}
      </div>
    </>
  );
}
