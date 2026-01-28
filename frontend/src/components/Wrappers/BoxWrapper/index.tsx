import { Box } from '@mui/material'
import { memo, type ReactNode } from 'react'

interface BoxWrapperProps {
    children: ReactNode
}

const BoxWrapper = ({ children }: BoxWrapperProps) => {
    return (
        <Box bgcolor={'white'} boxShadow={1} p={3}>
            {children}
        </Box>
    )
}

export default memo(BoxWrapper)
