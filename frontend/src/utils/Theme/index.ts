const theme = () => {
    const primaryPalette = {
        main: '#51be99',
    };

    const errorPalette = {
        main: '#d32f2f',
    };

    const progressPalette = {
        main: '#22c55e',
    };


    const staticColorPalette = {
        primary: '#1f2937',
        secondary: '#4b7eee',
        skyBlue: '#dbeafe',
        ternary: '#616a76',
        black: '#000',
        white: '#fff',
        lightBlue: '#eff6ff',
        border: '#dfddde',
        grey: '#fbf9fa',
        lightGrey: '#f3f4f6',
        darkGreen : '#166534'
    };

    return {
        breakpoints: {
            values: {
                xs: 0, // Extra small devices (portrait phones)
                sm: 600, // Small devices (landscape phones)
                md: 960, // Medium devices (tablets)
                lg: 1280, // Large devices (desktops)
                xl: 1920, // Extra large devices (large desktops)
            },
        },

        typography: {
            fontFamily: 'inherit',
        },
        palette: {
            primary: primaryPalette,
            text: {
                primary: staticColorPalette.primary,
                secondary: staticColorPalette.secondary,
                ternary: staticColorPalette.ternary,
                black: staticColorPalette.black,
                white: staticColorPalette.white
            },
            static: staticColorPalette,
            error: errorPalette,
            progressbar: progressPalette,
        },
    };
};

export default theme;
