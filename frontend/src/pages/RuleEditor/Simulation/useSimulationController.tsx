import { useMemo } from "react";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { useUploadCodeMutation } from "../../../redux/Api/Simulation";
import toast from "react-hot-toast";
import ViewNetworkMap from "../Modals/ViewNetworkMap";

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

    const [upload, { isLoading: uploading }] = useUploadCodeMutation()

    const handleApproval = (type: 'review' | 'approve' | 'reject') => {
        open(`${type === 'reject' ? 'Rejection' : 'Approval'} Confirmation Required!`, <Approval id={data?.id} type={type} />, null, { maxWidth: 'sm' })
    }

    const handleNext = () => {
        enableNextTab()
    }

    const handleBack = () => {
        enablePreviousTab()
    }

    const handleUpload = () => {
        upload({}).unwrap()
            .then((res) => {
                if (res) {
                    toast.success('Code Uploaded Successfully')
                }
            })
            .catch(() => {
                toast.error('Failed to load transaction type versions')
            })
    }

    const handleNetworkMap = () => {
        open('View Network Map', <ViewNetworkMap />, null, { maxWidth: 'md' })
    }

    return {
        values: {
            claim: user?.claims,
            status: data?.status
        },
        functions: {
            handleApproval,
            handleNext,
            handleBack,
            handleUpload,
            handleNetworkMap
        }
    }
}

export default useSimulationController;
