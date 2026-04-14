import { useContext } from "react"
import { MaskingTabContext, type MaskingTabContextType } from "./MaskingTabContext"

export const useMaskingTab = (): MaskingTabContextType => {
    const context = useContext(MaskingTabContext)
    if (!context) {
        throw new Error("useMaskingTab must be used within a MaskingTabProvider")
    }
    return context
}
