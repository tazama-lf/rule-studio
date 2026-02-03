import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '../Api/Auth'
import errorLogger from '../../middlerwares/apierror.middleware'
import successLogger from '../../middlerwares/apisuccess.middleware'
import { rulesApi } from '../Api/Rules'
import { configApi } from '../Api/Config'
import { parseApi } from '../Api/Parse'
import { ruleBuilderApi } from '../Api/Rule-builder'
import { simulationApi } from '../Api/Simulation'

export default configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [rulesApi.reducerPath]: rulesApi.reducer,
        [configApi.reducerPath]: configApi.reducer,
        [parseApi.reducerPath]: parseApi.reducer,
        [ruleBuilderApi.reducerPath]: ruleBuilderApi.reducer,
        [simulationApi.reducerPath]: simulationApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
            .concat(authApi.middleware)
            .concat(rulesApi.middleware)
            .concat(configApi.middleware)
            .concat(parseApi.middleware)
            .concat(ruleBuilderApi.middleware)
            .concat(simulationApi.middleware)
            .concat(errorLogger)
            .concat(successLogger)
})