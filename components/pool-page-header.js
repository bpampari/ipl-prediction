import Link from "next/link";
import { signOutAction } from "@/app/dashboard/actions";

export default function PoolPageHeader({ roomName, title, subtitle, isAdmin, currentPath }) {
  const navItems = [
    { href: "/dashboard", label: "My Picks" },
    { href: "/leaderboard", label: "Leaderboard" }
  ];

  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Admin" });
  }

  return (
    <>
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">IPL 2026 Main Pool</p>
          <h1>{roomName || title}</h1>
          <p className="lead">{subtitle}</p>
        </div>

        <form action={signOutAction}>
          <button className="ghost-button" type="submit">
            Sign out
          </button>
        </form>
      </section>

      <nav className="top-nav">
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={item.href === currentPath ? "nav-link nav-link-active" : "nav-link"}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
