import { useNavigate } from "react-router-dom";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useMemo } from "react";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";


export interface ITestCases {
    data?: Record<string, unknown> | undefined
}

const useTestCasesController = (props: ITestCases) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const { enableNextTab, enablePreviousTab } = useTab()
    const navigate = useNavigate()

    const handleNext = () => {
        enableNextTab()
    }

    const handleBack = () => {
        enablePreviousTab()
    }

    const handleCanvas = () => {
        navigate(`/test-case-generate/${data?.id}`)
    }

    return {
        values: {},
        functions: {
            handleNext,
            handleCanvas,
            handleBack
        }
    }
}

export default useTestCasesController;
