import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SimStudioTabs } from "../../utils/Constants/data"
import { SimStudioTabContext } from "./SimStudioTabContext"

interface SimStudioTabProviderProps {
    children: React.ReactNode
}

export const SimStudioTabProvider = ({ children }: SimStudioTabProviderProps) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabFromUrl = searchParams.get('simStudioTab') ?? SimStudioTabs[0].value
    const [selectedTab, setSelectedTabState] = useState<string>(tabFromUrl)

    const getInitialEnabledTabs = (): string[] => {
        const targetIdx = SimStudioTabs.findIndex(t => t.value === tabFromUrl)
        if (targetIdx > 0) {
            return SimStudioTabs.slice(0, targetIdx + 1).map(t => t.value)
        }
        return [SimStudioTabs[0].value]
    }
    const [enabledTabs, setEnabledTabs] = useState<string[]>(getInitialEnabledTabs)
    const filteredTabs = useMemo(() => SimStudioTabs, [])

    const handleSetSelectedTab = useCallback((tab: string) => {
        setSelectedTabState(tab)
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('simStudioTab', tab)
            return newParams
        })
    }, [setSearchParams])

    const enableNextTab = useCallback(() => {
        const currentIndex = filteredTabs.findIndex(t => t.value === selectedTab)
        if (currentIndex >= 0 && currentIndex < filteredTabs.length - 1) {
            const nextTab = filteredTabs[currentIndex + 1]
            setEnabledTabs((prev) => {
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
        if (currentIndex > 0) {
            const prevTab = filteredTabs[currentIndex - 1]
            setEnabledTabs((prev) => {
                if (!prev.includes(prevTab.value)) {
                    return [...prev, prevTab.value]
                }
                return prev
            })
            handleSetSelectedTab(prevTab.value)
        }
    }, [selectedTab, handleSetSelectedTab, filteredTabs])

    const enableAllTabs = useCallback(() => {
        setEnabledTabs(filteredTabs.map(t => t.value))
    }, [filteredTabs])

    const tabsWithEnabled = filteredTabs.map(tab => ({
        ...tab,
        enabled: enabledTabs.includes(tab.value),
    }))

    return (
        <SimStudioTabContext.Provider value={{
            selectedTab,
            enabledTabs,
            tabs: tabsWithEnabled,
            setSelectedTab: handleSetSelectedTab,
            enableNextTab,
            enableAllTabs,
            enablePreviousTab,
        }}>
            {children}
        </SimStudioTabContext.Provider>
    )
}
