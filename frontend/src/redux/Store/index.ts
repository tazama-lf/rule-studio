import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '../Api/Auth'
import errorLogger from '../../middlerwares/apierror.middleware'
import successLogger from '../../middlerwares/apisuccess.middleware'
import { rulesApi } from '../Api/Rules'
import { configApi } from '../Api/Config'
import { parseApi } from '../Api/Parse'
import { ruleBuilderApi } from '../Api/Rule-builder'
import { simulationApi } from '../Api/Simulation'
import { natsApi } from '../Api/Nats'
import { logsApi } from '../Api/SimulationLogs'
import { maskingApi } from '../Api/Masking'
import { sendToDemsApi } from '../Api/SendToDems'
import { ruleSimulationApi } from '../Api/RuleSimulation'
import { fetchFromDlhApi } from '../Api/FetchDromDlh'
import { dockerHubApi } from '../Api/DockerHub'

export default configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [rulesApi.reducerPath]: rulesApi.reducer,
        [configApi.reducerPath]: configApi.reducer,
        [parseApi.reducerPath]: parseApi.reducer,
        [ruleBuilderApi.reducerPath]: ruleBuilderApi.reducer,
        [simulationApi.reducerPath]: simulationApi.reducer,
        [natsApi.reducerPath]: natsApi.reducer,
        [logsApi.reducerPath]: logsApi.reducer,
        [maskingApi.reducerPath]: maskingApi.reducer,
        [sendToDemsApi.reducerPath]: sendToDemsApi.reducer,
        [ruleSimulationApi.reducerPath]: ruleSimulationApi.reducer,
        [fetchFromDlhApi.reducerPath]: fetchFromDlhApi.reducer,
        [dockerHubApi.reducerPath]: dockerHubApi.reducer,
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
            .concat(natsApi.middleware)
            .concat(logsApi.middleware)
            .concat(maskingApi.middleware)
            .concat(sendToDemsApi.middleware)
            .concat(ruleSimulationApi.middleware)
            .concat(fetchFromDlhApi.middleware)
            .concat(dockerHubApi.middleware)
            .concat(errorLogger)
            .concat(successLogger)
})