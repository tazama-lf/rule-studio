// Mock every API module so the store can be imported without real network calls.
// Each mock supplies the minimal shape ConfigureStore needs: reducerPath, reducer, middleware.

const makeApiMock = (path: string) => ({
    reducerPath: path,
    reducer: (state = { queries: {}, mutations: {} }) => state,
    middleware: () => (next: (a: unknown) => unknown) => (action: unknown) => next(action),
});

jest.mock('../../../src/redux/Api/Auth', () => ({
    authApi: makeApiMock('authApi'),
}));

jest.mock('../../../src/redux/Api/Rules', () => ({
    rulesApi: makeApiMock('rulesApi'),
}));

jest.mock('../../../src/redux/Api/Config', () => ({
    configApi: makeApiMock('configApi'),
}));

jest.mock('../../../src/redux/Api/Parse', () => ({
    parseApi: makeApiMock('parseApi'),
}));

jest.mock('../../../src/redux/Api/Rule-builder', () => ({
    ruleBuilderApi: makeApiMock('ruleBuilderApi'),
}));

jest.mock('../../../src/redux/Api/Simulation', () => ({
    simulationApi: makeApiMock('simulationApi'),
}));

jest.mock('../../../src/redux/Api/Nats', () => ({
    natsApi: makeApiMock('natsApi'),
}));

jest.mock('../../../src/redux/Api/SimulationLogs', () => ({
    logsApi: makeApiMock('logsApi'),
}));

jest.mock('../../../src/middlerwares/apierror.middleware', () =>
    () => (next: (a: unknown) => unknown) => (action: unknown) => next(action)
);

jest.mock('../../../src/middlerwares/apisuccess.middleware', () =>
    () => (next: (a: unknown) => unknown) => (action: unknown) => next(action)
);

// Import the real store after all mocks are set up.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require('../../../src/redux/Store').default;

describe('Redux Store (redux/Store)', () => {
    describe('Module structure', () => {
        it('should export a default store object', () => {
            expect(store).toBeDefined();
            expect(typeof store).toBe('object');
        });

        it('should expose a getState method', () => {
            expect(typeof store.getState).toBe('function');
        });

        it('should expose a dispatch method', () => {
            expect(typeof store.dispatch).toBe('function');
        });

        it('should expose a subscribe method', () => {
            expect(typeof store.subscribe).toBe('function');
        });
    });

    describe('Reducer slices – initial state shape', () => {
        let state: Record<string, unknown>;

        beforeAll(() => {
            state = store.getState() as Record<string, unknown>;
        });

        it('should contain the authApi slice', () => {
            expect(state['authApi']).toBeDefined();
        });

        it('should contain the rulesApi slice', () => {
            expect(state['rulesApi']).toBeDefined();
        });

        it('should contain the configApi slice', () => {
            expect(state['configApi']).toBeDefined();
        });

        it('should contain the parseApi slice', () => {
            expect(state['parseApi']).toBeDefined();
        });

        it('should contain the ruleBuilderApi slice', () => {
            expect(state['ruleBuilderApi']).toBeDefined();
        });

        it('should contain the simulationApi slice', () => {
            expect(state['simulationApi']).toBeDefined();
        });

        it('should contain the natsApi slice', () => {
            expect(state['natsApi']).toBeDefined();
        });

        it('should contain the logsApi slice', () => {
            expect(state['logsApi']).toBeDefined();
        });

        it('should contain exactly 8 top-level slices', () => {
            expect(Object.keys(state)).toHaveLength(12);
        });
    });

    describe('Initial state values', () => {
        let state: Record<string, { queries: Record<string, unknown>; mutations: Record<string, unknown> }>;

        beforeAll(() => {
            state = store.getState() as typeof state;
        });

        it('authApi slice should start with empty queries', () => {
            expect(state['authApi'].queries).toEqual({});
        });

        it('authApi slice should start with empty mutations', () => {
            expect(state['authApi'].mutations).toEqual({});
        });

        it('rulesApi slice should start with empty queries', () => {
            expect(state['rulesApi'].queries).toEqual({});
        });

        it('configApi slice should start with empty queries', () => {
            expect(state['configApi'].queries).toEqual({});
        });

        it('parseApi slice should start with empty queries', () => {
            expect(state['parseApi'].queries).toEqual({});
        });

        it('ruleBuilderApi slice should start with empty queries', () => {
            expect(state['ruleBuilderApi'].queries).toEqual({});
        });

        it('simulationApi slice should start with empty queries', () => {
            expect(state['simulationApi'].queries).toEqual({});
        });

        it('natsApi slice should start with empty queries', () => {
            expect(state['natsApi'].queries).toEqual({});
        });

        it('logsApi slice should start with empty queries', () => {
            expect(state['logsApi'].queries).toEqual({});
        });
    });

    describe('Dispatch behaviour', () => {
        it('should dispatch a plain action and return it', () => {
            const action = { type: 'test/action' };
            const result = store.dispatch(action);
            expect(result).toEqual(action);
        });

        it('should not mutate state after dispatching an unknown action', () => {
            const before = JSON.stringify(store.getState());
            store.dispatch({ type: '@@UNKNOWN_ACTION' });
            const after = JSON.stringify(store.getState());
            expect(after).toBe(before);
        });

        it('should allow subscribers to be registered and notified', () => {
            const listener = jest.fn();
            const unsubscribe = store.subscribe(listener);
            store.dispatch({ type: 'test/notify' });
            expect(listener).toHaveBeenCalledTimes(1);
            unsubscribe();
        });

        it('should stop notifying after unsubscribe', () => {
            const listener = jest.fn();
            const unsubscribe = store.subscribe(listener);
            unsubscribe();
            store.dispatch({ type: 'test/after-unsub' });
            expect(listener).not.toHaveBeenCalled();
        });
    });
});
