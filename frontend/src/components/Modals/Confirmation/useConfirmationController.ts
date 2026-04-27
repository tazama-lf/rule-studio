import { useModal } from "../../../contexts/ModalContext"

export interface IConfirmation {
    // header: string,
    message: string,
    btnTitle: string,
    onSubmit: () => void
}

const useConfirmationController = (props: IConfirmation) => {

    const { message, btnTitle } = props
    const { close } = useModal()

    const handleSubmit = () => { }

    return {
        values: {
            message,
            btnTitle
        },
        functions: {
            handleSubmit,
            close
        }
    }
}

export default useConfirmationController;
