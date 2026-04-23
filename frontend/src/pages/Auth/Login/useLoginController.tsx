import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from "react-hook-form";
import { useLoginMutation } from '../../../redux/Api/Auth';
import { useEffect } from 'react';
import { insertData } from '../../../utils/Common/storage';
import { useNavigate } from 'react-router-dom';
import { decodeToken } from '../../../utils/Common/helpers';
import { loginValidation } from '../../../validation/schemas/authSchema';
import { DATA_ENGINEER_ROLES } from '../../../utils/Constants/data';

const initial = {
    username: '',
    password: ''
}

const useLoginController = () => {

    const navigate = useNavigate()

    const [submit, { data, isLoading, isSuccess }] = useLoginMutation()

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({ defaultValues: initial, resolver: yupResolver(loginValidation) });

    useEffect(() => {
        if (isSuccess) {
            insertData(data?.token, "access_token")
            const details = decodeToken(data?.token)
            insertData(details, 'user')
            const target = DATA_ENGINEER_ROLES.includes(details?.claims ?? '') ? '/masking-config' : '/home'
            navigate(target)
        }
    }, [isSuccess, data, navigate])

    const onSubmit = (data: unknown) => {
        submit(data)
    };

    return {
        values: {
            control,
            errors,
            isLoading
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        }
    }
}

export default useLoginController;
