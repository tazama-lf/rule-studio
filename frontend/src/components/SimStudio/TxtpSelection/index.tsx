import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEffect, type MutableRefObject } from "react";
import {
    Box,
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

interface FieldConfigTableProps {
    entry: TxtpEntry;
    onFieldConfigChange: (entryId: string, path: string, config: FieldConfig) => void;
    semanticOptions: { id: string; name: string }[];
}

interface EntryRowProps {
    entry: TxtpEntry;
    index: number;
    isPrimary: boolean;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onNumMessagesChange: (id: string, value: number) => void;
    onFieldConfigChange: (entryId: string, path: string, config: FieldConfig) => void;
    semanticOptions: { id: string; name: string }[];
}

const FIELD_ACTION_OPTIONS: { label: string; value: FieldAction }[] = [
    { label: "Use Sample Value", value: "sample" },
    { label: "Set Static Value", value: "static" },
    { label: "Use Range", value: "range" },
    { label: "Skip Field", value: "skip" },
];

const FieldConfigTable = ({ entry, onFieldConfigChange, semanticOptions }: FieldConfigTableProps) => {
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
                                                        semanticId: config.semanticId,
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
};

const EntryRow = ({
    entry,
    index,
    isPrimary,
    onToggle,
    onRemove,
    onNumMessagesChange,
    onFieldConfigChange,
    semanticOptions,
}: EntryRowProps) => (
    <>
        <TableRow hover sx={{ bgcolor: "#fff" }}>
            <TableCell sx={{ width: 48, borderBottom: "1px solid #e0e0e0", pr: 0 }}>
                <IconButton size="small" onClick={() => onToggle(entry.id)}>
                    {entry.expanded ? (
                        <ExpandMoreIcon sx={{ fontSize: 16 }} />
                    ) : (
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                    )}
                </IconButton>
            </TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: "13px", borderBottom: "1px solid #e0e0e0" }}>
                {index + 1}
            </TableCell>
            <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                <Box display="flex" alignItems="center">
                    <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{entry.txtp}</Typography>
                    {isPrimary && <S.PrimaryBadge>Primary</S.PrimaryBadge>}
                </Box>
            </TableCell>
            <TableCell sx={{ fontSize: "13px", borderBottom: "1px solid #e0e0e0" }}>
                {entry.version}
            </TableCell>
            <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
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
                    sx={{
                        width: 130,
                        "& .MuiOutlinedInput-root": { height: "34px", fontSize: "13px" },
                    }}
                />
            </TableCell>
            <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                <S.RemoveText onClick={() => onRemove(entry.id)}>Remove</S.RemoveText>
            </TableCell>
        </TableRow>

        <TableRow>
            <TableCell colSpan={6} sx={{ p: 0, borderBottom: entry.expanded ? "1px solid #e0e0e0" : "none" }}>
                <Collapse in={entry.expanded} timeout="auto" unmountOnExit>
                    <FieldConfigTable
                        entry={entry}
                        onFieldConfigChange={onFieldConfigChange}
                        semanticOptions={semanticOptions}
                    />
                </Collapse>
            </TableCell>
        </TableRow>
    </>
);

interface TxtpSelectionProps {
    onSaveRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}

const TxtpSelection = ({ onSaveRef }: TxtpSelectionProps) => {
    const { values, functions } = useTxtpSelectionController();
    const { data: semanticData } = useGetFakerSemanticDataQuery();
    const semanticOptions = semanticData?.data ?? [];

    const {
        entries,
        txTypeOptions,
        addTxtp,
        addVersion,
        addVersionOptions,
        addVersionsLoading,
        numMessages,
        adding,
    } = values;

    const {
        handleTxtpChange,
        setAddVersion,
        setNumMessages,
        handleAdd,
        handleRemove,
        handleToggleExpand,
        handleNumMessagesChange,
        handleFieldConfigChange,
        saveStep2ToDb,
    } = functions;

    // Register save fn with parent wizard so Next Step can call it
    useEffect(() => {
        if (onSaveRef) onSaveRef.current = saveStep2ToDb;
        return () => { if (onSaveRef) onSaveRef.current = null; };
    }, [onSaveRef, saveStep2ToDb]);

    return (
        <Box>
            <S.InfoBanner>
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3b82f6", flexShrink: 0, mt: "1px" }} />
                <Text size="sub" sx={{ color: "#1e40af", lineHeight: 1.6 }}>
                    TXTP schemas, sample payloads, and mapping configurations are used to generate
                    valid synthetic messages. The first TXTP in the list is marked as{" "}
                    <strong>Primary</strong>, meaning it will act as the root trigger message for
                    the simulation transaction.
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
            <TableContainer component={Paper} variant="outlined">
                <MuiTable>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 48, bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px", pr: 0 }} />
                            <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>
                                Order
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>
                                TXTP
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>
                                Version
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>
                                No. of Messages
                            </TableCell>
                            <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#9ca3af" }}>
                                    No TXTPs added yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry, idx) => (
                                <EntryRow
                                    key={entry.id}
                                    entry={entry}
                                    index={idx}
                                    isPrimary={idx === 0}
                                    onToggle={handleToggleExpand}
                                    onRemove={handleRemove}
                                    onNumMessagesChange={handleNumMessagesChange}
                                    onFieldConfigChange={handleFieldConfigChange}
                                    semanticOptions={semanticOptions}
                                />
                            ))
                        )}
                    </TableBody>
                </MuiTable>
            </TableContainer>
        </Box>
    );
};

export default TxtpSelection;
