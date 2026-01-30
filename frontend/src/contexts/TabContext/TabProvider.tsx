import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { extractData } from "../../utils/Common/storage"
import { claims, Tabs } from "../../utils/Constants/data"
import { TabContext } from "./TabContext"

interface TabProviderProps {
    children: React.ReactNode
    mode?: string | null
}

export const TabProvider = ({ children }: TabProviderProps) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabFromUrl = searchParams.get('tab') ?? Tabs[0].value
    const user = extractData('user')

    const [selectedTab, setSelectedTab] = useState<string>(tabFromUrl)
    const [enabledTabs, setEnabledTabs] = useState<string[]>([Tabs[0].value])


    const filteredTabs = useMemo(() => {
        if (user?.claims !== claims.editor) {
            return Tabs.filter(tab => tab.value !== 'parser')
        }
        return Tabs
    }, [user?.claims])


    const handleSetSelectedTab = useCallback((tab: string) => {
        setSelectedTab(tab)
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev)
            newParams.set('tab', tab)
            return newParams
        })
    }, [setSearchParams])

    const enableNextTab = useCallback(() => {
        const currentIndex = filteredTabs.findIndex(t => t.value === selectedTab)
        if (currentIndex >= 0 && currentIndex < filteredTabs.length - 1) {
            const nextTab = filteredTabs[currentIndex + 1]
            setEnabledTabs(prev => {
                if (!prev.includes(nextTab.value)) {
                    return [...prev, nextTab.value]
                }
                return prev
            })
            handleSetSelectedTab(nextTab.value)
        }
    }, [selectedTab, handleSetSelectedTab, filteredTabs])

    const enablePreviousTab = useCallback(() => {
        const currentIndex = filteredTabs.findIndex(t => t.value === selectedTab)
        if (currentIndex >= 0 && currentIndex < filteredTabs.length - 1) {
            const nextTab = filteredTabs[currentIndex - 1]
            setEnabledTabs(prev => {
                if (!prev.includes(nextTab.value)) {
                    return [...prev, nextTab.value]
                }
                return prev
            })
            handleSetSelectedTab(nextTab.value)
        }
    }, [selectedTab, handleSetSelectedTab, filteredTabs])

    const enableAllTabs = useCallback(() => {
        setEnabledTabs(filteredTabs.map(t => t.value))
    }, [filteredTabs])

    const tabsWithEnabled = filteredTabs.map(tab => ({
        ...tab,
        enabled: enabledTabs.includes(tab.value)
    }))

    return (
        <TabContext.Provider value={{
            selectedTab,
            enabledTabs,
            tabs: tabsWithEnabled,
            setSelectedTab: handleSetSelectedTab,
            enableNextTab,
            enableAllTabs,
            enablePreviousTab
        }}>
            {children}
        </TabContext.Provider>
    )
}
