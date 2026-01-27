import { lazy } from "react";
import { Navigate } from "react-router-dom";

const Components = lazy(() => import("../components"));
const Login = lazy(() => import("../pages/Auth/Login"));
const Home = lazy(() => import("../pages/Home"));
const RuleEditor = lazy(() => import("../pages/RuleEditor"));
const ComingSoon = lazy(() => import("../pages/ComingSoon"));

export const ROUTES = [
    {
        path: "/components",
        element: <Components />,
        private: true,
        layout: false
    },
    {
        path: "/",
        element: <Navigate to="/login" replace />,
        private: false,
        layout: false,
    },
    {
        path: "/login",
        element: <Login />,
        private: false,
        layout: false
    },
    {
        path: "/home",
        element: <Home />,
        private: true,
        layout: true,
    },
    {
        path: "/editor",
        element: <RuleEditor />,
        private: true,
        layout: true,
    },
    {
        path: "/editor/:id",
        element: <RuleEditor />,
        private: true,
        layout: true,
    },
    {
        path: "/datasets",
        element: <ComingSoon />,
        private: true,
        layout: true,
    },
    {
        path: "/settings",
        element: <ComingSoon />,
        private: true,
        layout: true,
    },
    {
        path: "/help",
        element: <ComingSoon />,
        private: true,
        layout: true,
    },
];