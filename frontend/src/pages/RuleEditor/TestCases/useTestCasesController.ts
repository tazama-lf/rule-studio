import { useTab } from "../../../contexts/TabContext/useTab";


const useTestCasesController = () => {

    const { enableNextTab } = useTab()

    const handleNext = () => {
        enableNextTab()
    }

    return {
        values: {},
        functions: {
            handleNext
        }
    }
}

export default useTestCasesController;
