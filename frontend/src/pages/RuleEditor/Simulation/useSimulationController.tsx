import { useMemo } from "react";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";

export interface ISimulation {
    data?: Record<string, unknown> | undefined
}

const useSimulationController = (props: ISimulation) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const user = extractData('user')

    const { open } = useModal()
    const { enableNextTab, enablePreviousTab } = useTab()

    const handleApproval = (type: 'review' | 'approve' | 'reject') => {
        open(`${type === 'reject' ? 'Rejection' : 'Approval'} Confirmation Required!`, <Approval id={data?.id} type={type} />, null, { maxWidth: 'sm' })
    }

    const handleNext = () => {
        enableNextTab()
    }

    const handleBack = () => {
        enablePreviousTab()
    }

    return {
        values: {
            claim: user?.claims,
            status: data?.status
        },
        functions: {
            handleApproval,
            handleNext,
            handleBack
        }
    }
}

export default useSimulationController;
