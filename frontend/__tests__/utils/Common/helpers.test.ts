// helpers.ts imports dayjs and a DropDown component type — mock the component import.
jest.mock('../../../src/components/DropDown', () => ({}), { virtual: true });

import {
    hideValue,
    sortNodesInFlowOrder,
    getLabelForHandle,
    getColorForHandle,
    getNodesInBranch,
    dateFormatter,
    getNestedValue,
    toDropdown,
    capitalize,
    decodeToken,
} from '../../../src/utils/Common/helpers';

// ─── hideValue ────────────────────────────────────────────────────────────────

describe('hideValue', () => {
    it('should replace each character with "*" by default', () => {
        expect(hideValue('password')).toBe('********');
    });

    it('should use a custom sign', () => {
        expect(hideValue('abc', '#')).toBe('###');
    });

    it('should return empty string for empty input', () => {
        expect(hideValue('')).toBe('');
    });
});

// ─── getLabelForHandle ────────────────────────────────────────────────────────

describe('getLabelForHandle', () => {
    it('"if" → "if"', () => expect(getLabelForHandle('if')).toBe('if'));
    it('"else" → "else"', () => expect(getLabelForHandle('else')).toBe('else'));
    it('"exit" → "exit"', () => expect(getLabelForHandle('exit')).toBe('exit'));
    it('"loopBody" → "loop body"', () => expect(getLabelForHandle('loopBody')).toBe('loop body'));
    it('"body" → "body"', () => expect(getLabelForHandle('body')).toBe('body'));
    it('"elseif0" → "else if"', () => expect(getLabelForHandle('elseif0')).toBe('else if'));
    it('unknown → ""', () => expect(getLabelForHandle('unknown')).toBe(''));
});

// ─── getColorForHandle ────────────────────────────────────────────────────────

describe('getColorForHandle', () => {
    it('"if" → "#4caf50"', () => expect(getColorForHandle('if')).toBe('#4caf50'));
    it('"else" → "#4caf50"', () => expect(getColorForHandle('else')).toBe('#4caf50'));
    it('"exit" → "#000000"', () => expect(getColorForHandle('exit')).toBe('#000000'));
    it('"loopBody" → "#2196F3"', () => expect(getColorForHandle('loopBody')).toBe('#2196F3'));
    it('"body" → "#9c27b0"', () => expect(getColorForHandle('body')).toBe('#9c27b0'));
    it('"elseif1" → "#4caf50"', () => expect(getColorForHandle('elseif1')).toBe('#4caf50'));
    it('unknown → "#555"', () => expect(getColorForHandle('unknown')).toBe('#555'));
});

// ─── sortNodesInFlowOrder ─────────────────────────────────────────────────────

describe('sortNodesInFlowOrder', () => {
    it('should sort two nodes in topological order', () => {
        const nodes = [{ id: 'b' }, { id: 'a' }];
        const edges = [{ source: 'a', target: 'b' }];
        const result = sortNodesInFlowOrder(nodes, edges);
        expect(result.map((n) => n.id)).toEqual(['a', 'b']);
    });

    it('should return the original order when there is a cycle', () => {
        const nodes = [{ id: 'a' }, { id: 'b' }];
        const edges = [
            { source: 'a', target: 'b' },
            { source: 'b', target: 'a' },
        ];
        const result = sortNodesInFlowOrder(nodes, edges);
        expect(result.map((n) => n.id)).toEqual(['a', 'b']);
    });

    it('should handle a single node with no edges', () => {
        const result = sortNodesInFlowOrder([{ id: 'solo' }], []);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('solo');
    });

    it('should handle an empty list', () => {
        expect(sortNodesInFlowOrder([], [])).toEqual([]);
    });

    it('should sort a three-node chain', () => {
        const nodes = [{ id: 'c' }, { id: 'a' }, { id: 'b' }];
        const edges = [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }];
        const result = sortNodesInFlowOrder(nodes, edges);
        expect(result.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    });
});

// ─── getNodesInBranch ─────────────────────────────────────────────────────────

describe('getNodesInBranch', () => {
    type N = { id: string; data?: { nodeType?: string } };
    type E = { source: string; target: string; sourceHandle?: string };

    it('should return nodes reachable from the start via the given handle', () => {
        const nodes: N[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        const edges: E[] = [
            { source: 'a', target: 'b', sourceHandle: 'if' },
            { source: 'b', target: 'c', sourceHandle: 'source' },
        ];
        const result = getNodesInBranch('a', 'if', nodes, edges);
        expect(result.map((n) => n.id)).toContain('b');
        expect(result.map((n) => n.id)).toContain('c');
    });

    it('should stop at an End node', () => {
        const nodes: N[] = [
            { id: 'a' },
            { id: 'b', data: { nodeType: 'End' } },
        ];
        const edges: E[] = [{ source: 'a', target: 'b', sourceHandle: 'source' }];
        const result = getNodesInBranch('a', null, nodes, edges);
        expect(result).toHaveLength(0);
    });

    it('should not revisit already-visited nodes (cycle protection)', () => {
        const nodes: N[] = [{ id: 'a' }, { id: 'b' }];
        const edges: E[] = [
            { source: 'a', target: 'b', sourceHandle: 'source' },
            { source: 'b', target: 'a', sourceHandle: 'source' },
        ];
        const visited = new Set<string>(['b']);
        const result = getNodesInBranch('a', null, nodes, edges, visited);
        expect(result).toHaveLength(0);
    });

    it('should not recurse into If nodes', () => {
        const nodes: N[] = [
            { id: 'a' },
            { id: 'b', data: { nodeType: 'If' } },
            { id: 'c' },
        ];
        const edges: E[] = [
            { source: 'a', target: 'b', sourceHandle: 'source' },
            { source: 'b', target: 'c', sourceHandle: 'if' },
        ];
        const result = getNodesInBranch('a', null, nodes, edges);
        // 'b' is collected but recursion stops there — 'c' not included
        expect(result.map((n) => n.id)).toContain('b');
        expect(result.map((n) => n.id)).not.toContain('c');
    });
});

// ─── dateFormatter ────────────────────────────────────────────────────────────

describe('dateFormatter', () => {
    it('should return null for a falsy date', () => {
        expect(dateFormatter('')).toBeNull();
    });

    it('should return a formatted date string for a valid date', () => {
        const result = dateFormatter('2024-06-15T10:30:00');
        expect(typeof result).toBe('string');
        expect(result).not.toBeNull();
    });

    it('should omit time when options.time is false', () => {
        const result = dateFormatter('2024-06-15T10:30:00', { time: false });
        expect(result).not.toContain(':');
    });
});

// ─── getNestedValue ───────────────────────────────────────────────────────────

describe('getNestedValue', () => {
    it('should return "-" for a null path', () => {
        expect(getNestedValue({}, null)).toBe('-');
    });

    it('should return "-" for an undefined path', () => {
        expect(getNestedValue({}, undefined)).toBe('-');
    });

    it('should resolve a dot-notation path', () => {
        expect(getNestedValue({ a: { b: 'hello' } }, 'a.b')).toBe('hello');
    });

    it('should return "-" for a missing nested path', () => {
        expect(getNestedValue({ a: { b: 'x' } }, 'a.c')).toBe('-');
    });

    it('should resolve bracket notation like [0]', () => {
        expect(getNestedValue({ items: ['first'] }, 'items[0]')).toBe('first');
    });

    it('should join array of paths with the separator', () => {
        const obj = { x: 'foo', y: 'bar' };
        expect(getNestedValue(obj, ['x', 'y'], ' | ')).toBe('foo | bar');
    });

    it('should return "-" when all array paths resolve to "-"', () => {
        expect(getNestedValue({}, ['missing1', 'missing2'])).toBe('-');
    });
});

// ─── toDropdown ───────────────────────────────────────────────────────────────

describe('toDropdown', () => {
    it('should return { label, value } for a non-empty string', () => {
        expect(toDropdown('active')).toEqual({ label: 'active', value: 'active' });
    });

    it('should return null for an empty string', () => {
        expect(toDropdown('')).toBeNull();
    });

    it('should return null for null', () => {
        expect(toDropdown(null)).toBeNull();
    });

    it('should return null for undefined', () => {
        expect(toDropdown(undefined)).toBeNull();
    });
});

// ─── capitalize ───────────────────────────────────────────────────────────────

describe('capitalize', () => {
    it('should capitalize the first letter', () => {
        expect(capitalize('hello')).toBe('Hello');
    });

    it('should work with a single character', () => {
        expect(capitalize('a')).toBe('A');
    });

    it('should not change an already-capitalized string', () => {
        expect(capitalize('World')).toBe('World');
    });

    it('should capitalize the first letter and leave the rest as-is', () => {
        expect(capitalize('hELLO')).toBe('HELLO');
    });
});

// ─── decodeToken ──────────────────────────────────────────────────────────────

const makeJwt = (outerPayload: Record<string, unknown>, innerPayload?: Record<string, unknown>) => {
    const encode = (obj: Record<string, unknown>) =>
        btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const header = encode({ alg: 'HS256', typ: 'JWT' });

    let outer = outerPayload;
    if (innerPayload) {
        outer = {
            ...outerPayload,
            tokenString: `header.${encode(innerPayload)}.sig`,
        };
    }

    return `${header}.${encode(outer)}.signature`;
};

describe('decodeToken', () => {
    it('should return null for an invalid token', () => {
        expect(decodeToken('not.a.token')).toBeNull();
    });

    it('should return null for a token with no valid base64 in slot 1', () => {
        expect(decodeToken('a.!!!.c')).toBeNull();
    });

    it('should decode a flat JWT and extract sub as id', () => {
        const token = makeJwt({ sub: 'user-1', preferred_username: 'alice' });
        const result = decodeToken(token);
        expect(result).not.toBeNull();
        expect(result!.id).toBe('user-1');
        expect(result!.username).toBe('alice');
    });

    it('should extract email when present', () => {
        const token = makeJwt({ sub: 'u1', preferred_username: 'bob', email: 'bob@example.com' });
        const result = decodeToken(token);
        expect(result!.email).toBe('bob@example.com');
    });

    it('should extract tenantId from outer payload', () => {
        const token = makeJwt({ sub: 'u1', preferred_username: 'carol', tenantId: 'tenant-42' });
        const result = decodeToken(token);
        expect(result!.tenantId).toBe('tenant-42');
    });

    it('should extract trs_ claim and strip the prefix', () => {
        const token = makeJwt({ sub: 'u1', preferred_username: 'dave', claims: ['trs_read', 'admin'] });
        const result = decodeToken(token);
        expect(result!.claims).toBe('read');
    });

    it('should decode a nested tokenString and prefer inner preferred_username', () => {
        const token = makeJwt(
            { sub: 'outer-sub' },
            { sub: 'inner-sub', preferred_username: 'inner-user' }
        );
        const result = decodeToken(token);
        expect(result!.username).toBe('inner-user');
    });

    it('should use sub as username when preferred_username/username/name are absent', () => {
        const token = makeJwt({ sub: 'u1' });
        const result = decodeToken(token);
        // The fallback chain: preferred_username → username → sub → 'user'
        // With only sub present, sub ('u1') is used as the username
        expect(result!.username).toBe('u1');
    });

    it('should fallback to "user" when no username-related claims are present', () => {
        // A token with only a claim unrelated to username
        const token = makeJwt({ email: 'test@test.com' });
        const result = decodeToken(token);
        expect(result!.username).toBe('user');
    });
});
