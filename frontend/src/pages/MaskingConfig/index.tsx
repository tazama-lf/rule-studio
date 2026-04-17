import AddIcon from "@mui/icons-material/Add";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Box, IconButton } from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "../../components/Button";
import DropDown from "../../components/DropDown";
import Table from "../../components/Table";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import SuspenseLoader from "../../components/SuspenseLoader";
import { claims } from "../../utils/Constants/data";
import useMaskingConfigController from "./useMaskingConfigController";

const MaskingConfig = () => {
    const { values, functions } = useMaskingConfigController();

    if (values?.statusLoad) {
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
                    <SettingsOutlinedIcon sx={{ color: "#4789f6", fontSize: 30 }} />
                    <Text weight="bold" color="black" size="header">
                        My Configuration
                    </Text>
                </Box>
                {values?.user?.claims === claims.data_engineer_editor ? (
                    <Button
                        Icon={AddIcon}
                        height="40px"
                        type="secondary"
                        size="md"
                        text="New Configuration"
                        onClick={() => functions.navigate("/masking-config/action?mode=create")}
                    />
                ) : null}
            </Grid>

            <Grid
                container
                spacing={2}
                alignItems="center"
                mt={2}
            >
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
                    maxWidth={300}
                    label="Transaction Type"
                    height="sm"
                    placeholder="Select transaction type"
                    options={values.transactionTypeOptions}
                    value={values.txtp ?? null}
                    onChange={(val) => functions.setTxtp(val)}
                    multiple={false}
                />

                <IconButton title="Reset Filters" onClick={functions.resetFilter}>
                    <FilterAltOffIcon
                        sx={{
                            width: "25px",
                            height: "25px",
                            "&:hover": {
                                bgcolor: "static.lightGrey",
                            },
                        }}
                    />
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

export default MaskingConfig;
