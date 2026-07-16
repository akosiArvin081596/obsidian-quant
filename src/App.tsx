import { lazy, memo, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";
import InvestorLayout from "./layouts/InvestorLayout";
import GatewayLayout from "./layouts/GatewayLayout";
import MemberLayout from "./layouts/MemberLayout";

const Home = lazy(() => import("./pages/Home"));
const Firm = lazy(() => import("./pages/Firm"));
const Strategy = lazy(() => import("./pages/Strategy"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Contact = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InvestorLogin = lazy(() => import("./pages/investor/Login"));
const InvestorDashboard = lazy(() => import("./pages/investor/Dashboard"));
const InvestorPortfolio = lazy(() => import("./pages/investor/Portfolio"));
const InvestorAccount = lazy(() => import("./pages/investor/Account"));

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/firm", element: <Firm /> },
      { path: "/strategy", element: <Strategy /> },
      { path: "/architecture", element: <Architecture /> },
      { path: "/insights", element: <Navigate to="/" replace /> },
      { path: "/contact", element: <Contact /> },
      { path: "/legal/:slug", element: <Legal /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    // Investor experience (UI mockup): sign-in gateway → member-area preview.
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
]);

const App = () => (
  <Suspense fallback={<div className="min-h-screen bg-obsidian" aria-label="Loading page" />}>
    <RouterProvider router={router} />
  </Suspense>
);

export default memo(App);
