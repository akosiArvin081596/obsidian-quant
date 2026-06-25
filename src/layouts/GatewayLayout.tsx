import { Link, Navigate, Outlet } from "react-router-dom";
import AuroraRibbon from "../components/AuroraRibbon";
import { useSession } from "../pages/investor/session";

/**
 * Chrome for the sign-in gateway — full-bleed obsidian field, no marketing nav.
 * Already signed in? Skip the form and drop straight into the member area.
 */
const GatewayLayout = () => {
  const { signedIn } = useSession();

  if (signedIn) return <Navigate to="/investor/dashboard" replace />;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden hex-bg gold-grid">
      <AuroraRibbon intensity={0.35} className="opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/40 to-obsidian" />

      <header className="relative z-10 flex items-center justify-end px-6 py-6 lg:px-16">
        <Link
          to="/"
          className="text-[0.66rem] uppercase tracking-[0.24em] text-silver/55 transition-colors hover:text-gold"
        >
          ← Return to site
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default GatewayLayout;
