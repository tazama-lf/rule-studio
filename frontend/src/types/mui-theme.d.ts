import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface TypeText {
        ternary: string;
        black: string,
        white: string
    }

    interface Palette {
        static: {
            primary: string;
            secondary: string;
            ternary: string;
            black: string;
            white: string;
            lightBlue: string;
            border: string;
            grey: string;
        };
        progressbar: {
            main: string;
        };
    }

    interface PaletteOptions {
        static?: {
            primary: string;
            secondary: string;
            ternary: string;
            black: string;
            white: string;
            lightBlue: string
            border: string
        };
        progressbar?: {
            main: string;
        };
    }
}
