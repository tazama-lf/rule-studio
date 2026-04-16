import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useSimulationTab } from "../../contexts/SimulationTabContext/useSimulationTab"
import { extractData } from "../../utils/Common/storage"
import NewSimulation from "./NewSimulation"

const useSimulationController = () => {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    const { selectedTab } = useSimulationTab()

    const user = extractData('user')

    const renderComponent = useCallback(() => {
        switch (selectedTab) {
            case 'new_simulation':
                return <NewSimulation />
            default:
                return null;
        }
    }, [selectedTab])

    return {
        values: {
            mode,
            user
        },
        functions: {
            renderComponent
        }
    }
}

export default useSimulationController
