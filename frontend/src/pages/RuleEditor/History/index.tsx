import { Box } from "@mui/material"
import type { IHistory } from "./useHistoryController"
import useHistoryController from "./useHistoryController"
import Table from "../../../components/Table"
import Button from "../../../components/Button"

const History = (props: IHistory) => {

    const { values, functions } = useHistoryController(props)

    return (
        <Box mt={3}>
            <Box mb={4}>
                <Table
                    serial_no
                    title={'Rule-Only Simulation'}
                    columns={values.columns}
                    data={values.readOnlyData}
                    loading={values.isLoading}
                />
            </Box>

            <Box>
                <Table
                    serial_no
                    title={'End-To-End Simulation'}
                    columns={values.columns}
                    data={values.endToEndData}
                    loading={values.isLoading}
                />
            </Box>

            <Box mt={2} width={'100%'} display={'flex'} justifyContent={'space-between'}>
                <Button height="40px" type="secondary" size="md" text="Back" onClick={functions.handlePrevious} />
            </Box>
        </Box>
    )
}


export default History