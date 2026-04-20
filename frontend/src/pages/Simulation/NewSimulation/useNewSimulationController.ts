import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useSimulationTab } from "../../../contexts/SimulationTabContext";
import { useCreateMaskingMutation } from "../../../redux/Api/Masking";

interface SimulationFormValues {
    date: string;
    startTime: string;
    endTime: string;
}

const useNewSimulationController = () => {

    const [submit, { isLoading: createLoading }] = useCreateMaskingMutation()

    const { enableNextTab } = useSimulationTab()

    const [dataFetched, setDataFetched] = useState(false)

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
            // toast.success('Time Window Successfully Configured')
            // enableNextTab()
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
            createLoading,
            dataFetched,
            formValues
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            validateTimeDifference,
            handleStartTimeChange,
        },
    }
}

export default useNewSimulationController;
