import { Navigate, Outlet } from "react-router-dom";
import { extractData } from "../../utils/Common/storage";
import { DATA_ENGINEER_ROLES, TRS_ROLES } from "../../utils/Constants/data";

interface RoleRouteProps {
    group: 'trs' | 'data-engineer';
}

const RoleRoute = ({ group }: RoleRouteProps) => {
    const user = extractData('user')
    const role: string = user?.claims ?? ''

    const allowed = group === 'data-engineer'
        ? DATA_ENGINEER_ROLES.includes(role)
        : TRS_ROLES.includes(role)

    if (!allowed) {
        const fallback = DATA_ENGINEER_ROLES.includes(role) ? '/masking-config' : '/home'
        return <Navigate to={fallback} replace />
    }

    return <Outlet />
};

export default RoleRoute;
