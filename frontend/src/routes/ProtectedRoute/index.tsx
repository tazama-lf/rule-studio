import { Navigate, Outlet } from "react-router-dom";
import { extractData } from "../../utils/Common/storage";
import { DATA_ENGINEER_ROLES } from "../../utils/Constants/data";

const ProtectedRoute = () => {

    const token = extractData("access_token")
    if (!token) return <Outlet />

    const user = extractData("user")
    const redirectTo = DATA_ENGINEER_ROLES.includes(user?.claims ?? '') ? '/masking-config' : '/home'
    return <Navigate to={redirectTo} />

};

export default ProtectedRoute