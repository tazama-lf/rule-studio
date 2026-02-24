
export interface IViewPayload {
    data: Record<string, unknown>
}

const useViewPayloadController = (props: IViewPayload) => {
    return {
        values: {
            payload: props.data.old_data,
            result: props.data.new_data
        }
    }
}


export default useViewPayloadController;