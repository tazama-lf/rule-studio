import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useLazyGetExcludedTypesQuery } from "../../../redux/Api/RuleSimulation";
import { useModal } from "../../../contexts/ModalContext";
import Confirmation from "../../../components/Modals/Confirmation";
import { useSimulationTab } from "../../../contexts/SimulationTabContext";

interface SimulationFormValues {
    date: string;
    startTime: string;
    endTime: string;
}

export interface ExcludedTypeProps {
    masking_id: null | string;
    txtp: string;
    txtp_version: string;
    record_status: string;
}

const useNewSimulationController = () => {

    const [getTypes,{isLoading}] = useLazyGetExcludedTypesQuery()
    const { open, close } = useModal()
    const { enableNextTab } = useSimulationTab()

    const [dataFetched, setDataFetched] = useState(false)
    const [count, setCount] = useState<number>()
    const [excluded, setExcluded] = useState<ExcludedTypeProps[]>([])

    const initial: SimulationFormValues = {
        date: '',
        startTime: '',
        endTime: '',
    };

    const {
        handleSubmit,
        formState: { errors },
        control,
        getValues,
        trigger,
        watch,
    } = useForm<SimulationFormValues>({
        defaultValues: initial
    })

    const validateTimeDifference = (endTime: string) => {
        const startTime = getValues('startTime');
        if (!startTime || !endTime) return true;

        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        const diffMinutes = endTotalMinutes - startTotalMinutes;

        if (diffMinutes <= 0) {
            return 'End time must be after start time';
        }

        if (diffMinutes > 60) {
            return 'Time difference cannot be more than 1 hour';
        }

        return true;
    };

    const handleStartTimeChange = () => {
        const endTime = getValues('endTime');
        if (endTime) {
            trigger('endTime');
        }
    };


    const onSubmit = async (values: SimulationFormValues) => {
        // const payload = {
        //     date: values.date,
        //     startTime: values.startTime,
        //     endTime: values.endTime,
        // }
        try {
            // await submit(payload).unwrap()
            // insertData(payload, 'simulation_config', LocalStorage, true)
            setDataFetched(true)
            setCount(50)
            getTypes({}).then((res) => {
                if (res) {
                    setExcluded(res.data.excludedTypes)
                }
            })
            // toast.success('Time Window Successfully Configured')
            // enableNextTab()
        } catch {
            toast.error('Failed to configure time window')
        }
    }

    const runSimulation = () => {
        close()
        enableNextTab()
    }

    const confirm = () => {
        open('Confirm Simulation Run', <Confirmation message="You are about to run a simulation using tokenized historical data for the selected time window. The replay will follow the original order and timing of occurrence of the transactions. Do you want to proceed?" onSubmit={runSimulation} btnTitle="Confirm & Run" />, null, { maxWidth: 'sm' })
    }


    const formValues = {
        date: watch('date'),
        startTime: watch('startTime'),
        endTime: watch('endTime'),
    }

    return {
        values: {
            control,
            errors,
            dataFetched,
            formValues,
            count,
            excluded,
            isLoading
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            validateTimeDifference,
            handleStartTimeChange,
            confirm
        },
    }
}

export default useNewSimulationController;
