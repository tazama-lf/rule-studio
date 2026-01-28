import * as yup from 'yup';

export const loginValidation = yup
    .object({
        username: yup
            .string()
            .required('This Field is Required')
            .max(100, 'Email must not exceed 100 characters')
            .email('A valid email address is required.')
            .test(
                'dot-after-at',
                'Email must contain a dot (.) after @',
                (value) => {
                    if (!value) return true;
                    const [, domain] = value.split('@');
                    return !!domain && domain.includes('.');
                }
            ),
        password: yup
            .string()
            .required('This Field is Required')
            .min(6, 'Must be at least 6 characters')
            .max(50, 'Password must not exceed 50 characters'),
    })
    .required();