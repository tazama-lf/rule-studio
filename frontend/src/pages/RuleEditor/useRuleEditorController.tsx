import { useCallback, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useGetRuleByIdQuery, useLazyGetRuleByIdQuery } from "../../redux/Api/Rules"
import Overview from "./Overview"
import Parser from "./Parser"
import RuleBuilder from "./RuleBuilder"
import Simulation from "./Simulation"
import { extractData, insertData } from "../../utils/Common/storage"
import { LocalStorage } from "../../utils/Common/enums"
import { useTab } from "../../contexts/TabContext/useTab"
import TestCases from "./TestCases"
import History from "./History"

const useRuleEditorController = () => {

    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null
    const rule = extractData('trs_rule', LocalStorage, true)

    const { data, isFetching: isLoading, isSuccess } = useGetRuleByIdQuery({ id }, { skip: !id, refetchOnMountOrArgChange: true })
    const [getRuleById, { data: ruleData }] = useLazyGetRuleByIdQuery()
    const { selectedTab } = useTab()


    useEffect(() => {
        if (selectedTab === 'simulation' && (id || rule?.id)) {
            getRuleById({ id: id ?? rule?.id })
                .unwrap()
                .then((updatedRule: any) => {
                    if (updatedRule?.rules) {
                        insertData('trs_rule', updatedRule.rules, LocalStorage, true)
                        console.log('Rule data refreshed for simulation tab')
                    }
                })
                .catch((error: any) => {
                    console.error('Failed to refetch rule data', error)
                })
        }
    }, [selectedTab, id, getRuleById, rule?.id])

    useEffect(() => {
        if (isSuccess && data?.rules) {
            insertData(data.rules, 'trs_rule', LocalStorage, true)
        }
    }, [isSuccess, data])

    const renderComponent = useCallback(() => {
        switch (selectedTab) {
            case 'overview':
                return <Overview mode={mode} data={data?.rules} />
            case 'rule_request':
                return <Parser mode={mode} data={data?.rules} />
            case 'rule_builder':
                return <RuleBuilder data={data?.rules} />
            case 'simulation':
                return <Simulation data={ruleData?.rules ?? data?.rules} />
            case 'test_cases':
                return <TestCases />
            case 'History':
                return <History data={data} />
            default:
                return null;
        }
    }, [selectedTab, data, mode, ruleData?.rules])

    return {
        values: {
            isLoading,
            mode
        },
        functions: {
            renderComponent
        }
    }
}

export default useRuleEditorController
