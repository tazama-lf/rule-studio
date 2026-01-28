import { Navigate, Outlet } from "react-router-dom";
import { extractData } from "../../utils/Common/storage";

const ProtectedRoute = () => {

    const isAuthenticated = () => {
        return !!extractData("access_token")
    }

    return isAuthenticated() ? <Navigate to="/home" /> : <Outlet />

};

export default ProtectedRoute