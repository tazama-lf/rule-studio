import type { NodeInput } from '../../src/types/nodeInput';

// NodeInput is a pure TypeScript interface — no runtime code to cover.
// These tests document the interface contract and verify that objects
// satisfying it at runtime carry the expected property shapes.

describe('NodeInput interface contract (types/nodeInput)', () => {
    describe('required properties', () => {
        const minimal: NodeInput = {
            key: 'amount',
            label: 'Amount',
            defaultValue: '0',
        };

        it('should accept an object with only the three required fields', () => {
            expect(minimal.key).toBe('amount');
            expect(minimal.label).toBe('Amount');
            expect(minimal.defaultValue).toBe('0');
        });

        it('"key" should be a string', () => {
            expect(typeof minimal.key).toBe('string');
        });

        it('"label" should be a string', () => {
            expect(typeof minimal.label).toBe('string');
        });

        it('"defaultValue" should be a string', () => {
            expect(typeof minimal.defaultValue).toBe('string');
        });
    });

    describe('optional properties', () => {
        it('"required" should be undefined when not provided', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '' };
            expect(node.required).toBeUndefined();
        });

        it('"required" should be true when explicitly set', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '', required: true };
            expect(node.required).toBe(true);
        });

        it('"required" should be false when explicitly set', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '', required: false };
            expect(node.required).toBe(false);
        });

        it('"type" should be undefined when not provided', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '' };
            expect(node.type).toBeUndefined();
        });

        it('"type" should accept a string value', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '', type: 'text' };
            expect(node.type).toBe('text');
        });

        it('"options" should be undefined when not provided', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '' };
            expect(node.options).toBeUndefined();
        });

        it('"options" should accept an array of strings', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '', options: ['A', 'B'] };
            expect(node.options).toEqual(['A', 'B']);
        });

        it('"options" should accept an empty array', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '', options: [] };
            expect(node.options).toEqual([]);
        });

        it('"placeholder" should be undefined when not provided', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '' };
            expect(node.placeholder).toBeUndefined();
        });

        it('"placeholder" should accept a string value', () => {
            const node: NodeInput = { key: 'k', label: 'l', defaultValue: '', placeholder: 'Enter value' };
            expect(node.placeholder).toBe('Enter value');
        });
    });

    describe('full object with all fields', () => {
        const full: NodeInput = {
            key: 'status',
            label: 'Status',
            defaultValue: 'active',
            required: true,
            type: 'select',
            options: ['active', 'inactive', 'pending'],
            placeholder: 'Choose status',
        };

        it('should carry all seven fields when fully populated', () => {
            expect(full.key).toBe('status');
            expect(full.label).toBe('Status');
            expect(full.defaultValue).toBe('active');
            expect(full.required).toBe(true);
            expect(full.type).toBe('select');
            expect(full.options).toEqual(['active', 'inactive', 'pending']);
            expect(full.placeholder).toBe('Choose status');
        });

        it('should contain exactly the expected keys', () => {
            const keys = Object.keys(full);
            expect(keys).toEqual(
                expect.arrayContaining(['key', 'label', 'defaultValue', 'required', 'type', 'options', 'placeholder'])
            );
            expect(keys).toHaveLength(7);
        });
    });
});
