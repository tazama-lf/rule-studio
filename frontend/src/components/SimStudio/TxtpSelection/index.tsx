import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkIcon from "@mui/icons-material/Link";
import { useEffect, useState, memo, type MutableRefObject } from "react";
import {
    Box,
    CircularProgress,
    Collapse,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Table as MuiTable,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import Button from "../../Button";
import DropDown from "../../DropDown";
import { Text } from "../../Text";
import useTxtpSelectionController, {
    type FieldAction,
    type FieldConfig,
    type TxtpEntry,
} from "../../../hooks/SimStudio/useTxtpSelectionController";
import { useGetFakerSemanticDataQuery } from "../../../redux/Api/SimStudio";
import * as S from "./TxtpSelection.styles";
import FieldMappingModal from "./FieldMappingModal";

interface FieldConfigTableProps {
    entry: TxtpEntry;
    onFieldConfigChange: (entryId: string, path: string, config: FieldConfig) => void;
    semanticOptions: { id: string; name: string }[];
}

interface EntryAccordionProps {
    entry: TxtpEntry;
    canRemove?: boolean;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onNumMessagesChange: (id: string, value: number) => void;
    onFieldConfigChange: (entryId: string, path: string, config: FieldConfig) => void;
    semanticOptions: { id: string; name: string }[];
}

interface LinkedPairContainerProps {
    primary: TxtpEntry;
    related: TxtpEntry;
    isPrimaryFirst: boolean;
    onToggle: (id: string) => void;
    onRemovePair: (primaryId: string, relatedId: string) => void;
    onAddMapping: (primaryId: string, relatedId: string) => void;
    onNumMessagesChange: (id: string, value: number) => void;
    onFieldConfigChange: (entryId: string, path: string, config: FieldConfig) => void;
    semanticOptions: { id: string; name: string }[];
}

const FIELD_ACTION_OPTIONS: { label: string; value: FieldAction }[] = [
    { label: "Use Sample Value", value: "sample" },
    { label: "Set Static Value", value: "static" },
    { label: "Use Range", value: "range" },
    { label: "Skip Field", value: "skip" },
    { label: "Random", value: "random" },
];

const FieldConfigTable = memo(({ entry, onFieldConfigChange, semanticOptions }: FieldConfigTableProps) => {
    const getConfig = (path: string): FieldConfig =>
        entry.fieldConfigs[path] ?? { action: "sample", staticValue: "", rangeStart: "", rangeEnd: "", semanticId: "" };

    return (
        <S.FieldConfigSection>
            <S.FieldConfigHeader>
                <S.FieldConfigTitle>
                    Field Configuration for {entry.txtp}
                </S.FieldConfigTitle>
                <S.FieldConfigSubtitle>
                    Configure only the fields relevant to the rule. Unconfigured fields may
                    keep sample values or defaults.
                </S.FieldConfigSubtitle>
            </S.FieldConfigHeader>

            <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 340, overflowY: "auto" }}
            >
                <MuiTable stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    bgcolor: "#fbf9fa",
                                    width: "30%",
                                }}
                            >
                                Field Name
                            </TableCell>
                            <TableCell
                                sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "18%" }}
                            >
                                Action
                            </TableCell>
                            <TableCell
                                sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "22%" }}
                            >
                                Static Value
                            </TableCell>
                            <TableCell
                                sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa" }}
                            >
                                Range
                            </TableCell>
                            <TableCell
                                sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "18%" }}
                            >
                                Semantics
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entry.fieldPaths.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#9ca3af" }}>
                                    No fields available from payload
                                </TableCell>
                            </TableRow>
                        ) : (
                            entry.fieldPaths.map((path) => {
                                const config = getConfig(path);
                                return (
                                    <TableRow key={path} hover>
                                        <TableCell
                                            sx={{
                                                fontSize: "12px",
                                                color: "#2563eb",
                                                fontFamily: "monospace",
                                                borderBottom: "1px solid #e0e0e0",
                                                maxWidth: 0,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <Tooltip title={path} placement="top-start">
                                                <span
                                                    style={{
                                                        display: "block",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {path}
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                            <Select
                                                value={config.action}
                                                size="small"
                                                onChange={(e) => {
                                                    const newAction = e.target.value as FieldAction;
                                                    onFieldConfigChange(entry.id, path, {
                                                        action: newAction,
                                                        staticValue: newAction === "static" ? config.staticValue : "",
                                                        rangeStart: newAction === "range" ? config.rangeStart : "",
                                                        rangeEnd: newAction === "range" ? config.rangeEnd : "",
                                                        semanticId: newAction === "random" ? config.semanticId : "",
                                                    });
                                                }}
                                                sx={{
                                                    fontSize: "12px",
                                                    minWidth: 160,
                                                    "& .MuiSelect-select": { py: "4px" },
                                                }}
                                            >
                                                {FIELD_ACTION_OPTIONS.map((opt) => (
                                                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "12px" }}>
                                                        {opt.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                            {config.action === "static" ? (
                                                <TextField
                                                    size="small"
                                                    value={config.staticValue}
                                                    placeholder="Enter value"
                                                    onChange={(e) =>
                                                        onFieldConfigChange(entry.id, path, {
                                                            ...config,
                                                            staticValue: e.target.value,
                                                        })
                                                    }
                                                    sx={{ width: "100%", "& input": { fontSize: "12px", py: "4px" } }}
                                                />
                                            ) : (
                                                <Typography sx={{ fontSize: "12px", color: "#d1d5db" }}>—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                            {config.action === "range" ? (
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <TextField
                                                        size="small"
                                                        value={config.rangeStart}
                                                        placeholder="Start"
                                                        onChange={(e) =>
                                                            onFieldConfigChange(entry.id, path, {
                                                                ...config,
                                                                rangeStart: e.target.value,
                                                            })
                                                        }
                                                        sx={{ width: 90, "& input": { fontSize: "12px", py: "4px" } }}
                                                    />
                                                    <Typography sx={{ fontSize: "12px", color: "#9ca3af", px: 0.25 }}>–</Typography>
                                                    <TextField
                                                        size="small"
                                                        value={config.rangeEnd}
                                                        placeholder="End"
                                                        onChange={(e) =>
                                                            onFieldConfigChange(entry.id, path, {
                                                                ...config,
                                                                rangeEnd: e.target.value,
                                                            })
                                                        }
                                                        sx={{ width: 90, "& input": { fontSize: "12px", py: "4px" } }}
                                                    />
                                                </Box>
                                            ) : (
                                                <Typography sx={{ fontSize: "12px", color: "#d1d5db" }}>—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                                            <Select
                                                value={config.semanticId ?? ""}
                                                size="small"
                                                displayEmpty
                                                disabled={config.action !== "random"}
                                                onChange={(e) =>
                                                    onFieldConfigChange(entry.id, path, {
                                                        ...config,
                                                        semanticId: e.target.value,
                                                    })
                                                }
                                                sx={{ fontSize: "12px", minWidth: 140, "& .MuiSelect-select": { py: "4px" } }}
                                            >
                                                <MenuItem value="" sx={{ fontSize: "12px", color: "#9ca3af" }}>None</MenuItem>
                                                {semanticOptions.map((opt) => (
                                                    <MenuItem key={opt.id} value={opt.id} sx={{ fontSize: "12px" }}>
                                                        {opt.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </MuiTable>
            </TableContainer>
        </S.FieldConfigSection>
    );
});

const EntryAccordion = memo(({
    entry,

    canRemove = true,
    onToggle,
    onRemove,
    onNumMessagesChange,
    onFieldConfigChange,
    semanticOptions,
}: EntryAccordionProps) => (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
        <Box display="flex" alignItems="center" px={1.5} py={1} gap={1.5}>
            <IconButton size="small" onClick={() => onToggle(entry.id)}>
                {entry.expanded ? (
                    <ExpandMoreIcon sx={{ fontSize: 16 }} />
                ) : (
                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                )}
            </IconButton>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {entry.txtp}
            </Typography>

            <Typography sx={{ fontSize: 12, color: "#6b7280" }}>v{entry.version}</Typography>
            <Box flex={1} />
            <Box display="flex" alignItems="center" gap={1}>
                <Typography sx={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Messages:</Typography>
                <TextField
                    type="text"
                    inputMode="numeric"
                    size="small"
                    value={entry.numMessages || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) {
                            onNumMessagesChange(entry.id, val === "" ? 0 : Number(val));
                        }
                    }}
                    sx={{ width: 90, "& .MuiOutlinedInput-root": { height: "30px", fontSize: "13px" } }}
                />
            </Box>
            {canRemove && (
                <S.RemoveText onClick={() => onRemove(entry.id)}>Remove</S.RemoveText>
            )}
        </Box>
        <Collapse in={entry.expanded} timeout={150}>
            <Box sx={{ borderTop: "1px solid #e5e7eb" }}>
                <FieldConfigTable
                    entry={entry}
                    onFieldConfigChange={onFieldConfigChange}
                    semanticOptions={semanticOptions}
                />
            </Box>
        </Collapse>
    </Box>
));

const LinkedPairContainer = ({
    primary,
    related,
    onToggle,
    onRemovePair,
    onAddMapping,
    onNumMessagesChange,
    onFieldConfigChange,
    semanticOptions,
}: LinkedPairContainerProps) => (
    <Box sx={{ border: "2px solid #bfdbfe", borderRadius: 1.5, overflow: "hidden" }}>
        <Box
            sx={{
                bgcolor: "#eff6ff",
                px: 2,
                py: 0.75,
                borderBottom: "1px solid #dbeafe",
                display: "flex",
                alignItems: "center",
                gap: 1,
            }}
        >
            <LinkIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8" }}>
                Linked Transaction Pair
            </Typography>
            <Box flex={1} />
            <S.AddMappingText onClick={() => onAddMapping(primary.id, related.id)}>Add Mapping</S.AddMappingText>
            <S.RemoveText onClick={() => onRemovePair(primary.id, related.id)}>Remove</S.RemoveText>
        </Box>
        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
            <EntryAccordion
                entry={primary}
                canRemove={false}
                onToggle={onToggle}
                onRemove={() => {}}
                onNumMessagesChange={onNumMessagesChange}
                onFieldConfigChange={onFieldConfigChange}
                semanticOptions={semanticOptions}
            />
            <EntryAccordion
                entry={related}
                canRemove={false}
                onToggle={onToggle}
                onRemove={() => {}}
                onNumMessagesChange={onNumMessagesChange}
                onFieldConfigChange={onFieldConfigChange}
                semanticOptions={semanticOptions}
            />
        </Box>
    </Box>
);

interface TxtpSelectionProps {
    onSaveRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}

const TxtpSelection = ({ onSaveRef }: TxtpSelectionProps) => {
    const { values, functions } = useTxtpSelectionController();
    const { data: semanticData } = useGetFakerSemanticDataQuery();
    const semanticOptions = semanticData?.data ?? [];

    const [mappingModal, setMappingModal] = useState<{
        primaryId: string;
        relatedId: string;
        primaryConfigId: number;
        relatedConfigId: number;
    } | null>(null);

    const handleOpenMapping = (primaryId: string, relatedId: string) => {
        const primaryEntry = entries.find((e) => e.id === primaryId);
        const relatedEntry = entries.find((e) => e.id === relatedId);
        if (!primaryEntry?.contextConfigId || !relatedEntry?.contextConfigId) return;
        setMappingModal({
            primaryId,
            relatedId,
            primaryConfigId: primaryEntry.contextConfigId,
            relatedConfigId: relatedEntry.contextConfigId,
        });
    };

    const handleCloseMappingModal = () => {
        setMappingModal(null);
    };

    const {
        entries,
        txTypeOptions,
        addTxtp,
        addVersion,
        addVersionOptions,
        addVersionsLoading,
        numMessages,
        adding,
        isLoading,
    } = values;

    const {
        handleTxtpChange,
        setAddVersion,
        setNumMessages,
        handleAdd,
        handleRemove,
        handleRemovePair,
        handleToggleExpand,
        handleNumMessagesChange,
        handleFieldConfigChange,
        saveStep2ToDb,
    } = functions;

    useEffect(() => {
        if (onSaveRef) onSaveRef.current = saveStep2ToDb;
        return () => { if (onSaveRef) onSaveRef.current = null; };
    }, [onSaveRef, saveStep2ToDb]);

    const primaryEntries = entries.filter((e) => !e.relatedTxtpConfigId);
    const relatedEntries = entries.filter((e) => e.relatedTxtpConfigId != null);
    const entryPairs = primaryEntries.map((primary, idx) => ({
        primary,
        isFirstPrimary: idx === 0,
        related: relatedEntries.find((r) => r.relatedTxtpConfigId === primary.contextConfigId),
    }));

    const modalPrimary = mappingModal ? entries.find((e) => e.id === mappingModal.primaryId) : undefined;
    const modalRelated = mappingModal ? entries.find((e) => e.id === mappingModal.relatedId) : undefined;

    return (
        <Box>
            <S.InfoBanner>
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3b82f6", flexShrink: 0, mt: "1px" }} />
                <Text size="sub" sx={{ color: "#1e40af", lineHeight: 1.6 }}>
                    TXTP schemas, sample payloads, and mapping configurations are used to generate
                    valid synthetic messages.
                </Text>
            </S.InfoBanner>
            <S.AddFormCard>
                <Box flex="1" minWidth={160}>
                    <S.FieldLabel>TXTP Type</S.FieldLabel>
                    <DropDown
                        value={addTxtp}
                        onChange={(value) => handleTxtpChange(value as typeof addTxtp)}
                        options={txTypeOptions}
                        placeholder="Select type"
                        searchable
                    />
                </Box>

                <Box flex="1" minWidth={140}>
                    <S.FieldLabel>Version</S.FieldLabel>
                    <DropDown
                        value={addVersion}
                        onChange={(value) => setAddVersion(value as typeof addVersion)}
                        options={addVersionOptions}
                        placeholder="Select version"
                        disabled={!addTxtp || addVersionsLoading}
                    />
                </Box>

                <Box minWidth={140}>
                    <S.FieldLabel>No. of Messages</S.FieldLabel>
                    <TextField
                        type="text"
                        inputMode="numeric"
                        size="small"
                        value={numMessages || ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d+$/.test(val)) {
                                setNumMessages(val === "" ? 0 : Number(val));
                            }
                        }}
                        sx={{
                            width: "100%",
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "6px",
                                fontSize: "14px",
                                height: "38px",
                            },
                        }}
                    />
                </Box>

                <Box flexShrink={0}>
                    <Button
                        height="38px"
                        type="secondary"
                        size="md"
                        text="Add TXTP"
                        loading={adding}
                        onClick={handleAdd}
                    />
                </Box>
            </S.AddFormCard>
            <Paper variant="outlined">
                {isLoading ? (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                        <CircularProgress size={22} />
                        <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Loading TXTP configurations…</Typography>
                    </Box>
                ) : entries.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: "center", color: "#9ca3af" }}>
                        No TXTPs added yet. Click <strong>Add TXTP</strong> to create one.
                    </Box>
                ) : (
                    <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {entryPairs.map((pair) =>
                            pair.related ? (
                                <LinkedPairContainer
                                    key={pair.primary.id}
                                    primary={pair.primary}
                                    related={pair.related}
                                    isPrimaryFirst={pair.isFirstPrimary}
                                    onToggle={handleToggleExpand}
                                    onRemovePair={handleRemovePair}
                                    onAddMapping={handleOpenMapping}
                                    onNumMessagesChange={handleNumMessagesChange}
                                    onFieldConfigChange={handleFieldConfigChange}
                                    semanticOptions={semanticOptions}
                                />
                            ) : (
                                <EntryAccordion
                                    key={pair.primary.id}
                                    entry={pair.primary}
                                    onToggle={handleToggleExpand}
                                    onRemove={handleRemove}
                                    onNumMessagesChange={handleNumMessagesChange}
                                    onFieldConfigChange={handleFieldConfigChange}
                                    semanticOptions={semanticOptions}
                                />
                            )
                        )}
                    </Box>
                )}
            </Paper>
            {mappingModal && modalPrimary && modalRelated && (
                <FieldMappingModal
                    open
                    onClose={handleCloseMappingModal}
                    primary={{ txtp: modalPrimary.txtp, version: modalPrimary.version, fields: modalPrimary.fieldPaths }}
                    related={{ txtp: modalRelated.txtp, version: modalRelated.version, fields: modalRelated.fieldPaths }}
                    primaryConfigId={mappingModal.primaryConfigId}
                    relatedConfigId={mappingModal.relatedConfigId}
                    mappingType="context"
                />
            )}
        </Box>
    );
};

export default TxtpSelection;
