import { type MutableRefObject } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Select,
    Table as MuiTable,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import Button from "../../Button";
import { Text } from "../../Text";
import * as S from "./EnrichmentData.styles";
import useEnrichmentDataController, {
    type SchemaField,
    type SchemaFieldType,
    type GenerationStrategy,
} from "../../../hooks/SimStudio/useEnrichmentDataController";
import { useGetFakerSemanticDataQuery } from "../../../redux/Api/SimStudio";

const FIELD_TYPES: SchemaFieldType[] = ["String", "Number", "Boolean", "Date", "UUID"];
const GENERATION_STRATEGIES: GenerationStrategy[] = ["Sample Value", "Static", "Range", "Auto-generate"];

interface SchemaRowProps {
    field: SchemaField;
    onChange: (id: string, changes: Partial<SchemaField>) => void;
    semanticOptions: { id: string; name: string }[];
}

const SchemaRow = ({ field, onChange, semanticOptions }: SchemaRowProps) => (
    <TableRow hover>
        <TableCell sx={{ maxWidth: 220, borderBottom: "1px solid #e0e0e0" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#2563eb", wordBreak: "break-all" }}>
                {field.fieldName}
            </Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
            <Select
                size="small"
                value={field.type}
                onChange={(e) => onChange(field.id, { type: e.target.value as SchemaFieldType })}
                sx={{ minWidth: 110, fontSize: 13 }}
            >
                {FIELD_TYPES.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t}</MenuItem>
                ))}
            </Select>
        </TableCell>
        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
            <Select
                size="small"
                value={field.strategy}
                onChange={(e) =>
                    onChange(field.id, {
                        strategy: e.target.value as GenerationStrategy,
                        staticValue: "",
                        rangeMin: "",
                        rangeMax: "",
                    })
                }
                sx={{ minWidth: 155, fontSize: 13 }}
            >
                {GENERATION_STRATEGIES.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
                ))}
            </Select>
        </TableCell>
        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
            {field.strategy === "Static" ? (
                <TextField
                    size="small"
                    placeholder="Enter value"
                    value={field.staticValue}
                    onChange={(e) => onChange(field.id, { staticValue: e.target.value })}
                    sx={{ width: 140, "& input": { fontSize: 13, py: "4px" } }}
                />
            ) : (
                <Typography sx={{ fontSize: 13, color: "#d1d5db" }}>—</Typography>
            )}
        </TableCell>
        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
            {field.strategy === "Range" ? (
                <Box display="flex" alignItems="center" gap={0.5}>
                    <TextField
                        size="small"
                        placeholder="Min"
                        value={field.rangeMin}
                        onChange={(e) => onChange(field.id, { rangeMin: e.target.value })}
                        sx={{ width: 80, "& input": { fontSize: 13, py: "4px" } }}
                    />
                    <Typography sx={{ fontSize: 12, color: "#9ca3af", px: 0.25 }}>–</Typography>
                    <TextField
                        size="small"
                        placeholder="Max"
                        value={field.rangeMax}
                        onChange={(e) => onChange(field.id, { rangeMax: e.target.value })}
                        sx={{ width: 80, "& input": { fontSize: 13, py: "4px" } }}
                    />
                </Box>
            ) : (
                <Typography sx={{ fontSize: 13, color: "#d1d5db" }}>—</Typography>
            )}
        </TableCell>
        <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
            <Select
                size="small"
                value={field.semanticId ?? ""}
                displayEmpty
                onChange={(e) => onChange(field.id, { semanticId: e.target.value })}
                sx={{ minWidth: 140, fontSize: 13 }}
            >
                <MenuItem value="" sx={{ fontSize: 13, color: "#9ca3af" }}>None</MenuItem>
                {semanticOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id} sx={{ fontSize: 13 }}>{opt.name}</MenuItem>
                ))}
            </Select>
        </TableCell>
    </TableRow>
);

interface EnrichmentDataProps {
    onSaveRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}

const EnrichmentData = ({ onSaveRef }: EnrichmentDataProps) => {
    const { values, functions } = useEnrichmentDataController(onSaveRef);
    const { data: semanticData } = useGetFakerSemanticDataQuery();
    const semanticOptions = semanticData?.data ?? [];
    const { tableName, numberOfRows, sampleJson, jsonError, schemaFields, savedRecords, isSaving, isDeleting, isLoading } = values;
    const {
        setTableName,
        setNumberOfRows,
        handleSampleJsonChange,
        handleGenerateSchemaFields,
        handleFieldChange,
        handleSaveRecord,
        handleDeleteRecord,
    } = functions;

    const canGenerate = sampleJson.trim().length > 0 && !jsonError;
    const jsonBorderColor = jsonError
        ? "#ef4444"
        : canGenerate
        ? "#22c55e"
        : "#e5e7eb";

    return (
        <Box width="100%" maxWidth="960px">
            <S.InfoBanner>
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "#2563eb", mt: "1px", flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>
                    <strong>Optional:</strong> Enrichment data is used to simulate Operational Data Store (ODS)
                    lookups required by certain rules (e.g., account balances, historical velocity).
                    <br />
                    If your rule does not require external lookups, you can skip this step. Otherwise, paste a
                    sample record below and save it to the target table.
                </Typography>
            </S.InfoBanner>
            <S.SchemaTableContainer sx={{ mb: 2.5 }}>
                <S.SchemaTableHeader>
                    <Text size="body" weight="semibold">Enrichment Records</Text>
                </S.SchemaTableHeader>
                {isLoading ? (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
                        <CircularProgress size={22} />
                        <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Loading enrichment records…</Typography>
                    </Box>
                ) : savedRecords.length === 0 ? (
                    <Typography sx={{ py: 4, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        No records to display. Add an enrichment record below.
                    </Typography>
                ) : (
                    <Box display="flex" flexDirection="column" gap={1}>
                        {savedRecords.map((record) => (
                            <Accordion
                                key={record.id}
                                disableGutters
                                elevation={0}
                                TransitionProps={{ timeout: 150 }}
                                sx={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px !important",
                                    "&:before": { display: "none" },
                                    "&.Mui-expanded": { borderColor: "#bfdbfe" },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 18, color: "#6b7280" }} />}
                                    sx={{
                                        minHeight: 48,
                                        px: 2,
                                        "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1.5, my: "10px" },
                                    }}
                                >
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1 }}>
                                        {record.table_name}
                                    </Typography>
                                    <Chip
                                        label={`${record.row_count} row${record.row_count !== 1 ? "s" : ""}`}
                                        size="small"
                                        sx={{ fontSize: 11, height: 20, backgroundColor: "#eff6ff", color: "#2563eb" }}
                                    />
                                    <Tooltip title="Remove">
                                        <span>
                                            <IconButton
                                                size="small"
                                                disabled={isDeleting}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDeleteRecord(record.id);
                                                }}
                                                sx={{ color: "#ef4444", "&:hover": { backgroundColor: "#fef2f2" } }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                                    <MuiTable size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                                                <TableCell><S.ColumnHeader>Field Name</S.ColumnHeader></TableCell>
                                                <TableCell><S.ColumnHeader>Type</S.ColumnHeader></TableCell>
                                                <TableCell><S.ColumnHeader>Strategy</S.ColumnHeader></TableCell>
                                                <TableCell><S.ColumnHeader>Static Value</S.ColumnHeader></TableCell>
                                                <TableCell><S.ColumnHeader>Range</S.ColumnHeader></TableCell>
                                                <TableCell><S.ColumnHeader>Semantics</S.ColumnHeader></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(record.schema_template_json.properties ?? []).map((prop) => (
                                                <TableRow key={prop.id}>
                                                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#2563eb", fontFamily: "monospace" }}>
                                                            {prop.fieldName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <Typography sx={{ fontSize: 12, color: "#374151" }}>{prop.type}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <Typography sx={{ fontSize: 12, color: "#374151" }}>{prop.strategy}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <Typography sx={{ fontSize: 12, color: prop.staticValue ? "#374151" : "#d1d5db" }}>
                                                            {prop.staticValue || "—"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <Typography sx={{ fontSize: 12, color: prop.rangeMin || prop.rangeMax ? "#374151" : "#d1d5db" }}>
                                                            {prop.rangeMin || prop.rangeMax ? `${prop.rangeMin} – ${prop.rangeMax}` : "—"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                                                        <Typography sx={{ fontSize: 12, color: prop.semanticId ? "#374151" : "#d1d5db" }}>
                                                            {prop.semanticId
                                                                ? (semanticOptions.find((s) => s.id === prop.semanticId)?.name ?? prop.semanticId)
                                                                : "—"}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </MuiTable>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </S.SchemaTableContainer>
            <S.FormCard>
                <Box display="flex" gap={3} flexWrap="wrap">
                    <Box flex="7 1 200px">
                        <S.FieldLabel>Target Table Name</S.FieldLabel>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="e.g., account_enrichment"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                        />
                    </Box>
                    <Box flex="5 1 120px">
                        <S.FieldLabel>Number of Rows</S.FieldLabel>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={numberOfRows}
                            onChange={(e) => setNumberOfRows(Math.max(1, Number(e.target.value)))}
                            inputProps={{ min: 1 }}
                        />
                    </Box>
                </Box>
                <Box mt={3}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <S.FieldLabel sx={{ mb: 0 }}>Sample Enrichment JSON</S.FieldLabel>
                        <Button
                            height="34px"
                            type="secondary"
                            size=""
                            width="auto"
                            text="Generate Schema Fields"
                            onClick={handleGenerateSchemaFields}
                            disabled={!canGenerate}
                        />
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        minRows={6}
                        placeholder={'{\n  "key": "value"\n}'}
                        value={sampleJson}
                        onChange={(e) => handleSampleJsonChange(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                fontFamily: "monospace",
                                fontSize: 13,
                                alignItems: "flex-start",
                                "& fieldset": { borderColor: jsonBorderColor },
                                "&:hover fieldset": { borderColor: jsonBorderColor },
                                "&.Mui-focused fieldset": { borderColor: jsonBorderColor },
                            },
                        }}
                    />
                    {jsonError && (
                        <Typography sx={{ fontSize: 12, color: "#ef4444", mt: 0.5 }}>
                            Invalid JSON: {jsonError}
                        </Typography>
                    )}
                </Box>
            </S.FormCard>
            <S.SchemaTableContainer>
                <S.SchemaTableHeader>
                    <Text size="body" weight="semibold">Configure Schema Fields</Text>
                </S.SchemaTableHeader>

                <MuiTable size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell><S.ColumnHeader>Field Name</S.ColumnHeader></TableCell>
                            <TableCell><S.ColumnHeader>Type</S.ColumnHeader></TableCell>
                            <TableCell><S.ColumnHeader>Generation Strategy</S.ColumnHeader></TableCell>
                            <TableCell><S.ColumnHeader>Static Value</S.ColumnHeader></TableCell>
                            <TableCell><S.ColumnHeader>Range</S.ColumnHeader></TableCell>
                            <TableCell><S.ColumnHeader>Semantics</S.ColumnHeader></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schemaFields.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#9ca3af", fontSize: 13 }}>
                                    Paste a JSON sample above and click <strong>Generate Schema Fields</strong>.
                                </TableCell>
                            </TableRow>
                        ) : (
                            schemaFields.map((field) => (
                                <SchemaRow
                                    key={field.id}
                                    field={field}
                                    onChange={handleFieldChange}
                                    semanticOptions={semanticOptions}
                                />
                            ))
                        )}
                    </TableBody>
                </MuiTable>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                        height="38px"
                        type="primary"
                        size="md"
                        text="Save Record"
                        Icon={SaveOutlinedIcon}
                        loading={isSaving}
                        disabled={!tableName.trim() || !sampleJson.trim() || !!jsonError || schemaFields.length === 0}
                        onClick={() => { void handleSaveRecord(); }}
                    />
                </Box>
            </S.SchemaTableContainer>
        </Box>
    );
};

export default EnrichmentData;

