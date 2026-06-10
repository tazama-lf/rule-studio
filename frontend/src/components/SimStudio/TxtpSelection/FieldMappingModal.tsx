import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    CircularProgress,
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
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import {
    useLazyGetContextMappingQuery,
    useSaveContextMappingMutation,
    useLazyGetTriggerMappingQuery,
    useSaveTriggerMappingMutation,
} from "../../../redux/Api/SimStudio";

export interface FieldMapping {
    source: string;
    target: string;
}

export interface MappingEntry {
    txtp: string;
    version: string;
    fields: string[];
}

interface FieldMappingModalProps {
    open: boolean;
    onClose: () => void;
    primary: MappingEntry;
    related: MappingEntry;
    primaryConfigId: number;
    relatedConfigId: number;
    mappingType: "context" | "trigger";
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
                {label && (
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {label}
                    </Typography>
                )}
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
    primaryConfigId,
    relatedConfigId,
    mappingType,
}: FieldMappingModalProps) => {
    const [sourceSearch, setSourceSearch] = useState("");
    const [targetSearch, setTargetSearch] = useState("");
    const [pendingSource, setPendingSource] = useState<string | null>(null);
    const [existingMappings, setExistingMappings] = useState<FieldMapping[]>([]);
    const [newMappings, setNewMappings] = useState<FieldMapping[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const [fetchContextMapping] = useLazyGetContextMappingQuery();
    const [fetchTriggerMapping] = useLazyGetTriggerMappingQuery();
    const [saveContextMapping, { isLoading: isSavingContext }] = useSaveContextMappingMutation();
    const [saveTriggerMapping, { isLoading: isSavingTrigger }] = useSaveTriggerMappingMutation();
    const isSaving = isSavingContext || isSavingTrigger;

    // Load existing mappings when modal opens
    useEffect(() => {
        if (!open || !primaryConfigId || !relatedConfigId) return;
        setIsFetching(true);
        setExistingMappings([]);
        setNewMappings([]);
        setPendingSource(null);
        const fetchFn = mappingType === "context" ? fetchContextMapping : fetchTriggerMapping;
        void fetchFn({ primaryId: primaryConfigId, relatedId: relatedConfigId })
            .then((res) => {                // data is an array of mapping records — flatten all mapping pairs
                const existing = (res.data?.data ?? []).flatMap((record) => record.mapping);
                setExistingMappings(existing.map((m) => ({ source: m.primary, target: m.related })));
            })
            .catch(() => {
                // Non-blocking – start fresh if fetch fails
            })
            .finally(() => setIsFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, primaryConfigId, relatedConfigId, mappingType]);

    const handleSave = async () => {
        if (newMappings.length === 0) return;
        try {
            const saveFn = mappingType === "context" ? saveContextMapping : saveTriggerMapping;
            await saveFn({
                primary_txtp_id: primaryConfigId,
                related_txtp_id: relatedConfigId,
                mapping: newMappings.map((m) => ({ primary: m.source, related: m.target })),
            }).unwrap();
            toast.success("Mappings saved");
            onClose();
        } catch {
            toast.error("Failed to save mappings");
        }
    };

    const sourceMappedFields = useMemo(
        () => new Set([...existingMappings, ...newMappings].map((m) => m.source)),
        [existingMappings, newMappings]
    );
    const targetMappedFields = useMemo(
        () => new Set([...existingMappings, ...newMappings].map((m) => m.target)),
        [existingMappings, newMappings]
    );
    const allMappings = useMemo(() => [...existingMappings, ...newMappings], [existingMappings, newMappings]);

    const handleSourceSelect = (field: string) => {
        setPendingSource((prev) => (prev === field ? null : field));
    };

    const handleTargetSelect = (field: string) => {
        if (!pendingSource) return;
        const alreadyExists = allMappings.some(
            (m) => m.source === pendingSource && m.target === field
        );
        if (!alreadyExists) {
            setNewMappings((prev) => [...prev, { source: pendingSource, target: field }]);
        }
        setPendingSource(null);
    };

    const handleRemoveMapping = (index: number) => {
        setNewMappings((prev) => prev.filter((_, i) => i !== index));
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
                {/* Fetch loader */}
                {isFetching ? (
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
                        <CircularProgress size={28} />
                        <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Loading existing mappings…</Typography>
                    </Box>
                ) : (
                    <>
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
                        <strong>How to map:</strong> Click a field in the left panel, then click the corresponding field in the right panel to create a mapping pair.
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
                    <Box sx={{ flex: 1, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <FieldList
                            label=""
                            txtp={primary.txtp}
                            version={primary.version}
                            fields={primary.fields}
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
                                {existingMappings.length} existing · {newMappings.length} new
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
                            {allMappings.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: "center" }}>
                                    <Typography sx={{ fontSize: 12, color: "#d1d5db", mb: 1 }}>No mappings yet</Typography>
                                    <Typography sx={{ fontSize: 11, color: "#e5e7eb" }}>
                                        Select fields from both panels
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    {existingMappings.map((mapping, idx) => (
                                        <Box
                                            key={`existing-${idx}`}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                mb: 0.75,
                                                p: 1,
                                                borderRadius: 1,
                                                border: "1px solid #e5e7eb",
                                                bgcolor: "#f9fafb",
                                                opacity: 0.7,
                                            }}
                                        >
                                            <Tooltip title={mapping.source}>
                                                <Typography sx={{ fontSize: "11px", fontFamily: "monospace", color: "#2563eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                                                    {mapping.source}
                                                </Typography>
                                            </Tooltip>
                                            <ArrowForwardIcon sx={{ fontSize: 13, color: "#9ca3af", flexShrink: 0 }} />
                                            <Tooltip title={mapping.target}>
                                                <Typography sx={{ fontSize: "11px", fontFamily: "monospace", color: "#7c3aed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                                                    {mapping.target}
                                                </Typography>
                                            </Tooltip>
                                        </Box>
                                    ))}
                                    {newMappings.map((mapping, idx) => (
                                        <Box
                                            key={`new-${idx}`}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                mb: 0.75,
                                                p: 1,
                                                borderRadius: 1,
                                                border: "1px solid #bbf7d0",
                                                bgcolor: "#f0fdf4",
                                                "&:hover": { bgcolor: "#dcfce7", "& .remove-btn": { opacity: 1 } },
                                            }}
                                        >
                                            <Tooltip title={mapping.source}>
                                                <Typography sx={{ fontSize: "11px", fontFamily: "monospace", color: "#2563eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                                                    {mapping.source}
                                                </Typography>
                                            </Tooltip>
                                            <ArrowForwardIcon sx={{ fontSize: 13, color: "#9ca3af", flexShrink: 0 }} />
                                            <Tooltip title={mapping.target}>
                                                <Typography sx={{ fontSize: "11px", fontFamily: "monospace", color: "#7c3aed", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
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
                                    ))}
                                </>
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
                            label=""
                            txtp={related.txtp}
                            version={related.version}
                            fields={related.fields}
                            searchQuery={targetSearch}
                            onSearchChange={setTargetSearch}
                            selected={null}
                            mappedFields={targetMappedFields}
                            onSelect={handleTargetSelect}
                            side="target"
                        />
                    </Box>
                </Box>
                    </>
                )}
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
                    {newMappings.length} new mapping{newMappings.length !== 1 ? "s" : ""} to save
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
                        onClick={() => { void handleSave(); }}
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
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            "&:hover": { background: "#1d4ed8" },
                            "&:disabled": { background: "#93c5fd", borderColor: "#93c5fd", cursor: "not-allowed" },
                        }}
                        disabled={newMappings.length === 0 || isSaving || isFetching}
                    >
                        {isSaving && <CircularProgress size={12} sx={{ color: "#fff" }} />}
                        Save Mappings
                    </Box>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default FieldMappingModal;
