import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TableColumn } from "../../components/Table";
import useDebouncedSearch from "../../hooks/useDebouncedSearch";
import { useGetSuitesQuery, useGetSuitesCountQuery, type SuiteListItem } from "../../redux/Api/SimStudio";
import { useGetRulesQuery } from "../../redux/Api/DockerHub";
import { useGetTypesQuery } from "../../redux/Api/Config";
import { LocalStorage } from "../../utils/Common/enums";
import { removeData } from "../../utils/Common/storage";
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

const formatLatestIteration = (latestRunAt?: string | number | null): string => {
    if (latestRunAt === null || latestRunAt === undefined || latestRunAt === "") return "—";
    const latestDate = new Date(latestRunAt);
    if (Number.isNaN(latestDate.getTime())) return "—";
    const today = new Date();
    if (latestDate.toDateString() === today.toDateString()) return "Today";
    return latestDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const useSimStudioController = () => {
    const navigate = useNavigate();
    const [searchInput, debouncedSearch, setSearchInput] = useDebouncedSearch("", 300);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [ruleFilter, setRuleFilter] = useState<string>("");
    const [txtpFilter, setTxtpFilter] = useState<string>("");
    const [lastUpdatedFrom, setLastUpdatedFrom] = useState<string>("");
    const [lastUpdatedTo, setLastUpdatedTo] = useState<string>("");
    const [page, setPage] = useState(0);

    const LIMIT = 10;

    const queryParams = useMemo(() => ({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        rule_name: ruleFilter || undefined,
        txtp: txtpFilter || undefined,
        updated_from: lastUpdatedFrom || undefined,
        updated_to: lastUpdatedTo || undefined,
        limit: LIMIT,
        offset: page * LIMIT,
    }), [debouncedSearch, statusFilter, ruleFilter, txtpFilter, lastUpdatedFrom, lastUpdatedTo, page]);

    const { data, isLoading, isFetching } = useGetSuitesQuery(queryParams);
    const { data: rulesData } = useGetRulesQuery();
    const { data: txTypesData } = useGetTypesQuery({});
    const { data: suitesCountData } = useGetSuitesCountQuery();

    const suites = useMemo<SuiteListItem[]>(() => data?.suites ?? [], [data?.suites]);

    const availableRules = useMemo(
        () => rulesData?.rules.map((r) => r.name) ?? [],
        [rulesData]
    );
    const availableTxtps = useMemo(() => {
        if (!txTypesData || !Array.isArray(txTypesData)) return [];
        const seen = new Set<string>();
        const result: string[] = [];
        for (const item of txTypesData as { transaction_type: string }[]) {
            if (!seen.has(item.transaction_type)) {
                seen.add(item.transaction_type);
                result.push(item.transaction_type);
            }
        }
        return result;
    }, [txTypesData]);

    const stats = useMemo(() => {
        const counts = suitesCountData?.data;

        return {
            total: counts?.total_suites ?? data?.total ?? suites.length,
            readyForSimulation: counts?.total_completed_suites ?? suites.filter((s) => s.status === "COMPLETED" || s.status === "RUNNING").length,
            drafts: counts?.total_draft_suites ?? suites.filter((s) => s.status === "DRAFT").length,
            latestIteration: counts ? formatLatestIteration(counts.latest_run_at) : computeLatestIteration(suites),
        };
    }, [data?.total, suites, suitesCountData]);

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

    const handleSearch = useCallback((value: string) => {
        setSearchInput(value);
        setPage(0);
    }, [setSearchInput]);

    const handleStatusFilter = useCallback((value: string) => {
        setStatusFilter(value);
        setPage(0);
    }, []);

    const handleRuleFilter = useCallback((value: string) => {
        setRuleFilter(value);
        setPage(0);
    }, []);

    const handleTxtpFilter = useCallback((value: string) => {
        setTxtpFilter(value);
        setPage(0);
    }, []);

    const handleLastUpdatedFrom = useCallback((value: string) => {
        setLastUpdatedFrom(value);
        setPage(0);
    }, []);

    const handleLastUpdatedTo = useCallback((value: string) => {
        setLastUpdatedTo(value);
        setPage(0);
    }, []);

    const handleResetAdvancedFilters = () => {
        setTxtpFilter("");
        setLastUpdatedFrom("");
        setLastUpdatedTo("");
        setPage(0);
    };

    const handleResetAllFilters = () => {
        handleSearch("");
        setStatusFilter("");
        setRuleFilter("");
        setTxtpFilter("");
        setLastUpdatedFrom("");
        setLastUpdatedTo("");
        setPage(0);
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
        { label: "Iterations", key: "iterations" },
        { label: "Last Updated", key: "last_updated" },
        {
            label: "Actions",
            key: "actions",
            render: (row: Record<string, unknown>) => (
                <SimStudioActions
                    onView={() => handleView(row)}
                />
            ),
        },
    ], [handleView]);

    const handleCreate = () => {
        removeData("sim_gen_id", LocalStorage);
        removeData("sim_suite_id", LocalStorage);
        navigate("/sim-studio/create?simStudioTab=create_generation");
    };

    const pagination = useMemo(() => ({
        offset: page,
        limit: LIMIT,
        total: data?.total ?? 0,
        onPageChange: (newPage: number) => setPage(newPage - 1),
    }), [page, data?.total]);

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
            pagination,
        },
        functions: {
            handleSearch,
            handleStatusFilter,
            handleRuleFilter,
            handleTxtpFilter,
            handleLastUpdatedFrom,
            handleLastUpdatedTo,
            handleResetAdvancedFilters,
            handleResetAllFilters,
            handleCreate,
        },
    };
};

export default useSimStudioController;
