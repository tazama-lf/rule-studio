import { useContext } from "react"
import { SimStudioTabContext, type SimStudioTabContextType } from "./SimStudioTabContext"

export const useSimStudioTab = (): SimStudioTabContextType => {
    const context = useContext(SimStudioTabContext)
    if (!context) {
        throw new Error("useSimStudioTab must be used within a SimStudioTabProvider")
    }
    return context
}
