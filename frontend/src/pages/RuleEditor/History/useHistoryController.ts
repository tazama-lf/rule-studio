import { useMemo } from "react";
import { useGetSimulationLogsQuery } from "../../../redux/Api/Simulation";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useTab } from "../../../contexts/TabContext/useTab";

export interface IHistory {
    data: Record<string, unknown>
}

const useHistoryController = (props: IHistory) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const { enablePreviousTab } = useTab()


    const { data: logs, isLoading } = useGetSimulationLogsQuery({ ruleId: data?.id }, { refetchOnMountOrArgChange: true })

    const readOnlyLogs = useMemo(() => {
        if (!logs || !Array.isArray(logs)) return []
        return logs.filter((log: any) => log.category === 'read_only')
    }, [logs])

    const endToEndLogs = useMemo(() => {
        if (!logs || !Array.isArray(logs)) return []
        return logs.filter((log: any) => log.category === 'end-to-end')
    }, [logs])

    const logs_columns = [
        {
            label: 'Created By',
            key: 'created_by',
        },
        {
            label: 'Created At',
            key: 'created_at',
        },
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
