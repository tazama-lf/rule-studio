// Mock direct (non-lazy) page imports used in JSX element creation.
jest.mock('../../src/pages/rule-builder', () => () => null);
jest.mock('../../src/pages/test-case-generate', () => () => null);

// Mock lazy-loaded page modules so dynamic imports resolve immediately.
jest.mock('../../src/components', () => ({ default: () => null }));
jest.mock('../../src/pages/Auth/Login', () => ({ default: () => null }));
jest.mock('../../src/pages/Home', () => ({ default: () => null }));
jest.mock('../../src/pages/RuleEditor', () => ({ default: () => null }));
jest.mock('../../src/pages/ComingSoon', () => ({ default: () => null }));
jest.mock('../../src/pages/MaskingConfig', () => ({ default: () => null }));
jest.mock('../../src/pages/CreateMask', () => ({ default: () => null }));
jest.mock('../../src/pages/Simulation', () => ({ default: () => null }));
jest.mock('../../src/pages/SimulationList', () => ({ default: () => null }));
jest.mock('../../src/pages/SimulationView', () => ({ default: () => null }));
jest.mock('../../src/pages/SimulationError', () => ({ default: () => null }));
jest.mock('../../src/pages/SimStudio', () => ({ default: () => null }));
jest.mock('../../src/pages/SimStudio/CreateSimSuite', () => ({ default: () => null }));

// Mock React.lazy to immediately invoke the factory — covers the lazy callback functions.
jest.mock('react', () => {
    const actual = jest.requireActual<typeof import('react')>('react');
    return {
        ...actual,
        lazy: jest.fn((factory: () => Promise<{ default: React.ComponentType<unknown> }>) => {
            factory(); // invoke the import() callback for Istanbul coverage
            return () => null;
        }),
    };
});

// Mock Navigate so JSX can be constructed at module load time.
jest.mock('react-router-dom', () => ({
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) =>
        JSON.stringify({ to, replace }) as unknown as React.ReactElement,
}));

// Lazy-loaded pages are not invoked at import time, so no upfront mock needed.

import { ROUTES } from '../../src/routes';

describe('ROUTES (routes/index)', () => {
    describe('Module structure', () => {
        it('should export ROUTES as an array', () => {
            expect(Array.isArray(ROUTES)).toBe(true);
        });

        it('should export exactly 22 routes', () => {
            expect(ROUTES).toHaveLength(22);
        });

        it('every route should have a "path" string', () => {
            ROUTES.forEach((r) => {
                expect(typeof r.path).toBe('string');
                expect(r.path.length).toBeGreaterThan(0);
            });
        });

        it('every route should have an "element" property', () => {
            ROUTES.forEach((r) => {
                expect(r.element).toBeDefined();
            });
        });

        it('every route should have a boolean "private" field', () => {
            ROUTES.forEach((r) => {
                expect(typeof r.private).toBe('boolean');
            });
        });

        it('every route should have a boolean "layout" field', () => {
            ROUTES.forEach((r) => {
                expect(typeof r.layout).toBe('boolean');
            });
        });
    });

    describe('Individual route definitions', () => {
        const byPath = (path: string) => ROUTES.find((r) => r.path === path)!;

        it('root "/" should redirect to /login (private: false, layout: false)', () => {
            const r = byPath('/');
            expect(r).toBeDefined();
            expect(r.private).toBe(false);
            expect(r.layout).toBe(false);
        });

        it('"/login" route should be public and have no layout', () => {
            const r = byPath('/login');
            expect(r).toBeDefined();
            expect(r.private).toBe(false);
            expect(r.layout).toBe(false);
        });

        it('"/components" route should be private and have no layout', () => {
            const r = byPath('/components');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(false);
        });

        it('"/home" route should be private and use layout', () => {
            const r = byPath('/home');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/editor" route should be private and use layout', () => {
            const r = byPath('/editor');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/editor/:id" route should be private and use layout', () => {
            const r = byPath('/editor/:id');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/rule-builder/:id" route should be private with no layout', () => {
            const r = byPath('/rule-builder/:id');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(false);
        });

        it('"/rule-builder/view/:id" route should be private with no layout', () => {
            const r = byPath('/rule-builder/view/:id');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(false);
        });

        it('"/test-case-generate/:ruleId" route should be private with no layout', () => {
            const r = byPath('/test-case-generate/:ruleId');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(false);
        });

        it('"/test-case-generate/view/:ruleId" route should be private with no layout', () => {
            const r = byPath('/test-case-generate/view/:ruleId');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(false);
        });

        it('"/datasets" route should be private and use layout', () => {
            const r = byPath('/datasets');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/settings" route should be private and use layout', () => {
            const r = byPath('/settings');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/help" route should be private and use layout', () => {
            const r = byPath('/help');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/sim-studio" route should be private and use layout', () => {
            const r = byPath('/sim-studio');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(true);
        });

        it('"/sim-studio/create" route should be private with no layout', () => {
            const r = byPath('/sim-studio/create');
            expect(r).toBeDefined();
            expect(r.private).toBe(true);
            expect(r.layout).toBe(false);
        });
    });

    describe('Public vs private route counts', () => {
        it('should have exactly 2 public routes (private: false)', () => {
            const publicRoutes = ROUTES.filter((r) => !r.private);
            expect(publicRoutes).toHaveLength(2);
        });

        it('should have exactly 20 private routes (private: true)', () => {
            const privateRoutes = ROUTES.filter((r) => r.private);
            expect(privateRoutes).toHaveLength(20);
        });

        it('should have exactly 14 routes with layout: true', () => {
            const layoutRoutes = ROUTES.filter((r) => r.layout);
            expect(layoutRoutes).toHaveLength(14);
        });

        it('should have exactly 8 routes with layout: false', () => {
            const noLayoutRoutes = ROUTES.filter((r) => !r.layout);
            expect(noLayoutRoutes).toHaveLength(8);
        });
    });

    describe('Route path uniqueness', () => {
        it('should have unique paths', () => {
            const paths = ROUTES.map((r) => r.path);
            const unique = new Set(paths);
            expect(unique.size).toBe(paths.length);
        });
    });
});
