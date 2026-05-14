import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../components/Cards/StatusCard";
import type { DropdownOption } from "../../components/DropDown";
import MaskView from "../../components/Modals/MaskView";
import type { TableColumn } from "../../components/Table";
import TableActions from "../../components/TableActions";
import { useModal } from "../../contexts/ModalContext";
import useFilters from "../../hooks/useFilters";
import { useGetAllMasksMutation } from "../../redux/Api/Masking";
import { useGetStatusQuery } from "../../redux/Api/Rules";
import { useGetTypesQuery } from "../../redux/Api/Config";
import { extractData } from "../../utils/Common/storage";
import { claims } from "../../utils/Constants/data";

const useMaskingConfigController = () => {
    const navigate = useNavigate();

    const [status, setStatus] = useState<DropdownOption | DropdownOption[] | null>(null);
    const [txtp, setTxtp] = useState<DropdownOption | DropdownOption[] | null>(null);
    const [data, setData] = useState<unknown[]>([]);
    const [total, setTotal] = useState(0);

    const user = extractData('user');
    const isEditor = user?.claims === claims.data_engineer_editor;
    const { open } = useModal();

    const { offset, limit, setOffset } = useFilters();

    const [getAllMasks, { isLoading }] = useGetAllMasksMutation();
    const { data: statuses, isLoading: statusLoad } = useGetStatusQuery({}, { refetchOnMountOrArgChange: true });
    const { data: transactionTypes, isLoading: typesLoad } = useGetTypesQuery({}, { refetchOnMountOrArgChange: true });

    const resetFilter = () => {
        setStatus(null);
        setTxtp(null);
    };

    const fetchMasks = useCallback(async () => {
        try {
            const params = { offset, limit };
            const statusValue = status && !Array.isArray(status) ? status.value : undefined;
            const txtpValue = txtp && !Array.isArray(txtp) ? txtp.value : undefined;
            const body = {
                status: statusValue,
                txtp: txtpValue,
            };
            const response = await getAllMasks({ params, body }).unwrap();
            setData(response?.masks || []);
            setTotal(response?.total || 0);
        } catch (err) {
            console.error(err);
        }
    }, [getAllMasks, offset, limit, status, txtp]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchMasks();
    }, [fetchMasks]);

    useEffect(() => {
        setOffset(0);
}, [status, txtp, setOffset]);

    const pagination = useMemo(() => ({
        offset,
        limit,
        total,
        onPageChange: (page: number) => setOffset(page - 1),
    }), [offset, limit, total, setOffset]);

    const handleView = (row: Record<string, unknown>) => {
        open(
            `Tokenization Configuration — ${row.txtp as string}`,
            <MaskView id={row.id as number} onSuccess={fetchMasks} />,
            null,
            { maxWidth: 'md' },
        );
    };

    const handleEdit = (row: Record<string, unknown>) => {
        navigate(`/masking-config/action?id=${row.id}&mode=edit`);
    };

    const columns: TableColumn[] = [
        { label: "Message Type", key: "txtp" },
        { label: "Version", key: "txtp_version" },
        {
            label: "Status",
            key: "status",
            render: (row: Record<string, unknown>) => (
                <StatusCard status={row.status as string} />
            ),
        },
        { label: "Fields Masked", key: "fields_masked" },
        { label: "Total Fields", key: "total_fields" },
        { label: "Created At", key: "created_at", type: "date" as const },
        {
            label: "Actions",
            key: "actions",
            render: (row: Record<string, unknown>) => (
                <TableActions
                    onView={() => handleView(row)}
                    {...(isEditor && row.status !== 'STATUS_03_UNDER_REVIEW' && { onEdit: () => handleEdit(row) })}
                />
            ),
        },
    ];

    return {
        values: {
            columns,
            data,
            isLoading,
            pagination,
            status,
            txtp,
            user,
            statusLoad: statusLoad || typesLoad,
            statusOptions: [
                { label: 'All', value: '' },
                ...(statuses && statuses.length > 0
                    ? statuses.map((item: string) => ({ label: item, value: item }))
                    : []),
            ],
            transactionTypeOptions: [
                { label: 'All', value: '' },
                ...(transactionTypes && transactionTypes.length > 0
                    ? Array.from(
                          new Set(
                              (transactionTypes as { transaction_type: string }[]).map((t) => t.transaction_type)
                          )
                      ).map((t) => ({ label: t, value: t }))
                    : []),
            ],
        },
        functions: {
            setStatus,
            setTxtp,
            resetFilter,
            navigate,
        },
    };
};

export default useMaskingConfigController;
