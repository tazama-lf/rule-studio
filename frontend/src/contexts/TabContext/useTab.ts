import { useContext } from "react"
import { TabContext, type TabContextType } from "./TabContext"

export const useTab = (): TabContextType => {
    const context = useContext(TabContext)
    if (!context) {
        throw new Error("useTab must be used within a TabProvider")
    }
    return context
}
