import { extractData } from "../../../utils/Common/storage";
import { LocalStorage } from "../../../utils/Common/enums";
import { useTab } from "../../../contexts/TabContext/useTab";
import { useMemo } from "react";
import { useGetRuleFlowStatusQuery } from "../../../redux/Api/Rule-builder";

export interface IRuleBuilder {
    data?: Record<string, unknown> | undefined
}

const useRuleBuilderController = (props: IRuleBuilder) => {

    const data = useMemo(
        () => extractData('trs_rule', LocalStorage, true) ?? props.data,
        [props.data]
    )
    
    const statusInProgress = data?.status?.includes('IN_PROGRESS')

    const { data: flowData, isLoading: isLoadingFlow } = useGetRuleFlowStatusQuery(
        { ruleId: (data?.id || '') as string | number, category: 'rule_builder' },
        { skip: !data?.id, refetchOnMountOrArgChange: true }
    );

    const { enableNextTab, enablePreviousTab } = useTab()

    const handleBuilder = () => {
        if(statusInProgress){
            window.location.href = `/rule-builder/${data?.id}`
        }
        else {
            window.location.href = `/rule-builder/view/${data?.id}`
        }
    }

    const handleNext = () => {
        enableNextTab()
    }
    const handleBack = () => {
        enablePreviousTab()
    }

    const flowStatus = flowData?.result?.status || 'initial'
    const isInitial = flowStatus === 'initial'
    const isPassed = flowStatus === 'pass'
    const isFailed = flowStatus === 'fail'

    const getStatusConfig = () => {
        switch (flowStatus) {
            case 'initial':
                return {
                    title: 'Rule Not Created Yet',
                    description: 'Your rule is in initial mode. Click the button below to start building your rule.',
                    buttonText: `${statusInProgress ? 'Open Rule Builder' : 'View Rule'}`,
                    color: '#FFA726',
                    bgColor: '#FFF3E0',
                    icon: '🚀'
                }
            case 'pass':
                return {
                    title: 'Rule Validated Successfully',
                    description: 'Your rule has been validated and is ready to use. You can edit it anytime.',
                    buttonText: `${statusInProgress ? 'Edit Rule' : 'View Rule'}`,
                    color: '#66BB6A',
                    bgColor: '#E8F5E9',
                    icon: '✅'
                }
            case 'fail':
                return {
                    title: 'Validation Failed',
                    description: 'Your rule contains errors and needs to be fixed. Click below to review and correct the issues.',
                    buttonText: `${statusInProgress ? 'Edit Rule' : 'View Rule'}`,
                    color: '#EF5350',
                    bgColor: '#FFEBEE',
                    icon: '⚠️'
                }
            default:
                return {
                    title: 'Rule Builder',
                    description: 'Create your rule',
                    buttonText: `${statusInProgress ? 'Open Rule Builder' : 'View Rule'}`,
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
            handleBuilder,
            handleNext,
            handleBack
        }
    }
}

export default useRuleBuilderController;
