import { createContext } from "react"

export interface ModalContextType {
    open: (
        title: string,
        content: React.ReactNode,
        footer?: React.ReactNode,
        props?: Record<string, unknown>
    ) => void
    close: () => void
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined)
