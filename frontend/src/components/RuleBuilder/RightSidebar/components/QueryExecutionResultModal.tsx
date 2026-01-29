import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

interface QueryExecutionResultModalProps {
  open: boolean;
  onClose: () => void;
  results: Record<string, unknown>[] | null;
  totalCount?: number;
  displayCount?: number;
  error?: string | null;
}

interface CellValueProps {
  value: unknown;
  columnKey: string;
  rowIndex: number;
}

const CellValue: React.FC<CellValueProps> = ({ value, columnKey, rowIndex }) => {
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const stringValue = useMemo(() => {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }
    return String(value);
  }, [value]);

  const isLongValue = stringValue.length > 50;
  const cellId = `${rowIndex}-${columnKey}`;
  const isExpanded = expandedCell === cellId;

  const handleToggleExpand = () => {
    setExpandedCell(isExpanded ? null : cellId);
  };

  if (value === null || value === undefined) {
    return (
      <Typography variant="body2" color="text.disabled" fontStyle="italic">
        NULL
      </Typography>
    );
  }

  if (!isLongValue) {
    return <Typography variant="body2">{stringValue}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
      <Tooltip title={isExpanded ? 'Click to collapse' : 'Click to expand full value'} arrow>
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: isExpanded ? 'unset' : 'ellipsis',
            whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
            wordBreak: isExpanded ? 'break-word' : 'normal',
          }}
        >
          <Typography variant="body2" component="span">
            {stringValue}
          </Typography>
        </Box>
      </Tooltip>
      <Tooltip title={isExpanded ? 'Collapse' : 'Expand'} arrow>
        <IconButton
          size="small"
          onClick={handleToggleExpand}
          sx={{
            padding: '2px',
            minWidth: 'unset',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <UnfoldMoreIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const QueryExecutionResultModal: React.FC<QueryExecutionResultModalProps> = ({
  open,
  onClose,
  results,
  totalCount,
  displayCount,
  error,
}) => {

  const hasMoreData = useMemo(
    () => Boolean(totalCount && displayCount && totalCount > displayCount),
    [totalCount, displayCount]
  );

  const columns = useMemo(
    () => (results && results.length > 0 ? Object.keys(results[0]) : []),
    [results]
  );

  const hasResults = Boolean(results && results.length > 0);
  const rowCount = results?.length ?? 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          <Typography variant="h6" component="div">
            Query Execution Results
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : hasResults && results ? (
          <>
            {hasMoreData && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Showing {displayCount} of {totalCount} total records. This is a preview to help verify your query.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip 
                label={`${rowCount} ${rowCount === 1 ? 'row' : 'rows'}`} 
                color="primary" 
                size="small" 
              />
              <Chip 
                label={`${columns.length} ${columns.length === 1 ? 'column' : 'columns'}`} 
                color="secondary" 
                size="small" 
              />
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(80vh - 220px)' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          fontWeight: 'bold',
                          backgroundColor: 'primary.main',
                          color: 'white',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'action.hover',
                        },
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={`${rowIndex}-${column}`}
                          sx={{
                            maxWidth: '400px',
                            verticalAlign: 'top',
                            py: 1,
                          }}
                        >
                          <CellValue value={row[column]} columnKey={column} rowIndex={rowIndex} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Alert severity="info">
            Query executed successfully but returned no results.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QueryExecutionResultModal;
