import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";

export interface ISimulation {
    data?: Record<string, unknown> | undefined
}

const useSimulationController = (props: ISimulation) => {

    const data = extractData('trs_rule', LocalStorage, true) ?? props?.data
    const user = extractData('user')

    const { open } = useModal()

    const handleApproval = (type: 'review' | 'approve' | 'reject') => {
        open(`${type === 'reject' ? 'Rejection' : 'Approval'} Confirmation Required!`, <Approval id={data?.id} type={type} />, null, { maxWidth: 'sm' })
    }

    return {
        values: {
            claim: user?.claims,
            status: data?.status
        },
        functions: {
            handleApproval
        }
    }
}

export default useSimulationController;
