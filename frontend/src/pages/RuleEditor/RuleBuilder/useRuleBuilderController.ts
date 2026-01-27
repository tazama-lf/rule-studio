import { useNavigate } from "react-router-dom";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useTab } from "../../../contexts/TabContext/useTab";

export interface IRuleBuilder {
    data?: Record<string, unknown> | undefined
}

const useRuleBuilderController = (props: IRuleBuilder) => {

    const data = extractData('trs_rule', LocalStorage, true) ?? props?.data
    const { enableNextTab } = useTab()

    const navigate = useNavigate()

    const handleBuilder = () => {
        navigate(`/rule-builder/${data?.id}`)
    }

    const handleNext = () => {
        enableNextTab()
    }

    return {
        values: {},
        functions: {
            handleBuilder,
            handleNext
        }
    }
}

export default useRuleBuilderController;
