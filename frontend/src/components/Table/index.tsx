import {
    Box,
    Table as MuiTable,
    Paper,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { memo } from "react";

import { dateFormatter, getNestedValue } from "../../utils/Common/helpers";
import Loader from "../Loader";
import CustomPagination from "../Pagination";

export type TableColumn = {
    key: string;
    label: string;
    type?: "date";
    render?: (row: Record<string, unknown>) => React.ReactNode;
    filter?: React.ReactNode;
    capitalize?: boolean;
    sx?: object;
};

export type Pagination = {
    offset: number;
    limit: number;
    total: number,
    onPageChange: (page: number) => void;
};

type TableProps = {
    serial_no?: boolean;
    columns: TableColumn[];
    data: unknown[];
    pagination?: Pagination | null;
    loading?: boolean;
    onRowClick?: (row: unknown) => void;
    getRowClassName?: (row: unknown) => string;
    getRowStyle?: (row: unknown) => React.CSSProperties;
};

const Table = ({
    columns,
    data,
    pagination = null,
    loading = false,
    onRowClick,
    getRowClassName,
    getRowStyle,
    serial_no = false,
}: TableProps) => {
    const headers = serial_no
        ? [{ key: 'serial_no', label: 'S.No.' }, ...columns]
        : [...columns];

    const renderRow = (row: Record<string, unknown>, index: number) => (
        <>
            {serial_no && (
                <TableCell
                    key={`serial_no-${index}`}
                    sx={{
                        borderBottom: "1px solid #e0e0e0",
                        textAlign: 'left',
                    }}
                >
                    {(pagination ? (pagination.offset - 1) * pagination.limit : 0) + index + 1}
                </TableCell>
            )}
            {columns.map((col) => (
                <TableCell
                    key={`${(row as Record<string, unknown>)?.id ?? index}-${col.key}`}
                    sx={{
                        borderBottom: "1px solid #e0e0e0",
                        whiteSpace: "pre-line",
                        textTransform: col.capitalize ? "capitalize" : "none",
                        ...(col.sx ?? {}),
                    }}
                >
                    {col.render
                        ? col.render(row)
                        : col.type === "date"
                            ? dateFormatter(getNestedValue(row, col.key))
                            : getNestedValue(row, col.key)}
                </TableCell>
            ))}
        </>
    );

    return (
        <Box my={3}>
            <TableContainer component={Paper} variant="outlined">
                <MuiTable stickyHeader sx={{ minWidth: 600 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "primary.main" }}>
                            {headers.map((h, idx) => (
                                <TableCell
                                    key={idx}
                                    sx={{
                                        color: "text.black",
                                        bgcolor: '#fbf9fa',
                                        fontWeight: 600,
                                        fontSize: "14px",
                                    }}
                                >
                                    {h.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={headers.length} align="center">
                                    <Loader type="circular" center size={30} />
                                </TableCell>
                            </TableRow>
                        ) : data.length ? (
                            data.map((row, index) => (
                                <TableRow
                                    key={`${pagination?.offset ?? 1}-${(row as Record<string, unknown>)?.id ?? index}`}
                                    hover
                                    onClick={() => onRowClick?.(row)}
                                    sx={{
                                        cursor: onRowClick ? "pointer" : "default",
                                        ...(getRowStyle?.(row) ?? {}),
                                    }}
                                    className={getRowClassName?.(row)}
                                >
                                    {renderRow(row as Record<string, unknown>, index)}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={headers.length} align="center">
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </MuiTable>
            </TableContainer>
            {
                pagination && !loading && data.length > 0 && (
                    <CustomPagination
                        current_page={pagination?.offset}
                        limit={pagination?.limit}
                        total={pagination?.total}
                        onPageChange={pagination?.onPageChange}
                    />
                )
            }
        </Box>
    );
};

export default memo(Table);
