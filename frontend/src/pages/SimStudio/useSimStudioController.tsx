import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../components/Cards/StatusCard";
import type { TableColumn } from "../../components/Table";
import useDebouncedSearch from "../../hooks/useDebouncedSearch";
import * as S from "./SimStudio.styles";
import SimStudioActions from "./SimStudioActions";

export type SimSuiteStatus = "Ready for Simulation" | "Draft" | "Generated";

export interface SimSuite {
    id: string;
    suite_name: string;
    associated_rule: string;
    txtp: string;
    status: SimSuiteStatus;
    iterations: number;
    last_updated: string;
}

const MOCK_DATA: SimSuite[] = [
    {
        id: "1",
        suite_name: "High Value Txns - Q3",
        associated_rule: "Rule 001",
        txtp: "pacs.008",
        status: "Ready for Simulation",
        iterations: 3,
        last_updated: "2023-10-24",
    },
    {
        id: "2",
        suite_name: "Velocity Edge Cases",
        associated_rule: "Rule 002",
        txtp: "pacs.002",
        status: "Draft",
        iterations: 0,
        last_updated: "2023-10-25",
    },
    {
        id: "3",
        suite_name: "Cross-border Anomalies",
        associated_rule: "Rule 003",
        txtp: "pain.001",
        status: "Generated",
        iterations: 1,
        last_updated: "2026-05-21",
    },
    {
        id: "4",
        suite_name: "Duplicate Transaction Sweep",
        associated_rule: "Rule 001",
        txtp: "pacs.008",
        status: "Ready for Simulation",
        iterations: 2,
        last_updated: "2023-10-20",
    },
    {
        id: "5",
        suite_name: "Rapid Transfer Burst",
        associated_rule: "Rule 004",
        txtp: "pain.001",
        status: "Draft",
        iterations: 0,
        last_updated: "2023-10-22",
    },
    {
        id: "6",
        suite_name: "Offshore Routing Test",
        associated_rule: "Rule 005",
        txtp: "pacs.002",
        status: "Generated",
        iterations: 4,
        last_updated: "2023-10-18",
    },
];

const AVAILABLE_RULES = [...new Set(MOCK_DATA.map((d) => d.associated_rule))];
const AVAILABLE_TXTPS = [...new Set(MOCK_DATA.map((d) => d.txtp))];

const computeLatestIteration = (data: SimSuite[]): string => {
    if (data.length === 0) return "—";
    const latest = data.reduce((acc, curr) =>
        new Date(curr.last_updated) > new Date(acc.last_updated) ? curr : acc
    );
    const latestDate = new Date(latest.last_updated);
    const today = new Date();
    if (latestDate.toDateString() === today.toDateString()) return "Today";
    return latestDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const useSimStudioController = () => {
    const navigate = useNavigate();
    const [searchInput, debouncedSearch, handleSearch] = useDebouncedSearch("", 300);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [ruleFilter, setRuleFilter] = useState<string>("");
    const [txtpFilter, setTxtpFilter] = useState<string>("");
    const [lastUpdatedFrom, setLastUpdatedFrom] = useState<string>("");
    const [lastUpdatedTo, setLastUpdatedTo] = useState<string>("");

    const stats = useMemo(() => ({
        total: MOCK_DATA.length,
        readyForSimulation: MOCK_DATA.filter((d) => d.status === "Ready for Simulation").length,
        drafts: MOCK_DATA.filter((d) => d.status === "Draft").length,
        latestIteration: computeLatestIteration(MOCK_DATA),
    }), []);

    const filteredData = useMemo(() => {
        return MOCK_DATA.filter((suite) => {
            const matchesSearch =
                debouncedSearch.trim() === "" ||
                suite.suite_name.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesStatus = statusFilter === "" || suite.status === statusFilter;
            const matchesRule = ruleFilter === "" || suite.associated_rule === ruleFilter;
            const matchesTxtp = txtpFilter === "" || suite.txtp === txtpFilter;
            const matchesFrom = lastUpdatedFrom === "" || suite.last_updated >= lastUpdatedFrom;
            const matchesTo = lastUpdatedTo === "" || suite.last_updated <= lastUpdatedTo;
            return matchesSearch && matchesStatus && matchesRule && matchesTxtp && matchesFrom && matchesTo;
        });
    }, [debouncedSearch, statusFilter, ruleFilter, txtpFilter, lastUpdatedFrom, lastUpdatedTo]);

    const hasAdvancedFilters = txtpFilter !== "" || lastUpdatedFrom !== "" || lastUpdatedTo !== "";
    const hasAnyFilter =
        searchInput.trim() !== "" ||
        statusFilter !== "" ||
        ruleFilter !== "" ||
        hasAdvancedFilters;

    const handleResetAdvancedFilters = () => {
        setTxtpFilter("");
        setLastUpdatedFrom("");
        setLastUpdatedTo("");
    };

    const handleResetAllFilters = () => {
        handleSearch("");
        setStatusFilter("");
        setRuleFilter("");
        setTxtpFilter("");
        setLastUpdatedFrom("");
        setLastUpdatedTo("");
    };

    const columns: TableColumn[] = useMemo(() => [
        {
            label: "Suite Name",
            key: "suite_name",
            sx: { fontWeight: 600, color: "#1f2937" },
        },
        {
            label: "Associated Rule",
            key: "associated_rule",
        },
        {
            label: "TXTP",
            key: "txtp",
            render: (row: Record<string, unknown>) => (
                <S.TxtpBadge>{row.txtp as string}</S.TxtpBadge>
            ),
        },
        {
            label: "Status",
            key: "status",
            render: (row: Record<string, unknown>) => (
                <StatusCard status={row.status as string} bullet={false} />
            ),
        },
        { label: "Iterations", key: "iterations" },
        { label: "Last Updated", key: "last_updated", type: "date" as const },
        {
            label: "Actions",
            key: "actions",
            render: (row: Record<string, unknown>) => (
                <SimStudioActions onView={() => handleView(row)} />
            ),
        },
    ], []);

    const handleView = (row: Record<string, unknown>) => {
        navigate(`/sim-studio/view/${row.id}`);
    };

    const handleCreate = () => {
        navigate("/sim-studio/create");
    };

    return {
        values: {
            isLoading: false,
            searchInput,
            statusFilter,
            ruleFilter,
            txtpFilter,
            lastUpdatedFrom,
            lastUpdatedTo,
            filteredData,
            stats,
            columns,
            availableRules: AVAILABLE_RULES,
            availableTxtps: AVAILABLE_TXTPS,
            hasAdvancedFilters,
            hasAnyFilter,
        },
        functions: {
            handleSearch,
            handleStatusFilter: setStatusFilter,
            handleRuleFilter: setRuleFilter,
            handleTxtpFilter: setTxtpFilter,
            handleLastUpdatedFrom: setLastUpdatedFrom,
            handleLastUpdatedTo: setLastUpdatedTo,
            handleResetAdvancedFilters,
            handleResetAllFilters,
            handleCreate,
        },
    };
};

export default useSimStudioController;
