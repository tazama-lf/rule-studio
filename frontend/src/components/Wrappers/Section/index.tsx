import Grid from "@mui/material/Grid";
import { Text } from "../../../components/Text";


interface ISection {
    header: string,
    subHeader?: string,
    children: React.ReactNode
}

const Section = ({ header, subHeader, children }: ISection) => {
    return (
        <Grid
            size={12}
            border={1} my={1} mt={3} borderColor={'#dfddde'} borderRadius={2}>
            <Grid px={3} py={1.5} size={12} borderBottom={1} borderColor={'#dfddde'} bgcolor={'static.grey'} >
                <Text color="black" size={'main'}>{header}</Text>
                {subHeader ?
                    <Text mt={0.5} color="text.ternary" size={'sub'}>{subHeader}</Text>
                    : null}
            </Grid>

            <Grid container rowSpacing={3} size={12} p={3}>
                {children}
            </Grid>
        </Grid>
    )
}


export default Section;
