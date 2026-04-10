import {
    NAV_HEIGHT,
    serial_no_option,
    REGEX,
    baseFontSizes,
    RESET_FLOW_PAYLOAD,
    RESET_TEST_CASE_PAYLOAD,
} from '../../../src/utils/Constants/index';

describe('Constants (utils/Constants/index)', () => {
    describe('NAV_HEIGHT', () => {
        it('should be 60', () => {
            expect(NAV_HEIGHT).toBe(60);
        });
    });

    describe('serial_no_option', () => {
        it('should have label "S. No"', () => {
            expect(serial_no_option.label).toBe('S. No');
        });

        it('should have key "id"', () => {
            expect(serial_no_option.key).toBe('id');
        });
    });

    describe('REGEX', () => {
        it('VERSION_REGEX should match "1.0.0"', () => {
            expect(REGEX.VERSION_REGEX.test('1.0.0')).toBe(true);
        });

        it('VERSION_REGEX should match "10.20.300"', () => {
            expect(REGEX.VERSION_REGEX.test('10.20.300')).toBe(true);
        });

        it('VERSION_REGEX should NOT match "1.0"', () => {
            expect(REGEX.VERSION_REGEX.test('1.0')).toBe(false);
        });

        it('VERSION_REGEX should NOT match "v1.0.0"', () => {
            expect(REGEX.VERSION_REGEX.test('v1.0.0')).toBe(false);
        });

        it('VERSION_REGEX should NOT match "1.0.0-alpha"', () => {
            expect(REGEX.VERSION_REGEX.test('1.0.0-alpha')).toBe(false);
        });
    });

    describe('baseFontSizes', () => {
        it('should have a bigHeader section', () => {
            expect(baseFontSizes.bigHeader).toBeDefined();
            expect(baseFontSizes.bigHeader.default).toBe('2.2rem');
        });

        it('should have a header section', () => {
            expect(baseFontSizes.header.default).toBe('1.5rem');
        });

        it('should have a subHeader section', () => {
            expect(baseFontSizes.subHeader.default).toBe('1.3rem');
        });

        it('should have a main section', () => {
            expect(baseFontSizes.main.default).toBe('1.15rem');
        });

        it('should have a body section', () => {
            expect(baseFontSizes.body.default).toBe('1rem');
        });

        it('should have a sub section', () => {
            expect(baseFontSizes.sub.default).toBe('0.875rem');
        });
    });

    describe('RESET_FLOW_PAYLOAD', () => {
        it('should be an object with nodes and edges arrays', () => {
            expect(Array.isArray(RESET_FLOW_PAYLOAD.nodes)).toBe(true);
            expect(Array.isArray(RESET_FLOW_PAYLOAD.edges)).toBe(true);
        });

        it('should have a Start node', () => {
            const start = RESET_FLOW_PAYLOAD.nodes.find((n) => n.type === 'Start');
            expect(start).toBeDefined();
        });

        it('should have an End node', () => {
            const end = RESET_FLOW_PAYLOAD.nodes.find((n) => n.type === 'End');
            expect(end).toBeDefined();
        });

        it('should have at least one edge', () => {
            expect(RESET_FLOW_PAYLOAD.edges.length).toBeGreaterThan(0);
        });
    });

    describe('RESET_TEST_CASE_PAYLOAD', () => {
        it('should be an object with a nodes array', () => {
            expect(Array.isArray(RESET_TEST_CASE_PAYLOAD.nodes)).toBe(true);
        });

        it('should have a start-node', () => {
            const start = RESET_TEST_CASE_PAYLOAD.nodes.find((n) => n.id === 'start-node');
            expect(start).toBeDefined();
        });

        it('should have an end-node', () => {
            const end = RESET_TEST_CASE_PAYLOAD.nodes.find((n) => n.id === 'end-node');
            expect(end).toBeDefined();
        });
    });
});
