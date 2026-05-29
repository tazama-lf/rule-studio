import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import { Box } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Text } from "../../components/Text";
import * as S from './Sidebar.styles';
import LogoutIcon from '@mui/icons-material/Logout';
import { extractData, resetData } from '../../utils/Common/storage';
import { TRS_ROLES } from '../../utils/Constants/data';

const sharedMenuItems: { icon: React.ReactElement, label: string, route: string, color: string }[] = [
    { icon: <HomeOutlinedIcon />, label: "Home", route: "home", color: "#8f57ee" },
];

const trsMenuItems: { icon: React.ReactElement, label: string, route: string, color: string }[] = [
    { icon: <LayersOutlinedIcon />, label: "Sim Studio", route: "sim-studio", color: "#f59e0b" },
    { icon: <ScienceOutlinedIcon />, label: "Sandbox", route: "sandbox", color: "#2bc08f" },
];

const dataEngineerMenuItems: { icon: React.ReactElement, label: string, route: string, color: string }[] = [
    { icon: <HomeOutlinedIcon />, label: "Masking Configuration", route: "masking-config", color: "#8f57ee" },
];

const Sidebar = ({ expanded }: { expanded: boolean; }) => {
    const user = extractData('user') || {};
    const isTrs = TRS_ROLES.includes(user?.claims ?? '');
    const menuItems = isTrs ? [...sharedMenuItems, ...trsMenuItems] : dataEngineerMenuItems;

    const [activeIdx, setActiveIdx] = useState(0);

    const handleMenuClick = (idx: number) => {
        setActiveIdx(idx);
        navigate(menuItems[idx].route);
    };

    const navigate = useNavigate();

    const handleLogout = () => {
        resetData();
        navigate("/login");
    };

    return (
        <S.SidebarContainer expanded={expanded}>
            <Box flex={1} width="100%" mt={2} >
                {menuItems.map((item, idx) => (
                    <S.MenuItemBox
                        key={idx}
                        active={idx === activeIdx}
                        expanded={expanded}
                        onClick={() => handleMenuClick(idx)}
                    >
                        <S.IconWrapper expanded={expanded} color={item.color}>{item.icon}</S.IconWrapper>
                        {expanded ? (
                            <Text size="sub" weight={idx === activeIdx ? 700 : 350} color={idx === activeIdx ? "text.secondary" : "text.black"} ml={1} mx={3}>
                                {item.label}
                            </Text>
                        ) : null}
                    </S.MenuItemBox>
                ))}
            </Box>
            <Box py={2} width={'100%'} display={'flex'} alignItems={'center'}>
                <S.MenuItemBox
                    expanded={expanded}
                    onClick={() => handleLogout()}
                >
                    <S.IconWrapper expanded={expanded} color={'red'}><LogoutIcon /></S.IconWrapper>
                    {expanded ? (
                        <Text size="sub" weight={350} color={"text.black"} ml={1} mx={3}>
                            Logout
                        </Text>
                    ) : null}
                </S.MenuItemBox>
            </Box>
        </S.SidebarContainer>
    );
};
export default Sidebar;
