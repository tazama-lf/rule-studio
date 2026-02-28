import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import useToggle from "../../../hooks/useToggle";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { useEndToEndMutation, useRuleOnlyMutation } from "../../../redux/Api/Nats";
import { useGetAllFlowQuery, useLazyGetGlobalVariablesQuery } from "../../../redux/Api/Rule-builder";
import { useUpdateMetadataMutation } from "../../../redux/Api/Rules";
import { useLazyGetReportStatusQuery, useMergeBranchMutation, useUploadCodeMutation } from "../../../redux/Api/Simulation";
import { useAddSimulationlogsMutation } from "../../../redux/Api/SimulationLogs";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { claims, samplePayload } from "../../../utils/Constants/data";
import ViewNetworkMap from "../Modals/ViewNetworkMap";
import ViewReport from "../Modals/ViewReport";

export interface ISimulation {
    data?: Record<string, unknown> | undefined
}

const useSimulationController = (props: ISimulation) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props.data,
        [props.data]
    )

    const user = useMemo(() => extractData('user'), [])

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    const { handleSubmit, formState: { errors }, control, setValue } = useForm({
        defaultValues: { payload: '' }
    })

    const { open } = useModal()
    const { enableNextTab, enablePreviousTab } = useTab()
    const [result, setResult] = useState<unknown | null>(null)
    const [update] = useUpdateMetadataMutation()

    const [loader, toggleLoader] = useToggle()
    const [viewReport, setViewReport] = useState(data?.metadata?.test ?? false)
    const [codeSynced, setCodeSynced] = useState(data?.metadata?.sync ?? true)
    const [codeDeployed, setCodeDeployed] = useState(data?.metadata?.deploy ?? false)
    const [simulationExecuted, setSimulationExecuted] = useState(data?.metadata?.test ?? false)
    const [isReportFailed, setIsReportFailed] = useState(false);

    const toggleViewReport = useCallback(() => setViewReport((prev: boolean) => !prev), [])
    const toggleCodeSynced = useCallback(() => setCodeSynced((prev: boolean) => !prev), [])
    const toggleCodeDeployed = useCallback(() => setCodeDeployed((prev: boolean) => !prev), [])
    const toggleSimulationExecuted = useCallback(() => setSimulationExecuted(() => true), [])

    // Initialize metadata state
    useEffect(() => {
        if (data?.metadata) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setViewReport(data.metadata.test ?? false)
            setCodeSynced(data.metadata.sync ?? true)
            setCodeDeployed(data.metadata.deploy ?? false)
            setSimulationExecuted(data.metadata.test ?? false)
        }
    }, [data?.metadata])

    const [selected, setSelected] = useState<number | null>(null)

    const [upload, { isLoading: uploading }] = useUploadCodeMutation()
    const [deploy, { isLoading: deploying }] = useMergeBranchMutation()
    const [getReportStatus, { isLoading: statusLoading }] = useLazyGetReportStatusQuery()
    const [getRuleRequest, { isFetching: variablesLoading }] = useLazyGetGlobalVariablesQuery()
    const [getPayload, { isFetching: sampleLoading }] = useLazyGetSamplePayloadQuery()
    const { data: flowData, isFetching: flowLoading } = useGetAllFlowQuery({ ruleId: data?.id })

    const [ruleOnly, { isLoading: ruleOnlyLoading }] = useRuleOnlyMutation()
    const [endToEnd, { isLoading: endToEndLoading }] = useEndToEndMutation()
    const [addLogs] = useAddSimulationlogsMutation()

    const updateMetadata = useCallback((metadata: Record<string, boolean>) => {
        const body = {
            id: data?.id,
            body: { metadata }
        }
        update(body).unwrap()
            .then(() => {
                console.log('Metadata updated successfully', metadata)
            })
            .catch((error) => {
                console.error('Failed to update metadata', error)
            })
    }, [data?.id, update])

    const handleApproval = (type: 'review' | 'approve' | 'reject' | 'deploy') => {
        const titles = {
            review: 'Review',
            approve: 'Approval',
            reject: 'Rejection',
            deploy: 'Deployment'
        }
        const title = titles[type]
        open(`${title} Confirmation Required!`, <Approval id={data?.id} type={type} />, null, { maxWidth: 'sm' })
    }

    const handleNext = () => {
        enableNextTab()
    }

    const handleBack = () => {
        enablePreviousTab()
    }

    const handleReportStatus = useCallback(() => {

        const rule_config_id = data?.rule_config_id
        const body = {
            ruleId: rule_config_id?.toString().split('@')[0],
            branchName: 'staging'
        }
        getReportStatus({ ...body })
            .unwrap()
            .then((res) => {
                if (res && res?.success) {
                    toggleViewReport()
                    if (res?.status === 'completed') {
                        setIsReportFailed(false);
                        updateMetadata({
                            sync: false,
                            test: true,
                            deploy: false,
                            simulation: false
                        })
                    } else if (res?.status === 'failed') {
                        setIsReportFailed(true);
                        updateMetadata({
                            sync: false,
                            test: true,
                            deploy: false,
                            simulation: false
                        })
                    } else {
                        setIsReportFailed(false);
                    }
                }
            })
            .catch(() => {
                toast.error('Failed to fetch report')
            })
    }, [getReportStatus, data?.id, toggleViewReport, updateMetadata])

    const handleLoader = useCallback(() => {
        toggleLoader()
        setTimeout(() => {
            toggleLoader()
            handleReportStatus()
        }, 40000)
    }, [toggleLoader, handleReportStatus])

    const handleUpload = useCallback(() => {

        const rule_config_id = data?.rule_config_id

        const body = {
            ruleId: rule_config_id?.toString().split('@')[0],
            ruleCode: flowData?.result?.ts_file_base64_rule_builder,
            testCode: flowData?.result?.ts_file_base64_test_case
        }
        upload(body).unwrap()
            .then((res) => {
                if (res) {
                    toast.success('Code Uploaded Successfully')
                    toggleCodeSynced()
                    updateMetadata({
                        sync: false,
                        test: false,
                        deploy: false,
                        simulation: false
                    })
                    handleLoader()
                }
            })
            .catch(() => {
                toast.error('Failed to upload code')
            })
    }, [data?.id, upload, toggleCodeSynced, updateMetadata, flowData, handleLoader])

    const handleDeploy = useCallback(() => {
        if (codeSynced) {
            toast.error('Please sync code on GitHub before deploying')
            return
        }
        const body = {
            ruleId: data?.id,
            branchName: "dev"
        }
        deploy(body).unwrap()
            .then((res) => {
                if (res) {
                    toast.success('Code Deployed Successfully')
                    toggleCodeDeployed()
                    updateMetadata({
                        sync: false,
                        test: true,
                        deploy: true,
                        simulation: true
                    })
                }
            })
            .catch(() => {
                toast.error('Failed to deploy code')
            })
    }, [codeSynced, data?.id, deploy, toggleCodeDeployed, updateMetadata])

    const handleSelect = (id: number) => {
        if (!codeDeployed && claims.editor === user?.claims) {
            toast.error('Deploy rule first to run simulation')
            return;
        } else {
            setSelected(id)
        }

        // setSelected(id)

        if (id === 1) {
            getRuleRequest(data?.id).unwrap()
                .then((res) => {
                    if (res) {
                        setValue('payload', JSON.stringify(res?.RuleRequest, null, 4))
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch rule request:', error)
                    toast.error('Failed to load rule request payload')
                })
        } else {
            if (!data?.txtp) {
                toast.error('Transaction type not found')
                return
            }
            getPayload({ type: data.txtp })
                .unwrap()
                .then((res) => {
                    if (res) {
                        setValue('payload', JSON.stringify(res, null, 4))
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch sample payload:', error)
                    toast.error('Failed to load sample payload')
                })
        }
    }

    const addSimulationLog = useCallback((payload: Record<string, unknown>, result: unknown, category: 'read_only' | 'end_to_end') => {
        const body = {
            old_data: payload,
            new_data: result,
            category
        }
        addLogs({ body, id: data?.id }).unwrap()
    }, [addLogs, data?.id])


    const handleSimulation = useCallback((_values: Record<string, unknown>) => {

        const isReadOnly = selected === 1;
        let body: Record<string, unknown>;
        let mutation;
        let logCategory: 'read_only' | 'end_to_end';
        let onSuccess;

        const parsedPayload = typeof
            _values?.payload === 'string'
            ? JSON.parse(_values.payload)
            : _values?.payload || {};
        if (isReadOnly) {

            body = {
                functionName: '',
                awaitReply: true,
                destination: `sub-rule-${data.id}@${data.version}`,
                consumer: `pub-rule-${data.id}@${data.version}`,
                message: parsedPayload
            };
            mutation = ruleOnly;
            logCategory = 'read_only';
            onSuccess = (res: unknown) => {
                setResult(res);
                toggleSimulationExecuted();
                if (claims.editor === user?.claims) {
                    updateMetadata({
                        sync: false,
                        test: true,
                        deploy: false,
                        simulation: true
                    });
                }
                addSimulationLog(body, res, logCategory);
            };
        } else {
            body = {
                endpoint: import.meta.env.VITE_SIMULATION_ENDPOINT,
                natsConsumer: "investigation-service",
                functionName: "TMS",
                awaitReply: true,
                transaction: samplePayload
            };
            mutation = endToEnd;
            logCategory = 'end_to_end';
            onSuccess = (res: unknown) => {
                setResult(res);
                toggleSimulationExecuted();
                if (claims.editor === user?.claims) {
                    updateMetadata({
                        sync: false,
                        test: true,
                        deploy: false,
                        simulation: true
                    });
                }
                addSimulationLog(body, res, logCategory);
            };
        }
        mutation(body).unwrap()
            .then((res: unknown) => {
                if (res) {
                    onSuccess(res);
                }
            })
            .catch((error: unknown) => {
                console.error('Simulation failed:', error);
                toast.error('Failed to run simulation. Please try again.');
                setResult(null);
            });
    }, [selected, user?.claims, ruleOnly, endToEnd, toggleSimulationExecuted, updateMetadata, addSimulationLog])

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
            deploying,
            viewReport,
            loader: loader || statusLoading,
            selected,
            sentForApproval: !codeSynced && codeDeployed && simulationExecuted,
            codeSynced,
            codeDeployed,
            result,
            control,
            errors,
            isLoading: flowLoading,
            simulating: ruleOnlyLoading || endToEndLoading,
            payloadLoading: variablesLoading || sampleLoading,
            isReportFailed,
            mode
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
