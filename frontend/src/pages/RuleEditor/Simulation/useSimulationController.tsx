import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import useToggle from "../../../hooks/useToggle";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { useEndToEndMutation, useRuleOnlyMutation } from "../../../redux/Api/Nats";
import { useLazyGetGlobalVariablesQuery } from "../../../redux/Api/Rule-builder";
import { useLazyGetReportStatusQuery, useMergeBranchMutation, useUploadCodeMutation } from "../../../redux/Api/Simulation";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { claims, ruleCode, sampelRuleRequest, samplePayload, testCode } from "../../../utils/Constants/data";
import ViewNetworkMap from "../Modals/ViewNetworkMap";
import ViewReport from "../Modals/ViewReport";

export interface ISimulation {
    data?: Record<string, unknown> | undefined
}

const useSimulationController = (props: ISimulation) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const user = useMemo(() => extractData('user'), [])

    const { handleSubmit, formState: { errors }, control, setValue } = useForm({
        defaultValues: { payload: '' }
    })


    const { open } = useModal()
    const { enableNextTab, enablePreviousTab } = useTab()
    const [result, setResult] = useState<Record<string, unknown> | null>(null)

    const [loader, toggleLoader] = useToggle()
    const [viewReport, toggleViewReport] = useToggle()
    const [codeSynced, toggleCodeSynced] = useToggle()
    const [codeDeployed, toggleCodeDeployed] = useToggle()
    const [simulationExecuted, toggleSimulationExecuted] = useToggle()

    const [selected, setSelected] = useState<number | null>(null)

    const [upload, { isLoading: uploading }] = useUploadCodeMutation()
    const [deploy, { isLoading: deploying }] = useMergeBranchMutation()
    const [getReportStatus, { isLoading: statusLoading }] = useLazyGetReportStatusQuery()
    const [getRuleRequest, { isFetching: variablesLoading }] = useLazyGetGlobalVariablesQuery()
    const [getPayload, { isFetching: sampleLoading }] = useLazyGetSamplePayloadQuery()

    const [ruleOnly, { isLoading: ruleOnlyLoading }] = useRuleOnlyMutation()
    const [endToEnd, { isLoading: endToEndLoading }] = useEndToEndMutation()


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

    const handleSelect = (id: number) => {
        setSelected(id)

        if (id === 1) {
            getRuleRequest(data?.id).unwrap()
                .then((res) => {
                    if (res) {
                        setValue('payload', JSON.stringify(res?.RuleRequest, null, 4))
                    }
                })
        } else {
            getPayload({ type: data.txtp })
                .unwrap()
                .then((res) => {
                    setValue('payload', JSON.stringify(res, null, 4))
                })
        }
        // if (codeDeployed) {
        //     setSelected(id)
        // } else {
        //     toast.error('Deploy rule first to run simulation')
        // }
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
        // toggleSimulationExecuted()
        // toast.success('Simulation executed successfully')

        if (selected === 1) {
            const body = {
                functionName: '',
                awaitReply: true,
                destination: "sub-rule-901@1.0.0",
                consumer: "pub-rule-901@1.0.0",
                message: {
                    ...sampelRuleRequest
                }
            }
            setResult(sampelRuleRequest)
            // ruleOnly(body).unwrap()
            //     .then((res) => {
            //         if (res) {
            //             toggleSimulationExecuted()
            //         }
            //     })
        } else {
            const body = {
                endpoint: "http://10.10.80.18:5000/v1/evaluate/iso20022/pacs.002.001.12",
                natsConsumer: "interdiction-service",
                functionName: "TMS",
                awaitReply: false,
                transaction: {
                    ...samplePayload
                }
            }
            endToEnd(body).unwrap()
                .then((res) => {
                    if (res) {
                        toggleSimulationExecuted()
                    }
                })
        }
    }

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
            handleReportStatus()
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
            codeSynced,
            codeDeployed,
            result,
            control,
            errors,
            simulating: ruleOnlyLoading || endToEndLoading,
            payloadLoading: variablesLoading || sampleLoading
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
            onSubmit: handleSubmit(handleSimulation),
            handleSelect
        }
    }
}

export default useSimulationController;
