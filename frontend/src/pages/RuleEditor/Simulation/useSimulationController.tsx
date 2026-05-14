import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import Approval from "../../../components/Modals/Approval";
import { useModal } from "../../../contexts/ModalContext";
import { useTab } from "../../../contexts/TabContext/useTab";
import useToggle from "../../../hooks/useToggle";
import { useLazyGetSamplePayloadQuery } from "../../../redux/Api/Config";
import { useEndToEndMutation, useLazyGetEndReportQuery, useRuleOnlyMutation } from "../../../redux/Api/Nats";
import { useGetAllFlowQuery, useLazyGetGlobalVariablesQuery } from "../../../redux/Api/Rule-builder";
import { useUpdateMetadataMutation } from "../../../redux/Api/Rules";
import { useLazyGetOrganizationQuery, useLazyGetReportStatusQuery, useMergeBranchMutation, useUploadCodeMutation } from "../../../redux/Api/Simulation";
import { useAddSimulationlogsMutation } from "../../../redux/Api/SimulationLogs";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { claims } from "../../../utils/Constants/data";
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

    const getEndpointPath = useCallback(
        () => extractData('trs_endpoint_path', LocalStorage, true) as string | null,
        []
    )

    const { rule_name } : { rule_name?: string } = data || {};

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
    const [simulationExecuted, setSimulationExecuted] = useState(data?.metadata?.simulation ?? false)
    const [isReportFailed, setIsReportFailed] = useState(false);

    const toggleViewReport = useCallback(() => setViewReport((prev: boolean) => !prev), [])
    const toggleCodeSynced = useCallback(() => setCodeSynced((prev: boolean) => !prev), [])
    const toggleCodeDeployed = useCallback(() => setCodeDeployed((prev: boolean) => !prev), [])
    const toggleSimulationExecuted = useCallback(() => setSimulationExecuted(() => true), [])

    // Initialize metadata state
    useEffect(() => {
        if (data?.metadata) {
            setViewReport(data.metadata.test ?? false)
            setCodeSynced(data.metadata.sync ?? true)
            setCodeDeployed(data.metadata.deploy ?? false)
            setSimulationExecuted(data.metadata.simulation ?? false)
        }
    }, [data?.metadata])

    const [selected, setSelected] = useState<number | null>(null)

    const [upload, { isLoading: uploading }] = useUploadCodeMutation()
    const [deploy, { isLoading: deploying }] = useMergeBranchMutation()
    const [getReportStatus, { isLoading: statusLoading }] = useLazyGetReportStatusQuery()
    const [getOrganization] = useLazyGetOrganizationQuery();
    const [getRuleRequest, { isFetching: variablesLoading }] = useLazyGetGlobalVariablesQuery()
    const [getPayload, { isFetching: sampleLoading }] = useLazyGetSamplePayloadQuery()
    const { data: flowData, isFetching: flowLoading } = useGetAllFlowQuery({ ruleId: data?.id })

    const [ruleOnly, { isLoading: ruleOnlyLoading }] = useRuleOnlyMutation()
    const [endToEnd, { isLoading: endToEndLoading }] = useEndToEndMutation()
    const [getEndReport, { isLoading: endReportLoading }] = useLazyGetEndReportQuery()
    const [addLogs] = useAddSimulationlogsMutation()

    const updateMetadata = useCallback((metadata: Record<string, boolean>) => {
        const body = {
            id: data?.id,
            body: { metadata }
        }
        update(body).unwrap()
    }, [data?.id, update])

    const handleApproval = (type: 'review' | 'approve' | 'reject' | 'deploy') => {
        const titles = {
            review: 'Review',
            approve: 'Approval',
            reject: 'Rejection',
            deploy: 'Deployment'
        }
        const title = titles[type]
        const rule_config_id = data?.rule_config_id
        open(`${title} Confirmation Required!`, <Approval rule_config_id={rule_config_id?.toString().split('@')[0]} id={data?.id} type={type} />, null, { maxWidth: 'sm' })
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.id, upload, toggleCodeSynced, updateMetadata, flowData, handleLoader])

    const handleDeploy = useCallback(() => {
        // if (codeSynced) {
        //     toast.error('Please sync code on GitHub before deploying')
        //     return
        // }
        const rule_config_id = data?.rule_config_id
        const body = {
            ruleId: rule_config_id?.toString().split('@')[0],
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
                        simulation: false
                    })
                    const showFallbackModal = () => {
                        open(
                            'Deployment Successful',
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <p style={{ fontSize: '15px', color: '#333', lineHeight: 1.6 }}>
                                    The rule has been deployed successfully. A workflow is currently in progress — please allow up to 30 minutes for both simulations to complete and verify that the rule is functioning as expected.
                                </p>
                            </div>,
                            null,
                            { maxWidth: 'sm' }
                        )
                    }
                    getOrganization().unwrap()
                        .then((res) => {
                            const organization = res?.organization
                            if (!organization || !rule_name) {
                                showFallbackModal()
                                return
                            }
                            const actionsUrl = `https://github.com/${organization}/${rule_name}/actions`
                            open(
                                'Deployment Successful',
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                    <p style={{ fontSize: '15px', color: '#333', lineHeight: 1.6 }}>
                                        The rule has been deployed successfully. A workflow is currently in progress — please wait until the workflow completes and verify that the rule is functioning as expected.
                                    </p>
                                    <p style={{ fontSize: '14px', marginTop: '12px' }}>
                                        <a href={actionsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>
                                            View GitHub Actions
                                        </a>
                                    </p>
                                </div>,
                                null,
                                { maxWidth: 'sm' }
                            )
                        })
                        .catch(() => {
                            showFallbackModal()
                        })
                }
            })
            .catch(() => {
                toast.error('Failed to deploy code')
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codeSynced, data?.id, deploy, toggleCodeDeployed, updateMetadata, open, getOrganization, rule_name])

    const handleSelect = (id: number) => {
        if (!codeDeployed && claims.editor === user?.claims && mode != 'view') {
            toast.error('Deploy rule first to run simulation')
            return;
        } else {
            setSelected(id)
        }

        // Reset payload and result whenever a tab is (re)selected
        setValue('payload', '')
        setResult(null)

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
            getPayload({ type: data.txtp, version: data.txtp_version })
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

            const rule_config_id = data?.rule_config_id
            const id = rule_config_id?.toString().split('@')[0]
            const version = data?.version
            body = {
                functionName: '',
                awaitReply: true,
                destination: `sub-rule-${id}@${version}`,
                consumer: `pub-rule-${id}@${version}`,
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
                        deploy: true,
                        simulation: true
                    });
                }
                addSimulationLog(body, res, logCategory);
            };
        } else {
            const endpointPath = getEndpointPath();
            if (!endpointPath) {
                toast.error('Transaction type endpoint path not found. Please select a valid transaction type.')
                return;
            }
            body = {
                body: parsedPayload,
                endpointPath,
            };
            mutation = endToEnd;
            logCategory = 'end_to_end';
            onSuccess = (res: unknown) => {
                const msgId = (res as Record<string, unknown>)?.transactionRelationship as Record<string, unknown> | undefined;
                getEndReport({ msgId: msgId?.MsgId as string })
                    .unwrap()
                    .then((reportData) => {
                        const finalResult = reportData ?? {};
                        setResult(finalResult);
                        toggleSimulationExecuted();
                        if (claims.editor === user?.claims) {
                            updateMetadata({
                                sync: false,
                                test: true,
                                deploy: true,
                                simulation: true
                            });
                        }
                        addSimulationLog(body, finalResult, logCategory);
                    })
                    .catch(() => {
                        // report not available — show empty object
                        setResult({});
                        toggleSimulationExecuted();
                        addSimulationLog(body, {}, logCategory);
                    });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            sentForApproval: simulationExecuted,
            codeSynced,
            codeDeployed,
            result,
            control,
            errors,
            isLoading: flowLoading,
            simulating: ruleOnlyLoading || endToEndLoading || endReportLoading,
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
