import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { useEffect } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Input from "../../components/Input";
import DropDown from "../../components/DropDown";
import StatusCard from "../../components/Cards/StatusCard";
import Table from "../../components/Table";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import useSimulationViewController from "./useSimulationViewController";

interface OverviewProps {
    title: string;
    Icon: SvgIconComponent;
    count: number;
    bgColor?: string;
    iconColor?: string;
}

const Overview = ({ title, Icon, count, bgColor = "#f3f4f6", iconColor = "#6b7280" }: OverviewProps) => (
    <Grid size={{ xs: 6, md: 3 }}>
        <Box
            p={2}
            bgcolor={bgColor}
            borderRadius={1}
            border="1px solid"
            borderColor="divider"
            height="80px"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
        >
            <Box display="flex" alignItems="center" gap={1}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="8px"
                    width={32}
                    height={32}
                    bgcolor={bgColor}
                    border="1px solid"
                    borderColor="divider"
                >
                    <Icon sx={{ fontSize: 18, color: iconColor }} />
                </Box>
                <Text color="text.ternary" weight="500" size="sub">
                    {title}
                </Text>
            </Box>
            <Text color={iconColor} size="header" weight="bold">
                {count.toLocaleString()}
            </Text>
        </Box>
    </Grid>
);

const SimulationView = () => {
    const { values, functions } = useSimulationViewController();

    useEffect(() => {
        functions.fetchStats();
    }, [functions.fetchStats]);

    useEffect(() => {
        functions.fetchResults();
    }, [functions.fetchResults]);

    return (
        <BoxWrapper>
            {/* Back link */}
            <Box
                display="flex"
                alignItems="center"
                gap={0.5}
                mb={3}
                sx={{ cursor: "pointer" }}
                onClick={() => functions.navigate("/simulation")}
            >
                <ArrowBackIcon sx={{ fontSize: 18, color: "#4789f6" }} />
                <Text color="#4789f6" size="sub" weight="500">
                    Back to Simulations
                </Text>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                    <Text weight="bold" color="black" size="bigHeader">
                        Simulation Results
                    </Text>
                    {values.id && (
                        <Text color="text.ternary" size="sub" mt={0.5}>
                            SIM-{values.id}
                        </Text>
                    )}
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    <DropDown
                        height="sm"
                        maxWidth={200}
                        label="Iteration"
                        placeholder="Select iteration"
                        options={values.iterationOptions}
                        value={values.iterationOptions.find((o) => o.value === values.iterationNo) ?? null}
                        onChange={(val) => {
                            const v = val as { value: string } | null;
                            if (v) functions.setIterationNo(v.value);
                        }}
                        multiple={false}
                    />
                    <StatusCard status="COMPLETED" bullet={false} />
                </Box>
            </Box>
            <Box
                display="flex"
                borderRadius={1}
                border="1px solid"
                borderColor="divider"
                overflow="hidden"
                mb={3}
            >
                <Box sx={{ width: 4, bgcolor: "#4789f6", flexShrink: 0 }} />
                <Box display="flex" flex={1} p={2.5} gap={8}>
                    <Box>
                        <Text color="text.ternary" weight="600" size="sub" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                            Run Date & Time
                        </Text>
                        <Text color="black" size="body" weight="500" mt={0.5}>
                            {values.runDateTime}
                        </Text>
                    </Box>
                    <Box>
                        <Text color="text.ternary" weight="600" size="sub" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                            Replay Duration
                        </Text>
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: "text.ternary" }} />
                            <Text color="black" size="body" weight="500">
                                {values.replayDuration}
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Overview stat cards */}
            <Grid container spacing={3} mb={3}>
                {values.overviewItems.map((item) => (
                    <Overview
                        key={item.key}
                        title={item.title}
                        Icon={item.Icon}
                        count={item.count}
                        bgColor={item.bgColor}
                        iconColor={item.iconColor}
                    />
                ))}
            </Grid>

            {/* Results table */}
            <Box
                border="1px solid"
                borderColor="divider"
                borderRadius={1}
                p={2}
            >
                <Text weight="bold" color="black" size="main" mb={2}>
                    Simulation Results
                </Text>

                {/* Filters */}
                <Grid container spacing={2} alignItems="center" mb={2}>
                    <Input
                        maxWidth={240}
                        value={values.msgIdFilter}
                        onChange={(e) => functions.setMsgIdFilter(e.target.value)}
                        height="sm"
                        placeholder="Search Message ID..."
                        leftIcon={() => <SearchIcon />}
                    />
                    <Input
                        maxWidth={240}
                        value={values.msgTypeFilter}
                        onChange={(e) => functions.setMsgTypeFilter(e.target.value)}
                        height="sm"
                        placeholder="Search Message Type..."
                        leftIcon={() => <SearchIcon />}
                    />
                    <DropDown
                        maxWidth={200}
                        label="Outcome"
                        height="sm"
                        placeholder="Select outcome"
                        options={[
                            { label: "Hit", value: "Hit" },
                            { label: "No-Hit", value: "No-Hit" },
                        ]}
                        value={values.outcomeFilter ? { label: values.outcomeFilter, value: values.outcomeFilter } : null}
                        onChange={(val) => {
                            const v = val as { value: string } | null;
                            functions.setOutcomeFilter((v?.value ?? "") as "" | "Hit" | "No-Hit");
                        }}
                        multiple={false}
                    />
                    <IconButton title="Reset Filters" onClick={functions.handleClearFilters}>
                        <FilterAltOffIcon sx={{ width: "22px", height: "22px" }} />
                    </IconButton>
                </Grid>

                <Table
                    columns={values.columns}
                    data={values.data}
                    pagination={values.pagination}
                />
            </Box>
        </BoxWrapper>
    );
};

export default SimulationView;
