import type { ReactElement } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { VIEW_META } from "./viewMeta";
import logo from "../assets/logo.jpeg";

function initialsOf(name: string): string {
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const NAV_ITEMS: { to: string; label: string; icon: ReactElement; count?: string; hot?: boolean }[] = [
  {
    to: "/",
    label: "Overview",
    icon: (
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    ),
  },
  {
    to: "/business",
    label: "Business Overview",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
        <path d="M10 12v2h4v-2" />
      </>
    ),
  },
  {
    to: "/orders",
    label: "Orders",
    icon: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),
  },
  {
    to: "/reports",
    label: "Reports",
    icon: <path d="M4 20V10M11 20V4M18 20v-7" />,
  },
];

const NAV_ITEMS_OPS: { to: string; label: string; icon: ReactElement; count?: string; hot?: boolean; end?: boolean }[] = [
  {
    to: "/customers",
    label: "Customers",
    icon: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 4.2 1.7" />
        <path d="M17 8l5 5M22 8l-5 5" />
      </>
    ),
  },
  {
    to: "/vouchers",
    label: "Vouchers",
    end: true,
    icon: (
      <>
        <path d="M3 8a2 2 0 0 0 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        <path d="M9 3v18" strokeDasharray="2 2" />
      </>
    ),
  },
  {
    to: "/approvals",
    label: "Approvals",
    icon: (
      <>
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    to: "/wallet",
    label: "Wallet & SuperCoins",
    icon: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
        <path d="M3 7v10a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        <path d="M17 12h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4z" />
      </>
    ),
  },
  {
    to: "/refunds",
    label: "Refunds",
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 8v4l3 2" strokeLinecap="round" />
      </>
    ),
  },
  {
    to: "/exceptions",
    label: "Exceptions",
    icon: (
      <>
        <path d="M12 3 2 20h20z" />
        <path d="M12 10v4M12 17h.01" />
      </>
    ),
  },
];

const NAV_ITEMS_COMPLIANCE: { to: string; label: string; icon: ReactElement }[] = [
  {
    to: "/audit",
    label: "Audit Log",
    icon: (
      <>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
];

function NavRow({ item }: { item: { to: string; label: string; icon: ReactElement; count?: string; hot?: boolean; end?: boolean } }) {
  return (
    <NavLink to={item.to} end={item.to === "/" || item.end} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {item.icon}
      </svg>
      <span>{item.label}</span>
      {item.count && <span className={"count" + (item.hot ? " hot" : "")}>{item.count}</span>}
    </NavLink>
  );
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const meta = VIEW_META[location.pathname] ?? VIEW_META["/"];
  const displayName = user?.username ?? "";
  const initials = displayName ? initialsOf(displayName) : "";

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark" src={logo} alt="Gift360" />
          <div className="brand-text">
            <div className="name">Gift360 Admin</div>
            <div className="sub">Admin Console</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-label">Visibility</div>
          {NAV_ITEMS.map((item) => (
            <NavRow key={item.to} item={item} />
          ))}
          <div className="nav-label">Operations</div>
          {NAV_ITEMS_OPS.map((item) => (
            <NavRow key={item.to} item={item} />
          ))}
          <div className="nav-label">Compliance</div>
          {NAV_ITEMS_COMPLIANCE.map((item) => (
            <NavRow key={item.to} item={item} />
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="role-chip">
            <span className="role-dot" />
            <span>{user?.email ?? "—"}</span>
          </div>
          <div className="faint" style={{ fontSize: 10, marginTop: 3 }}>
            dashboard.gift360.com
          </div>
        </div>
      </aside>

      <header className="topbar">
        <div className="page-heading">
          <h1>{meta.title}</h1>
          <div className="crumb">Gift360 Admin / <span>{meta.crumb}</span></div>
        </div>
        <div className="search-mini">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search order, customer, mobile, txn ref…" />
        </div>
        <button className="icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          <span className="dot" />
        </button>
        <div className="user-chip">
          <div className="avatar">{initials}</div>
          <div>
            <div className="uname">{displayName}</div>
            <div className="urole">{user?.permissions.length ?? 0} permissions</div>
          </div>
        </div>
        <button className="icon-btn" title="Log out" onClick={onLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </header>
      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
