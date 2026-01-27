import * as yup from 'yup';

export const createRuleSchema = yup.object({
    rule_name: yup.string().required("Rule name is required"),
    description: yup.string().required("Description is required"),
    txtp: yup
        .object({
            label: yup.string().required(),
            value: yup.string().required(),
        })
        .nullable()
        .test("not-null", "TxTp is required", value => value !== null),
    txtpVersion: yup
        .object({
            label: yup.string().required(),
            value: yup.string().required(),
        })
        .nullable()
        .test("not-null", "TxTp Version is required", value => value !== null),
    version: yup
        .string()
        .required("Version is required")
        .matches(/^\d+\.\d+\.\d+$/, "Version must be in format X.X.X"),
    rule_config_id: yup.object({
        label: yup.string().required(),
        value: yup.string().required(),
    })
        .nullable()
        .test("not-null", "Rule Config is required", value => value !== null),
    rule_type: yup
        .object({
            label: yup.string().required(),
            value: yup.string().required(),
        })
        .nullable()
        .test("not-null", "Rule Type is required", value => value !== null),
})