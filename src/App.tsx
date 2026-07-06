import { lazy, memo, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

const Home = lazy(() => import("./pages/Home"));
const Firm = lazy(() => import("./pages/Firm"));
const Strategy = lazy(() => import("./pages/Strategy"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Insights = lazy(() => import("./pages/Insights"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvestorUnavailable = lazy(() => import("./pages/investor/Unavailable"));

// These imports are removed entirely from production bundles by Vite's
// compile-time DEV replacement. The mock portal is local tooling, not a
// production authentication surface.
const InvestorLayout = import.meta.env.DEV ? lazy(() => import("./layouts/InvestorLayout")) : null;
const GatewayLayout = import.meta.env.DEV ? lazy(() => import("./layouts/GatewayLayout")) : null;
const MemberLayout = import.meta.env.DEV ? lazy(() => import("./layouts/MemberLayout")) : null;
const InvestorLogin = import.meta.env.DEV ? lazy(() => import("./pages/investor/Login")) : null;
const InvestorDashboard = import.meta.env.DEV ? lazy(() => import("./pages/investor/Dashboard")) : null;
const InvestorPortfolio = import.meta.env.DEV ? lazy(() => import("./pages/investor/Portfolio")) : null;
const InvestorAccount = import.meta.env.DEV ? lazy(() => import("./pages/investor/Account")) : null;

const investorDemoRoutes: RouteObject[] = import.meta.env.DEV
  && InvestorLayout
  && GatewayLayout
  && MemberLayout
  && InvestorLogin
  && InvestorDashboard
  && InvestorPortfolio
  && InvestorAccount
  ? [
      {
        // The investor experience is a local-only UI mock. It must never be
        // presented as an authentication boundary in a production build.
        path: "/investor",
        element: <InvestorLayout />,
        children: [
          {
            element: <GatewayLayout />,
            children: [
              { index: true, element: <InvestorLogin /> },
              { path: "login", element: <InvestorLogin /> },
            ],
          },
          {
            element: <MemberLayout />,
            children: [
              { path: "dashboard", element: <InvestorDashboard /> },
              { path: "portfolio", element: <InvestorPortfolio /> },
              { path: "account", element: <InvestorAccount /> },
            ],
          },
        ],
      },
    ]
  : [];

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/firm", element: <Firm /> },
      { path: "/strategy", element: <Strategy /> },
      { path: "/architecture", element: <Architecture /> },
      { path: "/insights", element: <Insights /> },
      { path: "/contact", element: <Contact /> },
      { path: "/investor/*", element: <InvestorUnavailable /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  ...investorDemoRoutes,
]);

const App = () => (
  <Suspense fallback={<div className="min-h-screen bg-obsidian" aria-label="Loading page" />}>
    <RouterProvider router={router} />
  </Suspense>
);

export default memo(App);
