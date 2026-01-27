import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusCard from "../../components/Cards/StatusCard";
import type { DropdownOption } from "../../components/DropDown";
import Approval from "../../components/Modals/Approval";
import type { TableColumn } from "../../components/Table";
import TableActions from "../../components/TableActions";
import { useModal } from "../../contexts/ModalContext";
import useFilters from "../../hooks/useFilters";
import { useGetRulesMutation, useGetStatusQuery } from "../../redux/Api/Rules";
import { LocalStorage } from "../../utils/Common/enums";
import { extractData, removeData } from "../../utils/Common/storage";
import { claims, publishingStatus, ruleTypes, Status } from "../../utils/Constants/data";

const useHomeController = () => {
    const navigate = useNavigate();
    const [ruleType, setRuleType] = useState<DropdownOption | DropdownOption[] | null>(null)
    const [status, setStatus] = useState<DropdownOption | DropdownOption[] | null>(null)

    const user = extractData('user')
    const { open } = useModal()
    const isEditor = user.claims === claims.editor

    const {
        offset,
        limit,
        setOffset,
    } = useFilters();

    const [getRules, { isLoading }] = useGetRulesMutation();
    const { data: statuses, isLoading: statusLoad } = useGetStatusQuery({}, { refetchOnMountOrArgChange: true });

    const [data, setData] = useState<unknown[]>([]);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    const resetFilter = () => {
        setRuleType(null)
        setStatus(null)
        setSearchTerm('')
    }

    const fetchRules = async () => {
        try {
            const params = {
                offset,
                limit
            }
            const statusValue = status && !Array.isArray(status) ? status.value : undefined;
            const ruleValue = ruleType && !Array.isArray(ruleType) ? ruleType.value : undefined;
            const body = { ruleName: searchTerm.length > 0 ? searchTerm : undefined, status: statusValue, ruleType: ruleValue };
            const response = await getRules({
                params, body
            }).unwrap();

            setData(response?.rules || []);
            setTotal(response?.total || 0);
        } catch (err) {
            console.error(err);
        }
    };


    useEffect(() => {
        fetchRules();
    }, [getRules, offset, limit, searchTerm, status, ruleType]);

    useEffect(() => {
        setOffset(0);
    }, [status, ruleType, setOffset]);

    const pagination = useMemo(() => {
        return {
            offset,
            limit,
            total,
            onPageChange: (page: number) => setOffset(page - 1),
        };
    }, [offset, limit, total, setOffset])

    const handleCreateEdit = (row?: Record<string, unknown>) => {
        if (!row) {
            removeData('trs_rule', LocalStorage)
        }
        navigate(row ? `/editor/${row?.id}?mode=edit` : "/editor");
    };

    const handleHold = (row: Record<string, unknown>) => {
        open(
            `${row?.status === Status.STATUS_01_IN_PROGRESS ? 'Pause' : 'Resume'} Confirmation Required!`,
            <Approval
                id={row?.id}
                type={row?.status === Status.STATUS_01_IN_PROGRESS ? 'pause' : 'resume'}
                onSuccess={fetchRules}
            />,
            null,
            { maxWidth: 'sm' }
        )
    }

    const onView = (row: Record<string, string>) => {
        navigate(`/editor/${row?.id}?mode=view`);
    }


    const columns: TableColumn[] = [
        { label: "Rule Name", key: "rule_name" },
        { label: "Rule ID", key: "id" },
        {
            label: "Status",
            key: "status",
            render: (row: Record<string, unknown>) => (
                <StatusCard status={row.status as string} />
            )
        },
        { label: "Created At", key: "created_at", type: 'date' as const },
        { label: "Version", key: "version" },
        {
            label: 'Actions',
            key: 'actions',
            render: (row: Record<string, unknown>) => (
                <TableActions
                    pause={row?.status !== Status.STATUS_01_IN_PROGRESS ? true : false}
                    onView={() => onView(row as Record<string, string>)}
                    {...(isEditor && {
                        ...(row?.status === Status.STATUS_01_IN_PROGRESS || row?.status === Status.STATUS_02_ON_HOLD ? {
                            onEdit: () => handleCreateEdit(row as Record<string, string>),
                            onHold: () => handleHold(row as Record<string, string>),
                        } : {}),
                        onClone: () => onView(row as Record<string, string>)
                    })}
                />
            )
        }
    ];
    return {
        values: {
            columns,
            data,
            isLoading,
            pagination,
            searchTerm,
            status,
            ruleType,
            user,
            statusLoad,
            statusOptions: [
                { label: 'All', value: '' },
                ...(statuses && statuses.length > 0
                    ? statuses.map((item: string) => ({
                        label: item,
                        value: item,
                    }))
                    : []),
            ],
            ruleTypes: [
                { label: 'All', value: null },
                ...ruleTypes.map(({ display, value }) => { return { label: display, value } })],
            publishingOptions: [
                { label: 'All', value: null },
                ...Object.entries(publishingStatus).map(([, value]) => { return { label: value, value: value } })],
        },
        functions: {
            handleCreateEdit,
            setSearchTerm,
            setStatus,
            setRuleType,
            resetFilter
        },
    };
};

export default useHomeController;
