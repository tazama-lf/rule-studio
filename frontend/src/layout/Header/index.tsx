import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, IconButton, Stack } from "@mui/material";
import logo from "../../assets/logo.png";
import { Text } from '../../components/Text';
import { extractData } from '../../utils/Common/storage';
import { capitalize } from '../../utils/Common/helpers';

const Header = ({ expanded, setExpanded }: { expanded: boolean; setExpanded: (v: boolean) => void }) => {

    const iconButtonStyle = {
        width: '25px',
        height: '25px',
        "&:hover": {
            bgcolor: "#f3f4f6",
        },
    };

    const user = extractData('user') || {}

    return (
        <Box
            display="flex"
            height={'100%'}
            px={3}
        >
            <Box display="flex" alignItems="center" width="100vw">
                <Box flex={1} display={'flex'} alignItems={'center'}>
                    <IconButton onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Close sidebar" : "Open sidebar"}>
                        {expanded ? (
                            <CloseIcon fontSize="small" sx={iconButtonStyle} />
                        ) : (
                            <MenuIcon fontSize="small" sx={iconButtonStyle} />
                        )}
                    </IconButton>
                    <Box
                        component="img"
                        src={logo}
                        alt="Logo"
                        sx={{
                            width: '32px',
                            height: '32px',
                            mx: 2,
                            maxWidth: "100%",
                        }}
                    />
                    <Text color="text.black" weight="bold" size="subHeader">
                        Tazama Rule Studio
                    </Text>
                </Box>

                {
                    user?.claims && user?.username ?

                        <Stack direction="row" spacing={1}>
                            <Text color="text.black" weight={600} size="body">
                                {user?.username}
                            </Text>
                            <Text color="static.ternary" size="body">
                                - {capitalize(user?.claims || '')}
                            </Text>
                        </Stack>
                        : null}
            </Box>
        </Box>
    );
};

export default Header;
