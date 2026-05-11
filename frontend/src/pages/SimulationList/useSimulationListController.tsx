import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../components/Cards/StatusCard";
import type { TableColumn } from "../../components/Table";
import useFilters from "../../hooks/useFilters";
import { useLazyGetAllSimulationsQuery } from "../../redux/Api/RuleSimulation";
import { extractData } from "../../utils/Common/storage";
import SimulationActions from "./SimulationActions";

const useSimulationListController = () => {
    const navigate = useNavigate();

    const [data, setData] = useState<unknown[]>([]);
    const [total, setTotal] = useState(0);

    const user = extractData('user');

    const { offset, limit, setOffset } = useFilters();

    const [getAllSimulations, { isLoading, isFetching }] = useLazyGetAllSimulationsQuery();

    const fetchSimulations = useCallback(async () => {
        try {
            const response = await getAllSimulations({ offset, limit }).unwrap();
            setData(response?.simulations || []);
            setTotal(response?.total || 0);
        } catch (err) {
            console.error(err);
        }
    }, [getAllSimulations, offset, limit]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchSimulations();
    }, [fetchSimulations]);

    const pagination = useMemo(() => ({
        offset,
        limit,
        total,
        onPageChange: (page: number) => setOffset(page - 1),
    }), [offset, limit, total, setOffset]);

    const columns: TableColumn[] = [
        { label: "Simulation ID", key: "simulation_id" },
        { label: "Date Run", key: "created_at", type: "date" as const },
        { label: "Total Records", key: "total_record" },
        { label: "Records Processed", key: "record_processed" },
        { label: "Total Iterations", key: "total_iterations" },
        {
            label: "Status",
            key: "sim_status",
            render: (row: Record<string, unknown>) => (
                <StatusCard status={row.sim_status as string} bullet={false} />
            ),
        },
        {
            label: "Action",
            key: "actions",
            render: (row: Record<string, unknown>) => (
                <SimulationActions
                    status={row.sim_status as string}
                    onView={() => handleView(row)}
                    onRerun={() => handleRerun(row)}
                />
            ),
        },
    ];

    const handleView = (row: Record<string, unknown>) => {
        const status = (row.sim_status as string)?.toUpperCase();
        if (status === "FAILED") {
            navigate("/simulation/error");
            return;
        }

        navigate(`/simulation/view/${row.simulation_id}`, {
            state: { total_iterations: (row.total_iterations as number) ?? 1 },
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleRerun = (_row: Record<string, unknown>) => {
        // TODO: implement rerun logic
    };

    return {
        values: {
            columns,
            data,
            isLoading: isLoading || isFetching,
            pagination,
            user,
        },
        functions: {
            navigate,
            fetchSimulations,
        },
    };
};

export default useSimulationListController;
