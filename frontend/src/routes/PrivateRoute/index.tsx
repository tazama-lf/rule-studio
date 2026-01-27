import { Navigate, Outlet } from "react-router-dom";
import { extractData } from "../../utils/Common/storage";

const PrivateRoute = () => {

    const isAuthenticated = () => {
        return extractData("access_token")
    }

    return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />

};

export default PrivateRoute