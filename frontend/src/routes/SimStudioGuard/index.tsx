import { Navigate, Outlet } from "react-router-dom";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";
import SuspenseLoader from "../../components/SuspenseLoader";

const SimStudioGuard = () => {
    const { isLoading, isSimStudioEnabled } = useFeatureFlags();
    if (isLoading) return <SuspenseLoader />;
    if (!isSimStudioEnabled) return <Navigate to="/home" replace />;
    return <Outlet />;
};

export default SimStudioGuard;
