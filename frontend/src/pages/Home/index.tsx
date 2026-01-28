import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { Box, IconButton } from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "../../components/Button";
import DropDown from "../../components/DropDown";
import Input from "../../components/Input";
import Table from "../../components/Table";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import useHomeController from "./useHomeController";
import { claims } from "../../utils/Constants/data";
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import SuspenseLoader from "../../components/SuspenseLoader";

const Home = () => {
    const { values, functions } = useHomeController();

    if (values?.statusLoad) {
        return <SuspenseLoader />
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
                    <HomeOutlinedIcon sx={{ color: "#8f57ee", fontSize: 30 }} />
                    <Text weight={'bold'} color="black" size="header">
                        Rules Home
                    </Text>
                </Box>
                {
                    values?.user?.claims === claims.editor ?
                        <Button
                            Icon={AddIcon}
                            height="40px"
                            type="secondary"
                            size="md"
                            text="Create New Rule"
                            onClick={()=>functions.handleCreateEdit()}
                        />
                        : null}
            </Grid>

            <Grid
                container
                spacing={2}
                alignItems="center"
                mt={2}
            >
                <Input
                    maxWidth={300}
                    value={values.searchTerm}
                    onChange={(e) => functions.setSearchTerm(e.target.value)}
                    height="sm"
                    placeholder="Search rules..."
                    leftIcon={() => <SearchIcon />}
                />

                <DropDown
                    maxWidth={300}
                    label="Status"
                    height="sm"
                    placeholder="Select status"
                    options={values.statusOptions}
                    value={values.status ?? null}
                    onChange={(val) => functions.setStatus(val)}
                    multiple={false}
                />

                <DropDown
                    height="sm"
                    maxWidth={300}
                    label="Rule Type"
                    placeholder="Select rule type"
                    options={values.ruleTypes}
                    value={values.ruleType ?? null}
                    onChange={(val) => functions.setRuleType(val)}
                    multiple={false}
                />
                <IconButton title="Reset Filters" onClick={functions.resetFilter}>
                    <FilterAltOffIcon sx={{
                        width: '25px',
                        height: '25px',
                        "&:hover": {
                            bgcolor: "#f3f4f6",
                        },
                    }} />
                </IconButton>
            </Grid>

            <Box mt={3}>
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

export default Home;
