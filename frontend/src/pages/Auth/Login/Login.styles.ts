import { styled } from '@mui/material/styles';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';

export const themeColor = '#51BE99';

export const Root = styled(Box)({
  // minHeight: '100vh',
  // width: '100vw',
  position: 'relative',
  overflow: 'hidden',
});

export const BackgroundPattern = styled(Box)({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
  backgroundImage: `
    linear-gradient(45deg, transparent 49%, ${themeColor} 49%, ${themeColor} 51%, transparent 51%),
    linear-gradient(-45deg, transparent 49%, ${themeColor} 49%, ${themeColor} 51%, transparent 51%)
  `,
  backgroundSize: '40px 40px',
  WebkitMaskImage:
    'radial-gradient(ellipse 80% 80% at 0% 100%, #000 50%, transparent 90%), radial-gradient(ellipse 80% 80% at 0% 0%, #000 50%, transparent 90%)',
  maskImage:
    'radial-gradient(ellipse 80% 80% at 0% 100%, #000 50%, transparent 90%), radial-gradient(ellipse 80% 80% at 0% 0%, #000 50%, transparent 90%)',
  opacity: 0.25,
});

export const Header = styled(AppBar)({
  backgroundColor: '#fff',
  color: themeColor,
  position: 'relative',
});

export const HeaderContent = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
});

export const Main = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
}));

export const LeftSection = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
  [theme.breakpoints.up('md')]: {
    flex: 0.5,
  },
}));

export const LoginCard = styled(Box)({
  paddingTop: 64,
  paddingBottom: 64,
  marginInline: 32,
  width: '100%',
  maxWidth: 450,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxSizing: 'border-box',
});

export const MainLogo = styled('img')({
  height: 100,
});

export const Title = styled(Typography)({
  fontWeight: 'bold',
  color: themeColor,
  fontSize: '2rem',
  marginTop: 16,
});

export const Subtitle = styled(Typography)({
  fontSize: 12,
  fontWeight: 'bold',
  marginTop: 8,
  textAlign: 'center',
});

export const FormWrapper = styled(Box)({
  marginTop: 24,
  width: '100%',
  backgroundColor: 'transparent',
  component: 'form',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

export const FooterText = styled(Typography)({
  marginTop: 130,
});

export const RightSection = styled(Box)(({ theme }) => ({
  flex: 0.5,
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

export const TreeImage = styled('img')({
  width: '70%',
  height: 'auto',
  objectFit: 'contain',
  display: 'block',
});
