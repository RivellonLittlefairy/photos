import { NavLink, Outlet } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: "/", label: "时间轴", end: true },
  { to: "/albums", label: "相册" }
];

export function StudioLayout() {
  return (
    <div className="studio-shell">
      <nav className="top-nav glass-nav">
        <div className="top-nav-left">
          <span className="brand-mark">生活档案</span>
        </div>

        <div className="top-link-group">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "top-link active" : "top-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="top-nav-right">
          <div className="avatar-ring">
            <div className="avatar">M</div>
          </div>
        </div>
      </nav>

      <main className="main-stage">
        <Outlet />
      </main>

      <nav className="mobile-tab-bar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "mobile-tab active" : "mobile-tab")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
