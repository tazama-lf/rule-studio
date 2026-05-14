import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import SuspenseLoader from "../../components/SuspenseLoader";
import useSimulationListController from "./useSimulationListController";

const SimulationList = () => {
    const { values, functions } = useSimulationListController();

    if (values?.isLoading && values?.data?.length === 0) {
        return <SuspenseLoader />;
    }

    return (
        <BoxWrapper>
            <Grid
                container
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <ScienceOutlinedIcon sx={{ color: "#4789f6", fontSize: 30 }} />
                    <Box>
                        <Text weight="bold" color="black" size="header">
                            Rule Simulations
                        </Text>
                        <Text color="text.ternary" size="sub">
                            Run and review rule simulations on masked historical transaction data
                        </Text>
                    </Box>
                </Box>
                <Button
                    Icon={PlayArrowIcon}
                    height="40px"
                    type="secondary"
                    size="md"
                    text="New Simulation"
                    onClick={() => functions.navigate("/simulation/create")}
                />
            </Grid>

            <Box mt={3}>
                <Text weight="bold" color="black" size="main">
                    Simulation History
                </Text>
            </Box>

            <Box mt={1}>
                <Table
                    columns={values.columns}
                    data={values.data}
                    loading={values.isLoading}
                    pagination={values.pagination}
                />
            </Box>
        </BoxWrapper>
    );
};

export default SimulationList;
