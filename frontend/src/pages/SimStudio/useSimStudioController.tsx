import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../components/Cards/StatusCard";
import type { TableColumn } from "../../components/Table";
import useDebouncedSearch from "../../hooks/useDebouncedSearch";
import { useGetSuitesQuery, type SuiteListItem } from "../../redux/Api/SimStudio";
import * as S from "./SimStudio.styles";
import SimStudioActions from "./SimStudioActions";

const computeLatestIteration = (suites: SuiteListItem[]): string => {
    if (suites.length === 0) return "—";
    const withRuns = suites.filter((s) => s.last_run_at);
    if (withRuns.length === 0) return "—";
    const latest = withRuns.reduce((acc, curr) =>
        new Date(curr.last_run_at!) > new Date(acc.last_run_at!) ? curr : acc
    );
    const latestDate = new Date(latest.last_run_at!);
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

    const queryParams = useMemo(() => ({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        rule_name: ruleFilter || undefined,
        txtp: txtpFilter || undefined,
        updated_from: lastUpdatedFrom || undefined,
        updated_to: lastUpdatedTo || undefined,
        limit: 100,
        offset: 0,
    }), [debouncedSearch, statusFilter, ruleFilter, txtpFilter, lastUpdatedFrom, lastUpdatedTo]);

    const { data, isLoading, isFetching } = useGetSuitesQuery(queryParams);

    const suites: SuiteListItem[] = data?.suites ?? [];

    const availableRules = useMemo(
        () => [...new Set(suites.map((s) => s.rule_name).filter(Boolean) as string[])],
        [suites]
    );
    const availableTxtps = useMemo(
        () => [...new Set(suites.map((s) => s.primary_txtp).filter(Boolean) as string[])],
        [suites]
    );

    const stats = useMemo(() => ({
        total: data?.total ?? suites.length,
        readyForSimulation: suites.filter((s) => s.status === "COMPLETED" || s.status === "RUNNING").length,
        drafts: suites.filter((s) => s.status === "DRAFT").length,
        latestIteration: computeLatestIteration(suites),
    }), [data, suites]);

    const tableData = useMemo(() =>
        suites.map((s) => ({
            id: s.id,
            suite_name: s.name,
            associated_rule: s.rule_name ?? "—",
            txtp: s.primary_txtp ?? "—",
            status: s.status,
            iterations: s.iteration_count,
            last_updated: s.updated_at ? s.updated_at.split("T")[0] : "—",
        })),
        [suites]
    );

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

    const handleView = useCallback((row: Record<string, unknown>) => {
        navigate(`/sim-studio/view/${row.id}`);
    }, [navigate]);

    const columns: TableColumn[] = useMemo(() => [
        {
            label: "Suite Name",
            key: "suite_name",
            sx: { fontWeight: 600, color: "#1f2937" },
        },
        { label: "Associated Rule", key: "associated_rule" },
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
    ], [handleView]);

    const handleCreate = () => {
        navigate("/sim-studio/create");
    };

    return {
        values: {
            isLoading: isLoading || isFetching,
            searchInput,
            statusFilter,
            ruleFilter,
            txtpFilter,
            lastUpdatedFrom,
            lastUpdatedTo,
            filteredData: tableData,
            stats,
            columns,
            availableRules,
            availableTxtps,
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
