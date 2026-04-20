import { lazy } from "react";
import { Navigate } from "react-router-dom";
import RuleBuilder from "../pages/rule-builder";
import TestCaseGenerate from "../pages/test-case-generate";

const Components = lazy(() => import("../components"));
const Login = lazy(() => import("../pages/Auth/Login"));
const Home = lazy(() => import("../pages/Home"));
const RuleEditor = lazy(() => import("../pages/RuleEditor"));
const ComingSoon = lazy(() => import("../pages/ComingSoon"));
const MaskingConfig = lazy(() => import("../pages/MaskingConfig"));
const CreateMasking = lazy(() => import("../pages/CreateMask"));

export const ROUTES = [
    {
        path: "/components",
        element: <Components />,
        private: true,
        layout: false,
        roleGroup: null,
    },
    {
        path: "/",
        element: <Navigate to="/login" replace />,
        private: false,
        layout: false,
        roleGroup: null,
    },
    {
        path: "/login",
        element: <Login />,
        private: false,
        layout: false,
        roleGroup: null,
    },
    {
        path: "/home",
        element: <Home />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: "/editor",
        element: <RuleEditor />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: "/editor/:id",
        element: <RuleEditor />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: '/rule-builder/:id',
        element: <RuleBuilder />,
        private: true,
        layout: false,
        roleGroup: 'trs' as const,
    },
    {
        path: '/rule-builder/view/:id',
        element: <RuleBuilder viewOnly />,
        private: true,
        layout: false,
        roleGroup: 'trs' as const,
    },
    {
        path: '/test-case-generate/:ruleId',
        element: <TestCaseGenerate />,
        private: true,
        layout: false,
        roleGroup: 'trs' as const,
    },
    {
        path: '/test-case-generate/view/:ruleId',
        element: <TestCaseGenerate viewOnly />,
        private: true,
        layout: false,
        roleGroup: 'trs' as const,
    },
    {
        path: "/datasets",
        element: <ComingSoon />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: "/settings",
        element: <ComingSoon />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: "/help",
        element: <ComingSoon />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: "/sandbox",
        element: <ComingSoon />,
        private: true,
        layout: true,
        roleGroup: 'trs' as const,
    },
    {
        path: "/masking-config",
        element: <MaskingConfig />,
        private: true,
        layout: true,
        roleGroup: 'data-engineer' as const,
    },
    {
        path: "/masking-config/action",
        element: <CreateMasking />,
        private: true,
        layout: true,
        roleGroup: 'data-engineer' as const,
    }
];