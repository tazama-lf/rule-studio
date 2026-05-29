import { createContext } from "react"
import type { TabItem } from "../../components/Tabs"

export interface SimStudioTabContextType {
    selectedTab: string
    enabledTabs: string[]
    tabs: TabItem[]
    setSelectedTab: (tab: string) => void
    enableNextTab: () => void
    enableAllTabs: () => void
    enablePreviousTab: () => void
}

export const SimStudioTabContext = createContext<SimStudioTabContextType | undefined>(undefined)
