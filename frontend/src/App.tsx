import { ThemeProvider } from '@emotion/react';
import { createTheme } from '@mui/material';
import { Suspense, useMemo } from 'react';
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { ModalProvider } from './contexts/ModalContext';
import MainLayout from './layout/MainLayout';
import { ROUTES } from './routes';
import PrivateRoute from './routes/PrivateRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import SuspenseLoader from './components/SuspenseLoader';
import theme from './utils/Theme';

const themeMode = createTheme(theme());

function App() {

  const publicNoLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === false && route.layout === false),
    []
  );

  const trsWithLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === true && route.layout === true && route.roleGroup === 'trs'),
    []
  );

  const trsWithoutLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === true && route.layout === false && route.roleGroup === 'trs'),
    []
  );

  const dataEngineerWithLayoutRoutes = useMemo(
    () => ROUTES.filter(route => route.private === true && route.layout === true && route.roleGroup === 'data-engineer'),
    []
  );

  const unrestrictedPrivateRoutes = useMemo(
    () => ROUTES.filter(route => route.private === true && route.roleGroup === null),
    []
  );

  return (
    <BrowserRouter>
      <ThemeProvider theme={themeMode}>
        <ModalProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <Suspense fallback={<SuspenseLoader />}>
            <Routes>
              <Route element={<ProtectedRoute />}>
                {publicNoLayoutRoutes.map((item, index) => (
                  <Route key={index} path={item.path} element={item.element} />
                ))}
              </Route>
              <Route element={<PrivateRoute />}>
                <Route element={<RoleRoute group="trs" />}>
                  <Route element={<MainLayout />}>
                    {trsWithLayoutRoutes.map((item, index) => (
                      <Route key={index} path={item.path} element={item.element} />
                    ))}
                  </Route>
                </Route>
                <Route element={<RoleRoute group="trs" />}>
                  {trsWithoutLayoutRoutes.map((item, index) => (
                    <Route key={index} path={item.path} element={item.element} />
                  ))}
                </Route>
                <Route element={<RoleRoute group="data-engineer" />}>
                  <Route element={<MainLayout />}>
                    {dataEngineerWithLayoutRoutes.map((item, index) => (
                      <Route key={index} path={item.path} element={item.element} />
                    ))}
                  </Route>
                </Route>
                {unrestrictedPrivateRoutes.map((item, index) => (
                  <Route key={index} path={item.path} element={item.element} />
                ))}
              </Route>
            </Routes>
          </Suspense>
        </ModalProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
