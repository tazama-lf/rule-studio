import { useMemo } from "react";
import toast from "react-hot-toast";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useMergeBranchMutation, useUploadCodeMutation } from "../../../redux/Api/Simulation";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import ViewNetworkMap from "../Modals/ViewNetworkMap";
import ViewReport from "../Modals/ViewReport";
import { ruleCode, testCode } from "../../../utils/Constants/data";

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
    const [deploy, { isLoading: deploying }] = useMergeBranchMutation()

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
        const body = {
            organization: 'psl-copilot',
            ruleId: data?.id,
            ruleCode,
            testCode
        }
        upload(body).unwrap()
            .then((res) => {
                if (res) {
                    toast.success('Code Uploaded Successfully')
                }
            })
            .catch(() => {
                toast.error('Failed to upload code')
            })
    }

    const handleDeploy = () => {
        const body = {
            organization: "psl-copilot",
            ruleId: data?.id,
            branchName: "dev"
        }
        deploy(body).unwrap()
            .then((res) => {
                if (res) {
                    toast.success('Code Deployed Successfully')
                }
            })
            .catch(() => {
                toast.error('Failed to deploy code')
            })
    }

    const handleReport = () => {
        open('Test Report', <ViewReport data={data} />, null, { maxWidth: 'xl' })
    }

    const handleNetworkMap = () => {
        open('View Network Map', <ViewNetworkMap />, null, { maxWidth: 'md' })
    }

    return {
        values: {
            claim: user?.claims,
            status: data?.status,
            uploading,
            deploying
        },
        functions: {
            handleApproval,
            handleNext,
            handleBack,
            handleUpload,
            handleNetworkMap,
            handleDeploy,
            handleReport
        }
    }
}

export default useSimulationController;
