import { createContext } from "react"
import type { TabItem } from "../../components/Tabs"

export interface TabContextType {
    selectedTab: string
    enabledTabs: string[]
    tabs: TabItem[]
    setSelectedTab: (tab: string) => void
    enableNextTab: () => void
    enableAllTabs: () => void
}

export const TabContext = createContext<TabContextType | undefined>(undefined)
