import { useCallback, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { extractData } from "../../utils/Common/storage"
import { claims, MaskingTabs } from "../../utils/Constants/data"
import { MaskingTabContext } from "./MaskingTabContext"

interface MaskingTabProviderProps {
    children: React.ReactNode
    mode?: string | null
}

export const MaskingTabProvider = ({ children }: MaskingTabProviderProps) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabFromUrl = searchParams.get('maskingTab') ?? MaskingTabs[0].value
    const user = extractData('user')

    const [selectedTab, setSelectedTab] = useState<string>(tabFromUrl)
    const [enabledTabs, setEnabledTabs] = useState<string[]>([MaskingTabs[0].value])

    const filteredTabs = useMemo(() => {
        if (user?.claims !== claims.data_engineer_editor) {
            return []
        }
        return MaskingTabs
    }, [user?.claims])

    const handleSetSelectedTab = useCallback((tab: string) => {
        setSelectedTab(tab)
        setSearchParams((prev: string) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('maskingTab', tab)
            return newParams
        })
    }, [setSearchParams])

    const enableNextTab = useCallback(() => {
        const currentIndex = filteredTabs.findIndex(t => t.value === selectedTab)
        if (currentIndex >= 0 && currentIndex < filteredTabs.length - 1) {
            const nextTab = filteredTabs[currentIndex + 1]
            setEnabledTabs((prev: string) => {
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
            setEnabledTabs((prev: string) => {
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
        <MaskingTabContext.Provider value={{
            selectedTab,
            enabledTabs,
            tabs: tabsWithEnabled,
            setSelectedTab: handleSetSelectedTab,
            enableNextTab,
            enableAllTabs,
            enablePreviousTab
        }}>
            {children}
        </MaskingTabContext.Provider>
    )
}
