import { createContext } from "react"
import type { TabItem } from "../../components/Tabs"

export interface MaskingTabContextType {
    selectedTab: string
    enabledTabs: string[]
    tabs: TabItem[]
    setSelectedTab: (tab: string) => void
    enableNextTab: () => void
    enableAllTabs: () => void
    enablePreviousTab: () => void
}

export const MaskingTabContext = createContext<MaskingTabContextType | undefined>(undefined)
