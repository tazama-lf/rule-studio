import { useNavigate } from "react-router-dom";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useMemo } from "react";

export interface IRuleBuilder {
    data?: Record<string, unknown> | undefined
}

const useRuleBuilderController = (props: IRuleBuilder) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const { enableNextTab, enablePreviousTab } = useTab()

    const navigate = useNavigate()

    const handleBuilder = () => {
        navigate(`/rule-builder/${data?.id}`)
    }

    const handleNext = () => {
        enableNextTab()
    }
    const handleBack = () => {
        enablePreviousTab()
    }

    return {
        values: {},
        functions: {
            handleBuilder,
            handleNext,
            handleBack
        }
    }
}

export default useRuleBuilderController;
