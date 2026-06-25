import { memo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";
import InvestorLayout from "./layouts/InvestorLayout";
import GatewayLayout from "./layouts/GatewayLayout";
import MemberLayout from "./layouts/MemberLayout";

import Home from "./pages/Home";
import Firm from "./pages/Firm";
import Strategy from "./pages/Strategy";
import Architecture from "./pages/Architecture";
import Insights from "./pages/Insights";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import InvestorLogin from "./pages/investor/Login";
import InvestorDashboard from "./pages/investor/Dashboard";
import InvestorPortfolio from "./pages/investor/Portfolio";
import InvestorAccount from "./pages/investor/Account";

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
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    // Investor experience (mockup): sign-in gateway → guarded member area.
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

const App = () => <RouterProvider router={router} />;

export default memo(App);
