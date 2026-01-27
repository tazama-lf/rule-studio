import { Box, CssBaseline } from '@mui/material';
import Logo from '../../../assets/logo.png';
import tazamaLogo from '../../../assets/tazamaLogo.svg';
import treeImage from '../../../assets/treeImage.png';
import * as S from './Login.styles';
import { Controller } from 'react-hook-form';
import useLoginController from './useLoginController';
import Input from '../../../components/Input';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Button from '../../../components/Button';
import LoginIcon from '@mui/icons-material/Login';

const Login = () => {

    const { values, functions } = useLoginController()

    return (
        <S.Root>
            <CssBaseline />
            <S.BackgroundPattern />

            <S.Header elevation={1}>
                <S.HeaderContent>
                    <Box display="flex" alignItems="center">
                        <img src={tazamaLogo} alt="Tazama Logo" height={30} />
                    </Box>
                </S.HeaderContent>
            </S.Header>

            <S.Main>
                <S.LeftSection>
                    <S.LoginCard>
                        <S.MainLogo src={Logo} alt="Logo" />

                        <S.Title >
                            Tazama Rule Studio
                        </S.Title>

                        <S.Subtitle>
                            Please Enter Your Login Credentials To Access The Portal.
                        </S.Subtitle>

                        <S.FormWrapper>
                            <Controller
                                name="username"
                                control={values.control}
                                rules={{
                                    required: 'Email Address is required',
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <Input
                                        label="Email Address"
                                        required
                                        {...field}
                                        error={error?.message}
                                        leftIcon={() => <EmailIcon />}
                                    />
                                )}
                            />
                            <Controller
                                name="password"
                                control={values.control}
                                rules={{
                                    required: 'Password is required'
                                }}
                                render={({ field, fieldState: { error } }) => (
                                    <Input
                                        label="Password"
                                        required
                                        type='password'
                                        {...field}
                                        error={error?.message}
                                        leftIcon={() => <LockIcon />}
                                    />
                                )}
                            />

                            <Button text="LOGIN" loading={values?.isLoading} type='primary' size='lg' Icon={LoginIcon} onClick={functions.handleSubmit} />
                        </S.FormWrapper>

                        <S.FooterText variant="body2" color="text.black">
                            &copy; {new Date().getFullYear()} Tazama. Powered by Paysys Labs.
                        </S.FooterText>
                    </S.LoginCard>
                </S.LeftSection>

                <S.RightSection>
                    <S.TreeImage src={treeImage} alt="Login visual" />
                </S.RightSection>
            </S.Main>
        </S.Root>
    );
};

export default Login;
