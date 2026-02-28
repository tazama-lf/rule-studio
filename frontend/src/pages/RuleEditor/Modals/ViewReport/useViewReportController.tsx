import toast from "react-hot-toast";
import { useLazyGetReportQuery } from "../../../../redux/Api/Simulation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { extractData } from "../../../../utils/Common/storage";
import { LocalStorage } from "../../../../utils/Common/enums";

export interface IViewReport {
  data?: Record<string, unknown> | undefined
}

const useViewReportController = (props: IViewReport) => {

  const data = useMemo(
    () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
    [props?.data]
  )

  const [getReport, { isLoading }] = useLazyGetReportQuery()
  const [htmlContent, setHtmlContent] = useState<string>('')

  const handleReport = useCallback(() => {
    const rule_config_id = data?.rule_config_id
    const body = {
      organization: 'psl-copilot',
      ruleId: rule_config_id?.toString().split('@')[0],
      branchName: 'staging'
    }
    getReport({ ...body })
      .unwrap()
      .then((res) => {
        if (res && typeof res === 'string') {
          setHtmlContent(res)
        } else {
          toast.error('Invalid report format received')
        }
      })
      .catch(() => {
        toast.error('Failed to fetch report')
      })
  }, [getReport, data?.id])

  useEffect(() => {
    handleReport()
  }, [handleReport])

  return {
    values: {
      isLoading,
      htmlContent,
    },
    functions: {
    }
  }
}

export default useViewReportController;
