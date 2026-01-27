import { useState } from "react"
import Modal, { type ModalProps } from "../../components/Wrappers/Modal"
import { ModalContext } from "./ModalContext"

interface ModalState {
    open: boolean
    title: string
    content: React.ReactNode | null
    footer: React.ReactNode | null
    props?: Partial<ModalProps>
}

interface ModalProviderProps {
    children: React.ReactNode
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
    const [modal, setModal] = useState<ModalState>({
        open: false,
        title: "",
        content: null,
        footer: null,
        props: {},
    })

    const open = (
        title: string,
        content: React.ReactNode,
        footer: React.ReactNode | null = null,
        props: Partial<ModalProps> = {}
    ) => {
        setModal({ open: true, title, content, footer, props })
    }

    const close = () => {
        setModal(prev => ({ ...prev, open: false }))
    }

    return (
        <ModalContext.Provider value={{ open, close }}>
            {children}
            <Modal
                open={modal.open}
                title={modal.title}
                footer={modal.footer}
                onClose={close}
                {...modal.props}
            >
                {modal.content ?? null}
            </Modal>
        </ModalContext.Provider>
    )
}
