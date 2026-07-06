import { Link, useLocation } from "react-router-dom";
import { FiberConnectButton, useFiberConnect } from "@fiberx/react";
import { Logo } from "./Logo.js";

export function TopNav() {
  const { connected, grant } = useFiberConnect();
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-40 -mx-4 mb-8 px-4 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
        <Link to="/" className="shrink-0">
          <Logo size={34} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" active={pathname === "/"}>
            Home
          </NavLink>
          <NavLink to="/dashboard" active={pathname.startsWith("/dashboard")}>
            Dashboard
          </NavLink>
          <a
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white/60 transition hover:text-white"
            href="https://github.com/Obiajulu-gif/FiberX"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`chip hidden sm:inline-flex ${
              connected
                ? "bg-fx-emerald/15 text-fx-emerald"
                : "bg-white/10 text-white/55"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "animate-pulse bg-fx-emerald" : "bg-white/40"
              }`}
            />
            {connected ? `${grant?.providerType ?? "wallet"} · live` : "offline"}
          </span>
          <FiberConnectButton />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
