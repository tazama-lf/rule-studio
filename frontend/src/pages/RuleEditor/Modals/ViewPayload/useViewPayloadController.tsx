
export interface IViewPayload {
    data: Record<string, unknown>
}

const useViewPayloadController = (props: IViewPayload) => {
    return {
        values: {
            json: props.data
        }
    }
}


export default useViewPayloadController;