import { useModal } from "../../../contexts/ModalContext"

export interface IConfirmation {
    message: string,
    btnTitle: string,
    onSubmit: () => void
}

const useConfirmationController = (props: IConfirmation) => {

    const { message, btnTitle, onSubmit } = props
    const { close } = useModal()

    return {
        values: {
            message,
            btnTitle
        },
        functions: {
            handleSubmit: onSubmit,
            close
        }
    }
}

export default useConfirmationController;
