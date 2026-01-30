import { useTab } from "../../../contexts/TabContext/useTab";


const useTestCasesController = () => {

    const { enableNextTab, enablePreviousTab } = useTab()

    const handleNext = () => {
        enableNextTab()
    }

    const handleBack = () => {
        enablePreviousTab()
    }

    const handleCanvas = () => {
        enableNextTab()
    }

    return {
        values: {},
        functions: {
            handleNext,
            handleCanvas,
            handleBack
        }
    }
}

export default useTestCasesController;
