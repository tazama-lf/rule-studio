import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useUpdateStatusMutation } from "../../../redux/Api/Rules";
import { Status } from "../../../utils/Constants/data";
import { useModal } from "../../../contexts/ModalContext";
import { useMergeBranchMutation } from "../../../redux/Api/Simulation";
import toast from "react-hot-toast";

export interface IApproval {
    type: 'review' | 'approve' | 'reject' | 'pause' | 'resume' | 'deploy',
    id: string,
    onSuccess?: () => void,
    rule_config_id?: string
}

interface IValues {
    comment: string
}

const message = {
    approve: 'Important: This will approve the rule and move it to the next stage in the workflow.',
    reject: 'Important: This will reject the rule and send it back to the maker for revisions.',
    review: 'Important: This will submit the rule for approval and update its status to UNDER REVIEW.',
    pause: 'This will put the rule on hold. You can resume it later.',
    resume: 'This will change the rule status back to IN PROGRESS.',
    deploy: 'Important: This will deploy the rule to production stage.'
}

const header = {
    approve: 'Are you sure you want to approve this rule?',
    reject: 'Are you sure you want to reject this rule?',
    review: 'Are you sure you want to send this rule for review?',
    pause: 'Are you sure you want to pause this rule?',
    resume: 'Are you sure you want to resume this rule?',
    deploy: 'Are you sure you want to deploy this rule?'
}

const getBtnTitle = (type: IApproval['type']) => {
    switch (type) {
        case 'approve': return 'Approve'
        case 'reject': return 'Reject'
        case 'review': return 'Submit For Approval'
        case 'pause': return 'Yes, Pause Rule'
        case 'resume': return 'Yes, Resume Rule'
        case 'deploy': return 'Yes, Deploy Rule'
    }
}

const getStatus = (type: IApproval['type']) => {
    switch (type) {
        case 'approve': return Status.STATUS_04_APPROVED
        case 'reject': return Status.STATUS_05_REJECTED
        case 'review': return Status.STATUS_03_UNDER_REVIEW
        case 'pause': return Status.STATUS_02_ON_HOLD
        case 'resume': return Status.STATUS_01_IN_PROGRESS
        case 'deploy': return Status.STATUS_08_DEPLOYED
    }
}

const getTheme = (type: IApproval['type']) => {
    switch (type) {
        case 'approve':
            return {
                bgColor: '#edf7ed',
                borderColor: 'success.main',
                textColor: 'text.black',
                buttonType: 'primary' as const
            }
        case 'deploy':
            return {
                bgColor: '#dceeff',
                borderColor: 'static.secondary',
                textColor: 'static.secondary',
                buttonType: 'prod' as const
            }
        case 'review':
        case 'pause':
        case 'resume':
            return {
                bgColor: '#dceeff',
                borderColor: 'static.secondary',
                textColor: 'static.secondary',
                buttonType: 'secondary' as const
            }
        case 'reject':
            return {
                bgColor: '#fef2f2',
                borderColor: 'error.main',
                textColor: 'error',
                buttonType: 'danger' as const
            }
    }
}

const requiresComment = (type: IApproval['type']) => {
    return type === 'reject'
}

const useApprovalController = (props: IApproval) => {

    const { type, id, rule_config_id, onSuccess } = props
    const { close } = useModal()
    const navigate = useNavigate()

    const theme = getTheme(type)
    const showCommentsField = !['review', 'pause', 'resume', 'deploy'].includes(type)

    const { handleSubmit, formState: { errors }, control } = useForm({
        defaultValues: { comment: '' }
    })

    const [submit, { isLoading }] = useUpdateStatusMutation()
    const [deploy, { isLoading: deploying }] = useMergeBranchMutation()

    const onSubmit = (values: IValues) => {
        const status = getStatus(type)
        const body = {
            ...(status === Status.STATUS_04_APPROVED ||
                status === Status.STATUS_05_REJECTED
                ? values
                : {}),
            status,
        }

        if (status === Status.STATUS_08_DEPLOYED) {

            const deployBody = {
                ruleId: rule_config_id,
                branchName: "prod"
            }
            deploy(deployBody).unwrap()
                .then(() => {
                    return submit({ id, body }).unwrap()
                        .then(() => {
                            toast.success('Code Deployed Successfully')
                            close()
                            navigate('/home')
                        })
                        .catch(() => {
                            toast.error('Deployment succeeded but updating status failed')
                        })
                })
                .catch(() => {
                    toast.error('Failed to deploy code')
                })
        } else {
            submit({ id, body }).unwrap()
                .then(() => {
                    close()
                    if (type === 'pause' || type === 'resume') {
                        onSuccess?.()
                    } else {
                        navigate('/home')
                    }
                })
                .catch(() => {
                    toast.error('Failed to update rule status')
                })
        }
    }

    return {
        values: {
            control,
            errors,
            isLoading: isLoading || deploying,
            message: message[type],
            header: header[type],
            btnTitle: getBtnTitle(type),
            showCommentsField,
            theme,
            requiresComment: requiresComment(type)
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            close
        }
    }
}

export default useApprovalController;
