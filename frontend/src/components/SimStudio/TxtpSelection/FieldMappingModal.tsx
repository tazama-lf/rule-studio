import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { useState, useMemo } from "react";
import type { TxtpEntry } from "../../../hooks/SimStudio/useTxtpSelectionController";

export interface FieldMapping {
    source: string;
    target: string;
}

interface FieldMappingModalProps {
    open: boolean;
    onClose: () => void;
    primary: TxtpEntry;
    related: TxtpEntry;
    mappings: FieldMapping[];
    onMappingsChange: (mappings: FieldMapping[]) => void;
}

interface FieldListProps {
    label: string;
    txtp: string;
    version: string;
    fields: string[];
    searchQuery: string;
    onSearchChange: (v: string) => void;
    selected: string | null;
    mappedFields: Set<string>;
    onSelect: (field: string) => void;
    side: "source" | "target";
}

const FieldList = ({
    label,
    txtp,
    version,
    fields,
    searchQuery,
    onSearchChange,
    selected,
    mappedFields,
    onSelect,
    side,
}: FieldListProps) => {
    const filtered = useMemo(
        () => fields.filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase())),
        [fields, searchQuery]
    );

    const accentColor = side === "source" ? "#2563eb" : "#7c3aed";
    const selectedBg = side === "source" ? "#eff6ff" : "#f5f3ff";
    const selectedBorder = side === "source" ? "#bfdbfe" : "#ddd6fe";
    const mappedColor = side === "source" ? "#93c5fd" : "#c4b5fd";

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
            <Box
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #e5e7eb",
                    bgcolor: side === "source" ? "#eff6ff" : "#f5f3ff",
                }}
            >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", mt: 0.25 }}>
                    {txtp}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#6b7280" }}>v{version}</Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid #f3f4f6" }}>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search fields..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                            </InputAdornment>
                        ),
                        sx: { fontSize: "12px", "& input": { py: "5px" } },
                    }}
                />
            </Box>
            <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
                {filtered.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: "#9ca3af", textAlign: "center", py: 3 }}>
                        {fields.length === 0 ? "No fields available (payload not loaded)" : "No matching fields"}
                    </Typography>
                ) : (
                    filtered.map((field) => {
                        const isSelected = selected === field;
                        const isMapped = mappedFields.has(field);
                        return (
                            <Tooltip key={field} title={field} placement={side === "source" ? "right" : "left"}>
                                <Box
                                    onClick={() => onSelect(field)}
                                    sx={{
                                        px: 1.5,
                                        py: 0.75,
                                        mb: 0.5,
                                        borderRadius: 1,
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontFamily: "monospace",
                                        border: "1px solid",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        transition: "all 0.12s",
                                        ...(isSelected
                                            ? {
                                                  bgcolor: selectedBg,
                                                  borderColor: accentColor,
                                                  color: accentColor,
                                                  fontWeight: 700,
                                              }
                                            : isMapped
                                            ? {
                                                  bgcolor: "#f9fafb",
                                                  borderColor: mappedColor,
                                                  color: mappedColor,
                                              }
                                            : {
                                                  bgcolor: "#fff",
                                                  borderColor: "#e5e7eb",
                                                  color: "#374151",
                                                  "&:hover": {
                                                      bgcolor: selectedBg,
                                                      borderColor: selectedBorder,
                                                  },
                                              }),
                                    }}
                                >
                                    {field}
                                </Box>
                            </Tooltip>
                        );
                    })
                )}
            </Box>
            <Box sx={{ px: 2, py: 1, borderTop: "1px solid #f3f4f6", bgcolor: "#fafafa" }}>
                <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                    {selected
                        ? `Selected: ${selected}`
                        : side === "source"
                        ? "Click a field to start mapping"
                        : "Click a field to complete mapping"}
                </Typography>
            </Box>
        </Box>
    );
};

const FieldMappingModal = ({
    open,
    onClose,
    primary,
    related,
    mappings,
    onMappingsChange,
}: FieldMappingModalProps) => {
    const [sourceSearch, setSourceSearch] = useState("");
    const [targetSearch, setTargetSearch] = useState("");
    const [pendingSource, setPendingSource] = useState<string | null>(null);

    const sourceMappedFields = useMemo(() => new Set(mappings.map((m) => m.source)), [mappings]);
    const targetMappedFields = useMemo(() => new Set(mappings.map((m) => m.target)), [mappings]);

    const handleSourceSelect = (field: string) => {
        setPendingSource((prev) => (prev === field ? null : field));
    };

    const handleTargetSelect = (field: string) => {
        if (!pendingSource) return;
        const alreadyExists = mappings.some(
            (m) => m.source === pendingSource && m.target === field
        );
        if (!alreadyExists) {
            onMappingsChange([...mappings, { source: pendingSource, target: field }]);
        }
        setPendingSource(null);
    };

    const handleRemoveMapping = (index: number) => {
        onMappingsChange(mappings.filter((_, i) => i !== index));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { height: "80vh", maxHeight: 700, borderRadius: 2, overflow: "hidden" } }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 1.5,
                    px: 2.5,
                    borderBottom: "1px solid #e5e7eb",
                    bgcolor: "#fff",
                }}
            >
                <ArrowForwardIcon sx={{ fontSize: 18, color: "#6b7280" }} />
                <Box flex={1}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                        Field Mapping
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                        {primary.txtp} v{primary.version} → {related.txtp} v{related.version}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Instruction banner */}
                <Box
                    sx={{
                        px: 2.5,
                        py: 1,
                        bgcolor: "#fffbeb",
                        borderBottom: "1px solid #fde68a",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography sx={{ fontSize: 12, color: "#92400e" }}>
                        <strong>How to map:</strong> Click a field in the <strong>Primary</strong> panel, then click the corresponding field in the <strong>Related</strong> panel to create a mapping pair.
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
                    <Box sx={{ flex: 1, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <FieldList
                            label="Primary"
                            txtp={primary.txtp}
                            version={primary.version}
                            fields={primary.fieldPaths}
                            searchQuery={sourceSearch}
                            onSearchChange={setSourceSearch}
                            selected={pendingSource}
                            mappedFields={sourceMappedFields}
                            onSelect={handleSourceSelect}
                            side="source"
                        />
                    </Box>
                    <Box
                        sx={{
                            width: 280,
                            flexShrink: 0,
                            borderRight: "1px solid #e5e7eb",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <Box
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderBottom: "1px solid #e5e7eb",
                                bgcolor: "#f9fafb",
                            }}
                        >
                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Mapped Pairs
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.25 }}>
                                {mappings.length} mapping{mappings.length !== 1 ? "s" : ""}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
                            {mappings.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: "center" }}>
                                    <Typography sx={{ fontSize: 12, color: "#d1d5db", mb: 1 }}>No mappings yet</Typography>
                                    <Typography sx={{ fontSize: 11, color: "#e5e7eb" }}>
                                        Select fields from both panels
                                    </Typography>
                                </Box>
                            ) : (
                                mappings.map((mapping, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            mb: 0.75,
                                            p: 1,
                                            borderRadius: 1,
                                            border: "1px solid #e5e7eb",
                                            bgcolor: "#fff",
                                            "&:hover": { bgcolor: "#fafafa", "& .remove-btn": { opacity: 1 } },
                                        }}
                                    >
                                        <Tooltip title={mapping.source}>
                                            <Typography
                                                sx={{
                                                    fontSize: "11px",
                                                    fontFamily: "monospace",
                                                    color: "#2563eb",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                {mapping.source}
                                            </Typography>
                                        </Tooltip>
                                        <ArrowForwardIcon sx={{ fontSize: 13, color: "#9ca3af", flexShrink: 0 }} />
                                        <Tooltip title={mapping.target}>
                                            <Typography
                                                sx={{
                                                    fontSize: "11px",
                                                    fontFamily: "monospace",
                                                    color: "#7c3aed",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                {mapping.target}
                                            </Typography>
                                        </Tooltip>
                                        <IconButton
                                            className="remove-btn"
                                            size="small"
                                            onClick={() => handleRemoveMapping(idx)}
                                            sx={{ opacity: 0, transition: "opacity 0.12s", flexShrink: 0, p: 0.25 }}
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 14, color: "#ef4444" }} />
                                        </IconButton>
                                    </Box>
                                ))
                            )}
                        </Box>
                        {pendingSource && (
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    borderTop: "1px solid #fde68a",
                                    bgcolor: "#fffbeb",
                                }}
                            >
                                <Typography sx={{ fontSize: 11, color: "#92400e" }}>
                                    <strong>Source selected:</strong> {pendingSource}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: "#b45309" }}>
                                    Now click a field in Related →
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <FieldList
                            label="Related"
                            txtp={related.txtp}
                            version={related.version}
                            fields={related.fieldPaths}
                            searchQuery={targetSearch}
                            onSearchChange={setTargetSearch}
                            selected={null}
                            mappedFields={targetMappedFields}
                            onSelect={handleTargetSelect}
                            side="target"
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 2.5,
                    py: 1.5,
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#fafafa",
                }}
            >
                <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                    {mappings.length} mapping{mappings.length !== 1 ? "s" : ""} configured
                </Typography>
                <Box display="flex" gap={1.5}>
                    <Box
                        component="button"
                        onClick={onClose}
                        sx={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#6b7280",
                            background: "none",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            px: 2,
                            py: 0.75,
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#f3f4f6" },
                        }}
                    >
                        Cancel
                    </Box>
                    <Box
                        component="button"
                        onClick={onClose}
                        sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#fff",
                            background: "#2563eb",
                            border: "1px solid #2563eb",
                            borderRadius: "6px",
                            px: 2,
                            py: 0.75,
                            cursor: "pointer",
                            "&:hover": { background: "#1d4ed8" },
                            "&:disabled": { background: "#93c5fd", borderColor: "#93c5fd", cursor: "not-allowed" },
                        }}
                        disabled={mappings.length === 0}
                    >
                        Save Mappings
                    </Box>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default FieldMappingModal;
