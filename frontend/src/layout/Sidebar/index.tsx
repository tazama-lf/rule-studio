import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { Box } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Text } from "../../components/Text";
import * as S from './Sidebar.styles';
import LogoutIcon from '@mui/icons-material/Logout';
import { resetData } from '../../utils/Common/storage';

const menuItems: { icon: React.ReactElement, label: string, route: string, color: string }[] = [
    { icon: <HomeOutlinedIcon />, label: "Rules Home", route: "home", color: "#8f57ee" },
    // { icon: <CodeIcon />, label: "Rule Editor", route: "editor", color: "#4789f6" },
    { icon: <StorageRoundedIcon />, label: "Datasets", route: "datasets", color: "#2bc08f" },
    { icon: <SettingsOutlinedIcon />, label: "Settings", route: "settings", color: "#f5a319" },
    { icon: <HelpOutlineOutlinedIcon />, label: "Help", route: "help", color: "#8f57ee" },
];

const Sidebar = ({ expanded }: { expanded: boolean; }) => {
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
