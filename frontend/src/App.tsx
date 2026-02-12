import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import { useMemo } from 'react';
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { ModalProvider } from './contexts/ModalContext';
import MainLayout from './layout/MainLayout';
import { ROUTES } from './routes';
import PrivateRoute from './routes/PrivateRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import theme from './utils/Theme';

const themeMode = createTheme(theme());

function App() {

  const privateWithLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === true && route.layout === true),
    []
  );

  const publicNoLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === false && route.layout === false),
    []
  );

  const privateWithoutLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === true && route.layout === false),
    []
  );

  return (
    <BrowserRouter>
      <ThemeProvider theme={themeMode}>
        <ModalProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route >
                {
                  publicNoLayoutRoutes.map((item, index) => (
                    <Route key={index} path={item.path} element={item.element} />
                  ))
                }
              </Route>
            </Route>
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                {
                  privateWithLayoutRoutes.map((item, index) => (
                    <Route key={index} path={item.path} element={item.element} />
                  ))
                }
              </Route>
              <Route>
                {
                  privateWithoutLayoutRoutes.map((item, index) => (
                    <Route key={index} path={item.path} element={item.element} />
                  ))
                }
              </Route>
            </Route>


          </Routes>
        </ModalProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
