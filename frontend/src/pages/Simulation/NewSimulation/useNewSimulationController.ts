import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSimulationTab } from "../../../contexts/SimulationTabContext";
import { useGetDlhCountMutation } from "../../../redux/Api/FetchDromDlh";
import { useLazyGetExcludedTypesQuery } from "../../../redux/Api/RuleSimulation";

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

    const [getCount, { isLoading: countLoading }] = useGetDlhCountMutation()
    const [getTypes, { isLoading: typesLoading }] = useLazyGetExcludedTypesQuery()

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
        const startDateTime = new Date(`${values.date}T${values.startTime}:00`).toISOString()
        const endDateTime = new Date(`${values.date}T${values.endTime}:00`).toISOString()

        const payload = {
            startDtTm: startDateTime,
            endDtTm: endDateTime,
        }
        try {
            getCount(payload).then((response) => {
                if (response) {
                    setCount(response.data.rowCount)
                    setDataFetched(true)
                    getTypes({}).then((res) => {
                        if (res) {
                            setExcluded(res.data.excludedTypes)
                        }
                    })
                }
            })
        } catch {
            toast.error('Failed to configure time window')
        }
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
            isLoading: typesLoading || countLoading
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            validateTimeDifference,
            handleStartTimeChange,
        },
    }
}

export default useNewSimulationController;
