import toast from "react-hot-toast"
import { useUpdateMaskMutation } from "../../../../redux/Api/Masking"
import { useNavigate } from "react-router-dom"
import { useMemo } from "react"
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { useModal } from "../../../../contexts/ModalContext";


export interface ISubmitMask {
    id: string,
    payload: { txtp: string, txtp_version: string, tokenize: Record<string, boolean> }
}

const useSubmitMaskingController = (props: ISubmitMask) => {

    const { id, payload } = props
    const navigate = useNavigate()
    const { close } = useModal()

    const [update, { isLoading: updateLoading }] = useUpdateMaskMutation()

    const onSubmit = async () => {
        try {
            await update({ id, body: payload }).unwrap()
            close()
            toast.success('Configuration Successfully Saved')
            navigate('/masking-config')
        } catch {
            toast.error('Failed to update configuration')
        }
    }

    const columns = [
        {
            label: 'Field',
            key: 'field_name'
        },
        {
            label: 'Tokenized',
            key: 'tokenized',
            render: (row: Record<string, unknown>) => (
                row.tokenized ? <TaskAltIcon sx={{ color: "#2aac5a" }} /> : null
            )
        },
    ]

    const tableData = useMemo(() =>
        Object.entries(payload.tokenize).map(([key, value]) => ({
            field_name: key,
            tokenized: value,
        })),
        [payload]
    );

    return {
        values: {
            data: tableData,
            updateLoading,
            columns,
            payload
        },
        functions: {
            onSubmit,
            onCancel: close
        }
    }
}


export default useSubmitMaskingController;