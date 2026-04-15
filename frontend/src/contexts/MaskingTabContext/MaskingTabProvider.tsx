import { useCallback, useEffect, useMemo, useState } from "react"
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

    const allowedTabs = useMemo(() => {
        if (user?.claims !== claims.data_engineer_editor) {
            return MaskingTabs.filter(tab => tab.value !== 'configure')
        }
        return MaskingTabs
    }, [user?.claims])

    const allowedTabValues = useMemo(() => allowedTabs.map(t => t.value), [allowedTabs])

    const initialSelectedTab = allowedTabValues.includes(tabFromUrl) ? tabFromUrl : allowedTabValues[0]

    const [selectedTab, setSelectedTab] = useState<string>(initialSelectedTab)
    const [enabledTabs, setEnabledTabs] = useState<string[]>(allowedTabValues)

    useEffect(() => {
        if (!enabledTabs.includes(selectedTab) && enabledTabs.length > 0) {
            setSelectedTab(enabledTabs[0])
        }
    }, [enabledTabs, selectedTab])

    const handleSetSelectedTab = useCallback((tab: string) => {
        setSelectedTab(tab)
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev)
            newParams.set('maskingTab', tab)
            return newParams
        })
    }, [setSearchParams])

    const enableNextTab = useCallback(() => {
        const currentIndex = allowedTabs.findIndex(t => t.value === selectedTab)
        if (currentIndex >= 0 && currentIndex < allowedTabs.length - 1) {
            const nextTab = allowedTabs[currentIndex + 1]
            setEnabledTabs(prev => {
                if (!prev.includes(nextTab.value)) {
                    return [...prev, nextTab.value]
                }
                return prev
            })
            handleSetSelectedTab(nextTab.value)
        }
    }, [selectedTab, handleSetSelectedTab, allowedTabs])

    const enablePreviousTab = useCallback(() => {
        const currentIndex = allowedTabs.findIndex(t => t.value === selectedTab)
        if (currentIndex > 0 && currentIndex < allowedTabs.length) {
            const prevTab = allowedTabs[currentIndex - 1]
            setEnabledTabs(prev => {
                if (!prev.includes(prevTab.value)) {
                    return [...prev, prevTab.value]
                }
                return prev
            })
            handleSetSelectedTab(prevTab.value)
        }
    }, [selectedTab, handleSetSelectedTab, allowedTabs])

    const enableAllTabs = useCallback(() => {
        setEnabledTabs(allowedTabs.map(t => t.value))
    }, [allowedTabs])

    const tabsWithEnabled = allowedTabs.map(tab => ({
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
