import { memo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

import Home from "./pages/Home";
import Firm from "./pages/Firm";
import Strategy from "./pages/Strategy";
import Architecture from "./pages/Architecture";
import Insights from "./pages/Insights";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

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
]);

const App = () => <RouterProvider router={router} />;

export default memo(App);
