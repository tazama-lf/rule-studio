import theme from '../../../src/utils/Theme/index';

describe('theme factory (utils/Theme)', () => {
    let result: ReturnType<typeof theme>;

    beforeAll(() => {
        result = theme();
    });

    it('should be a function', () => {
        expect(typeof theme).toBe('function');
    });

    it('should return a new object on every call', () => {
        expect(theme()).not.toBe(theme());
    });

    describe('breakpoints', () => {
        it('should define xs as 0', () => expect(result.breakpoints.values.xs).toBe(0));
        it('should define sm as 600', () => expect(result.breakpoints.values.sm).toBe(600));
        it('should define md as 960', () => expect(result.breakpoints.values.md).toBe(960));
        it('should define lg as 1280', () => expect(result.breakpoints.values.lg).toBe(1280));
        it('should define xl as 1920', () => expect(result.breakpoints.values.xl).toBe(1920));
    });

    describe('typography', () => {
        it('should set fontFamily to "inherit"', () => {
            expect(result.typography.fontFamily).toBe('inherit');
        });
    });

    describe('palette – primary', () => {
        it('should set primary.main to "#51be99"', () => {
            expect(result.palette.primary.main).toBe('#51be99');
        });
    });

    describe('palette – error', () => {
        it('should set error.main to "#d32f2f"', () => {
            expect(result.palette.error.main).toBe('#d32f2f');
        });
    });

    describe('palette – progressbar', () => {
        it('should set progressbar.main to "#22c55e"', () => {
            expect(result.palette.progressbar.main).toBe('#22c55e');
        });
    });

    describe('palette – text', () => {
        it('should set text.primary to "#1f2937"', () => expect(result.palette.text.primary).toBe('#1f2937'));
        it('should set text.secondary to "#4b7eee"', () => expect(result.palette.text.secondary).toBe('#4b7eee'));
        it('should set text.ternary to "#616a76"', () => expect(result.palette.text.ternary).toBe('#616a76'));
        it('should set text.black to "#000"', () => expect(result.palette.text.black).toBe('#000'));
        it('should set text.white to "#fff"', () => expect(result.palette.text.white).toBe('#fff'));
    });

    describe('palette – static', () => {
        it('should set static.primary to "#1f2937"', () => expect(result.palette.static.primary).toBe('#1f2937'));
        it('should set static.secondary to "#4b7eee"', () => expect(result.palette.static.secondary).toBe('#4b7eee'));
        it('should set static.skyBlue to "#dbeafe"', () => expect(result.palette.static.skyBlue).toBe('#dbeafe'));
        it('should set static.black to "#000"', () => expect(result.palette.static.black).toBe('#000'));
        it('should set static.white to "#fff"', () => expect(result.palette.static.white).toBe('#fff'));
        it('should set static.border to "#dfddde"', () => expect(result.palette.static.border).toBe('#dfddde'));
        it('should set static.grey to "#fbf9fa"', () => expect(result.palette.static.grey).toBe('#fbf9fa'));
        it('should set static.lightGrey to "#f3f4f6"', () => expect(result.palette.static.lightGrey).toBe('#f3f4f6'));
    });
});
