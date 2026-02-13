import { useTab } from "../../../contexts/TabContext/useTab";
import { useMemo } from "react";
import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useGetRuleFlowStatusQuery } from "../../../redux/Api/Rule-builder";


export interface ITestCases {
    data?: Record<string, unknown> | undefined
}

const useTestCasesController = (props: ITestCases) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props?.data,
        [props?.data]
    )

    const { data: flowData, isLoading: isLoadingFlow } = useGetRuleFlowStatusQuery(
        { ruleId: (data?.id || '') as string | number, category: 'test_case_generation' },
        { skip: !data?.id, refetchOnMountOrArgChange: true }
    );

    const { enableNextTab, enablePreviousTab } = useTab()

    const handleNext = () => {
        enableNextTab()
    }

    const handleBack = () => {
        enablePreviousTab()
    }

    const handleCanvas = () => {
        window.location.href = `/test-case-generate/${data?.id}`
    }

    const flowStatus = flowData?.result?.status || 'initial'
    const isInitial = flowStatus === 'initial'
    const isPassed = flowStatus === 'pass'
    const isFailed = flowStatus === 'fail'

    const getStatusConfig = () => {
        switch (flowStatus) {
            case 'initial':
                return {
                    title: 'Test Cases Not Created Yet',
                    description: 'Your test cases are in initial mode. Click the button below to start generating test cases.',
                    buttonText: 'Open Test Case Generator',
                    color: '#FFA726',
                    bgColor: '#FFF3E0',
                    icon: '🚀'
                }
            case 'pass':
                return {
                    title: 'Test Cases Validated Successfully',
                    description: 'Your test cases have been validated and are ready to use. You can edit them anytime.',
                    buttonText: 'Edit Test Cases',
                    color: '#66BB6A',
                    bgColor: '#E8F5E9',
                    icon: '✅'
                }
            case 'fail':
                return {
                    title: 'Validation Failed',
                    description: 'Your test cases contain errors and need to be fixed. Click below to review and correct the issues.',
                    buttonText: 'Edit Test Cases',
                    color: '#EF5350',
                    bgColor: '#FFEBEE',
                    icon: '⚠️'
                }
            default:
                return {
                    title: 'Test Case Generator',
                    description: 'Generate test cases for your rule',
                    buttonText: 'Open Test Case Generator',
                    color: '#42A5F5',
                    bgColor: '#E3F2FD',
                    icon: '📝'
                }
        }
    }

    const statusConfig = getStatusConfig()

    return {
        values: {
            flowStatus,
            isInitial,
            isPassed,
            isFailed,
            isLoadingFlow,
            statusConfig
        },
        functions: {
            handleNext,
            handleCanvas,
            handleBack
        }
    }
}

export default useTestCasesController;
