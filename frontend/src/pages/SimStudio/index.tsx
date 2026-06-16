import AddIcon from "@mui/icons-material/Add";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DraftsOutlinedIcon from "@mui/icons-material/DraftsOutlined";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import SearchIcon from "@mui/icons-material/Search";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import {
    Box,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Popover,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { useState, type MouseEvent } from "react";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import * as S from "./SimStudio.styles";
import useSimStudioController from "./useSimStudioController";

const STAT_CONFIG = [
    {
        key: "total" as const,
        label: "Total Suites",
        Icon: StorageOutlinedIcon,
        iconColor: "#4789f6",
    },
    {
        key: "readyForSimulation" as const,
        label: "Ready for Simulation",
        Icon: CheckCircleOutlineIcon,
        iconColor: "#00a63e",
    },
    {
        key: "drafts" as const,
        label: "Draft Suites",
        Icon: DraftsOutlinedIcon,
        iconColor: "#f59e0b",
    },
    {
        key: "latestIteration" as const,
        label: "Latest Iteration",
        Icon: AccessTimeOutlinedIcon,
        iconColor: "#8b5cf6",
    },
] as const;

const SimStudio = () => {
    const { values, functions } = useSimStudioController();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleOpenFilters = (e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleCloseFilters = () => setAnchorEl(null);
    const isFiltersOpen = Boolean(anchorEl);

    return (
        <BoxWrapper>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
                    <LayersOutlinedIcon sx={{ color: "#4789f6", fontSize: 30, flexShrink: 0 }} />
                    <Box minWidth={0}>
                        <Text weight="bold" color="black" size="header">
                            Message Sampler
                        </Text>
                        <Text color="text.ternary" size="sub">
                            Create and manage synthetic simulation suites for rule testing.
                        </Text>
                    </Box>
                </Box>
                <Button
                    Icon={AddIcon}
                    height="40px"
                    type="secondary"
                    size=""
                    text="Create Simulation Suite"
                    onClick={functions.handleCreate}
                />
            </Box>
            <S.StatsRow>
                {STAT_CONFIG.map(({ key, label, Icon, iconColor }) => (
                    <S.StatCard key={key}>
                        <S.StatIconWrapper iconColor={iconColor}>
                            <Icon fontSize="small" />
                        </S.StatIconWrapper>
                        <Box minWidth={0}>
                            <Text size="sub" color="text.ternary">
                                {label}
                            </Text>
                            <Text size="header" weight="bold" color="black">
                                {values.stats[key]}
                            </Text>
                        </Box>
                    </S.StatCard>
                ))}
            </S.StatsRow>
            <S.FiltersRow>
                <TextField
                    size="small"
                    placeholder="Search by suite name..."
                    value={values.searchInput}
                    onChange={(e) => functions.handleSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "text.ternary", fontSize: 18 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        flex: 1,
                        maxWidth: 340,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "6px",
                            "& fieldset": { borderColor: "#dfddde" },
                            "&:hover fieldset": { borderColor: "#b0b0b0" },
                        },
                    }}
                />

                <Select
                    size="small"
                    value={values.statusFilter}
                    onChange={(e) => functions.handleStatusFilter(e.target.value)}
                    displayEmpty
                    sx={S.selectSx}
                >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="RUNNING">Running</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="FAILED">Failed</MenuItem>
                </Select>
                <Select
                    size="small"
                    value={values.ruleFilter}
                    onChange={(e) => functions.handleRuleFilter(e.target.value)}
                    displayEmpty
                    sx={values.ruleFilter ? S.activeSelectSx : S.selectSx}
                >
                    <MenuItem value="">All Rules</MenuItem>
                    {values.availableRules.map((rule) => (
                        <MenuItem key={rule} value={rule}>
                            {rule}
                        </MenuItem>
                    ))}
                </Select>
                <Button
                    Icon={FilterListIcon}
                    height="36px"
                    type="secondary"
                    size=""
                    text="More Filters"
                    onClick={handleOpenFilters}
                />

                {values.hasAnyFilter && (
                    <IconButton
                        title="Reset Filters"
                        onClick={functions.handleResetAllFilters}
                        size="small"
                    >
                        <FilterAltOffIcon
                            sx={{
                                width: "25px",
                                height: "25px",
                                color: "text.ternary",
                                "&:hover": { color: "error.main" },
                            }}
                        />
                    </IconButton>
                )}
            </S.FiltersRow>
            <Popover
                open={isFiltersOpen}
                anchorEl={anchorEl}
                onClose={handleCloseFilters}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.5,
                            width: 300,
                            borderRadius: "8px",
                            border: "1px solid #dfddde",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                        },
                    },
                }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    px={2}
                    py={1.5}
                >
                    <Typography fontWeight={600} fontSize={14} color="text.primary">
                        Advanced Filters
                    </Typography>
                    <IconButton size="small" onClick={handleCloseFilters}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Divider />

                <Box px={2} py={2} display="flex" flexDirection="column" gap={2}>
                    <Box>
                        <Typography fontSize={12} fontWeight={500} color="text.secondary" mb={0.75}>
                            TXTP Type
                        </Typography>
                        <Select
                            size="small"
                            fullWidth
                            value={values.txtpFilter}
                            onChange={(e) => functions.handleTxtpFilter(e.target.value)}
                            displayEmpty
                            sx={{ ...S.selectSx, minWidth: "unset" }}
                            MenuProps={{
                                PaperProps: {
                                    sx: { maxHeight: 220, overflowY: "auto" },
                                },
                            }}
                        >
                            <MenuItem value="">All TXTPs</MenuItem>
                            {values.availableTxtps.map((txtp) => (
                                <MenuItem key={txtp} value={txtp}>
                                    {txtp}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box>
                        <Typography fontSize={12} fontWeight={500} color="text.secondary" mb={0.75}>
                            Last Updated From
                        </Typography>
                        <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={values.lastUpdatedFrom}
                            onChange={(e) => functions.handleLastUpdatedFrom(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "6px",
                                    "& fieldset": { borderColor: "#dfddde" },
                                },
                            }}
                        />
                    </Box>
                    <Box>
                        <Typography fontSize={12} fontWeight={500} color="text.secondary" mb={0.75}>
                            Last Updated To
                        </Typography>
                        <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={values.lastUpdatedTo}
                            onChange={(e) => functions.handleLastUpdatedTo(e.target.value)}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "6px",
                                    "& fieldset": { borderColor: "#dfddde" },
                                },
                            }}
                        />
                    </Box>
                </Box>
            </Popover>
            <Table
                columns={values.columns}
                data={values.filteredData as unknown as Record<string, unknown>[]}
                loading={values.isLoading}
                pagination={values.pagination}
            />
        </BoxWrapper>
    );
};

export default SimStudio;
