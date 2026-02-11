import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useLazyGetReportStatusQuery, useMergeBranchMutation, useUploadCodeMutation } from "../../../redux/Api/Simulation";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import ViewNetworkMap from "../Modals/ViewNetworkMap";
import ViewReport from "../Modals/ViewReport";
import { claims, ruleCode, testCode } from "../../../utils/Constants/data";
import useToggle from "../../../hooks/useToggle";

export interface ISimulation {
    data?: Record<string, unknown> | undefined
}

const useSimulationController = (props: ISimulation) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const user = useMemo(() => extractData('user'), [])

    const { open } = useModal()
    const { enableNextTab, enablePreviousTab } = useTab()
    const [loader, toggleLoader] = useToggle()
    const [viewReport, toggleViewReport] = useToggle()
    const [codeSynced, toggleCodeSynced] = useToggle()
    const [codeDeployed, toggleCodeDeployed] = useToggle()
    const [simulationExecuted, toggleSimulationExecuted] = useToggle()

    const [selected, setSelected] = useState<number | null>(1)

    const [upload, { isLoading: uploading }] = useUploadCodeMutation()
    const [deploy, { isLoading: deploying }] = useMergeBranchMutation()
    const [getReportStatus, { isLoading: statusLoading }] = useLazyGetReportStatusQuery()

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
                    toggleCodeSynced()
                    handleLoader()
                }
            })
            .catch(() => {
                toast.error('Failed to upload code')
            })
    }

    const handleDeploy = () => {
        if (!codeSynced) {
            toast.error('Please sync code on GitHub before deploying')
            return
        }
        const body = {
            organization: "psl-copilot",
            ruleId: data?.id,
            branchName: "staging"
        }
        deploy(body).unwrap()
            .then((res) => {
                if (res) {
                    toast.success('Code Deployed Successfully')
                    toggleCodeDeployed()
                }
            })
            .catch(() => {
                toast.error('Failed to deploy code')
            })
    }

    const handleReportStatus = useCallback(() => {
        const body = {
            organization: 'psl-copilot',
            ruleId: data?.id,
            branchName: 'staging'
        }
        getReportStatus({ ...body })
            .unwrap()
            .then((res) => {
                if (res && res?.success && res?.status === 'completed') {
                    toggleViewReport()
                }
            })
            .catch(() => {
                toast.error('Failed to fetch report')
            })
    }, [getReportStatus, data?.id])

    const handleSimulation = () => {
        toggleSimulationExecuted()
        toast.success('Simulation executed successfully')
    }

    const handlePayload = () => { }

    const handleReport = () => {
        open('Test Report', <ViewReport data={data} />, null, { maxWidth: 'xl' })
    }

    const handleNetworkMap = () => {
        open('View Network Map', <ViewNetworkMap />, null, { maxWidth: 'md' })
    }

    const handleLoader = () => {
        toggleLoader()
        setTimeout(() => {
            toggleLoader()
        }, 30000)
    }

    useEffect(() => {
        if (user?.claims === claims.editor) {
            handleReportStatus()
        }
    }, [user])

    return {
        values: {
            claim: user?.claims,
            status: data?.status,
            uploading,
            deploying,
            viewReport,
            loader: loader || statusLoading,
            selected,
            sentForApproval: codeSynced && codeDeployed && simulationExecuted,
            codeSynced
        },
        functions: {
            handleApproval,
            handleNext,
            handleBack,
            handleUpload,
            handleNetworkMap,
            handleDeploy,
            handleReport,
            handleSimulation,
            handlePayload,
            setSelected
        }
    }
}

export default useSimulationController;
