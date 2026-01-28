import { Box, Pagination, Typography } from "@mui/material";
import { memo } from "react";

export type PaginationProps = {
    total?: number;
    limit?: number;
    current_page?: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (perPage: number) => void;
    page_size_options?: number[];
};

const CustomPagination = ({
    total = 0,
    limit = 10,
    current_page = 0,
    onPageChange,
}: PaginationProps) => {

    const total_pages = Math.max(1, Math.ceil(total / limit));

    const from = (current_page) * limit + 1;
    const to = Math.min((current_page + 1) * limit, total);

    return (
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" mt={4} gap={2}>
            <Typography variant="body2">
                Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{total}</strong> entries
            </Typography>

            <Pagination
                page={Number(current_page + 1)}
                count={Number(total_pages)}
                onChange={(_, newPage: number) => onPageChange(newPage)}
                variant="outlined"
                sx={{
                    '& .MuiPaginationItem-page.Mui-selected': {
                        backgroundColor: '#fbf9fa',
                    },
                }}
            />
        </Box>
    );
};

export default memo(CustomPagination);
