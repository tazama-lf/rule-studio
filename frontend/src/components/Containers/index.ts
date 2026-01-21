import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { NAV_HEIGHT } from "../../utils/Constants";

export const SecondaryContainer = styled(Grid)({
    height: `calc(100vh - ${NAV_HEIGHT}px)`,
    width: '90%',
    margin: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
});


export const SectionContainer = styled(SecondaryContainer)(({ theme }) => ({
    height: 'auto',
    marginTop: theme.spacing(16),
    marginBottom: theme.spacing(16),
}));