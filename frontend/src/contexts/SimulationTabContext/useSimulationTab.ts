import { useContext } from "react"
import { SimulationTabContext, type SimulationTabContextType } from "./SimulationTabContext"

export const useSimulationTab = (): SimulationTabContextType => {
    const context = useContext(SimulationTabContext)
    if (!context) {
        throw new Error("useSimulationTab must be used within a SimulationTabProvider")
    }
    return context
}
