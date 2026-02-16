import { useMemo } from "react";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useGetSimulationLogsQuery } from "../../../redux/Api/Logs";
import TableActions from "../../../components/TableActions";
import ViewPayload from "../Modals/ViewPayload";
import { useModal } from "../../../contexts/ModalContext";

export interface IHistory {
    data: Record<string, unknown>
}

const useHistoryController = (props: IHistory) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const { enablePreviousTab } = useTab()
    const { open } = useModal()


    const { data: logs, isLoading } = useGetSimulationLogsQuery({ ruleId: data?.id }, { refetchOnMountOrArgChange: true })

    interface Log {
        category?: string;
        [key: string]: any;
    }

    const readOnlyLogs = useMemo(() => {
        if (!logs?.result || !Array.isArray(logs?.result)) return []
        return logs?.result.filter((log: Log) => log?.category === 'read_only')
    }, [logs])

    const endToEndLogs = useMemo(() => {
        if (!logs?.result || !Array.isArray(logs?.result)) return []
        return logs?.result.filter((log: Log) => log?.category === 'end_to_end')
    }, [logs])


    const onView = (data: Record<string, unknown>) => {
        open('View Payload', <ViewPayload data={data} />, null, { maxWidth: 'md' })
    }

    const logs_columns = [
        {
            label: 'Created By',
            key: 'created_by_name',
        },
        {
            label: "Created At",
            key: "created_at",
            type: 'date' as const
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (row: Record<string, unknown>) => (
                <TableActions
                    onView={() => onView(row)} />
            )
        }
    ]

    const handlePrevious = () => {
        enablePreviousTab()
    }

    return {
        values: {
            columns: logs_columns,
            isLoading,
            readOnlyData: readOnlyLogs,
            endToEndData: endToEndLogs,
        },
        functions: {
            handlePrevious
        }
    }
}

export default useHistoryController;
