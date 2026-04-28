import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { SimulationTabs } from "../../utils/Constants/data"
import { SimulationTabContext } from "./SimulationTabContext"

interface SimulationTabProviderProps {
    children: React.ReactNode
    mode?: string | null
}

export const SimulationTabProvider = ({ children }: SimulationTabProviderProps) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabFromUrl = searchParams.get('simulationTab') ?? SimulationTabs[0].value

    const [selectedTab, setSelectedTab] = useState<string>(tabFromUrl)
    const [enabledTabs, setEnabledTabs] = useState<string[]>([SimulationTabs[0].value])

    const filteredTabs = useMemo(() => {
        return SimulationTabs
    }, [])

    const handleSetSelectedTab = useCallback((tab: string) => {
        setSelectedTab(tab)
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('simulationTab', tab)
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
        if (currentIndex > 0 && currentIndex < filteredTabs.length) {
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
        enabled: enabledTabs.includes(tab.value)
    }))

    return (
        <SimulationTabContext.Provider value={{
            selectedTab,
            enabledTabs,
            tabs: tabsWithEnabled,
            setSelectedTab: handleSetSelectedTab,
            enableNextTab,
            enableAllTabs,
            enablePreviousTab
        }}>
            {children}
        </SimulationTabContext.Provider>
    )
}
