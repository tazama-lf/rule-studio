import { styled } from "@mui/material";
import MuiAccordionSummary, {
    accordionSummaryClasses,
} from '@mui/material/AccordionSummary';
import type { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

export const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowDropDownIcon sx={{ color: 'static.darkBrown' }} />}
        {...props}
    />
))(({ theme }) => ({
    backgroundColor: theme.palette.static.pale,
    minHeight: '48px !important',
    maxHeight: '48px',
    '&.Mui-expanded': {
        minHeight: '48px !important',
        maxHeight: '48px',
    },
    [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
        transform: 'rotate(180deg)',
    },
    [`& .${accordionSummaryClasses.content}`]: {
        gap: 8,
    },
}));
