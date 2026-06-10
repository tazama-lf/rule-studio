import { useEffect, memo, useState, type MutableRefObject } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkIcon from "@mui/icons-material/Link";
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
import { Text } from "../../Text";
import * as S from "./TriggerData.styles";
import useTriggerDataController, {
  type TriggerEntry,
  type TriggerOverride,
  type TriggerOverrideType,
} from "../../../hooks/SimStudio/useTriggerDataController";
import { useGetFakerSemanticDataQuery } from "../../../redux/Api/SimStudio";
import FieldMappingModal from "../TxtpSelection/FieldMappingModal";

const OVERRIDE_OPTIONS: { label: string; value: TriggerOverrideType }[] = [
  { label: "No Override", value: "null" },
  { label: "Set Static Value", value: "static" },
  { label: "Use Range", value: "range" },
  { label: "Auto-generate", value: "generated" },
  { label: "Remove Field", value: "remove" },
];

// ── Field Overrides Table ─────────────────────────────────────────────────────

interface FieldOverridesTableProps {
  entry: TriggerEntry;
  onOverrideChange: (entryId: string, fieldPath: string, override: TriggerOverride) => void;
  semanticOptions: { id: string; name: string }[];
}

const FieldOverridesTable = memo(({ entry, onOverrideChange, semanticOptions }: FieldOverridesTableProps) => {
  const getOverride = (path: string): TriggerOverride =>
    entry.fieldOverrides[path] ?? { overrideType: "null", staticValue: "", rangeMin: "", rangeMax: "", semanticId: "" };

  return (
    <S.FieldConfigSection>
      <S.FieldConfigHeader>
        <S.FieldConfigTitle>Field Overrides for {entry.txtp}</S.FieldConfigTitle>
        <S.FieldConfigSubtitle>
          Configure how each field should behave during simulation.
        </S.FieldConfigSubtitle>
      </S.FieldConfigHeader>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340, overflowY: "auto" }}>
        <MuiTable stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "30%" }}>Field Name</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "20%" }}>Override Type</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "22%" }}>Static Value</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa" }}>Range</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "18%" }}>Semantics</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entry.payloadFields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#9ca3af" }}>
                  No fields available from payload
                </TableCell>
              </TableRow>
            ) : (
              entry.payloadFields.map((path) => {
                const override = getOverride(path);
                return (
                  <TableRow key={path} hover>
                    <TableCell sx={{ fontSize: "12px", color: "#2563eb", fontFamily: "monospace", borderBottom: "1px solid #e0e0e0", maxWidth: 0, overflow: "hidden" }}>
                      <Tooltip title={path} placement="top-start">
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {path}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                      <Select
                        value={override.overrideType}
                        size="small"
                        onChange={(e) => {
                          const newType = e.target.value as TriggerOverrideType;
                          onOverrideChange(entry.id, path, {
                            overrideType: newType,
                            staticValue: newType === "static" ? override.staticValue : "",
                            rangeMin: newType === "range" ? override.rangeMin : "",
                            rangeMax: newType === "range" ? override.rangeMax : "",
                            semanticId: override.semanticId,
                          });
                        }}
                        sx={{ fontSize: "12px", minWidth: 160, "& .MuiSelect-select": { py: "4px" } }}
                      >
                        {OVERRIDE_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "12px" }}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                      {override.overrideType === "static" ? (
                        <TextField
                          size="small"
                          value={override.staticValue}
                          placeholder="Enter value"
                          onChange={(e) => onOverrideChange(entry.id, path, { ...override, staticValue: e.target.value })}
                          sx={{ width: "100%", "& input": { fontSize: "12px", py: "4px" } }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: "12px", color: "#d1d5db" }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                      {override.overrideType === "range" ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <TextField
                            size="small"
                            value={override.rangeMin}
                            placeholder="Min"
                            onChange={(e) => onOverrideChange(entry.id, path, { ...override, rangeMin: e.target.value })}
                            sx={{ width: 90, "& input": { fontSize: "12px", py: "4px" } }}
                          />
                          <Typography sx={{ fontSize: "12px", color: "#9ca3af", px: 0.25 }}>–</Typography>
                          <TextField
                            size="small"
                            value={override.rangeMax}
                            placeholder="Max"
                            onChange={(e) => onOverrideChange(entry.id, path, { ...override, rangeMax: e.target.value })}
                            sx={{ width: 90, "& input": { fontSize: "12px", py: "4px" } }}
                          />
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: "12px", color: "#d1d5db" }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                      <Select
                        value={override.semanticId ?? ""}
                        size="small"
                        displayEmpty
                        onChange={(e) => onOverrideChange(entry.id, path, { ...override, semanticId: e.target.value })}
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

// ── Entry Accordion ──────────────────────────────────────────────────────────

interface EntryAccordionProps {
  entry: TriggerEntry;
  canRemove?: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onNumMessagesChange: (id: string, value: number) => void;
  onOverrideChange: (entryId: string, fieldPath: string, override: TriggerOverride) => void;
  semanticOptions: { id: string; name: string }[];
}

const EntryAccordion = memo(({
  entry,

  canRemove = true,
  onToggle,
  onRemove,
  onNumMessagesChange,
  onOverrideChange,
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
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{entry.txtp}</Typography>

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
        <FieldOverridesTable entry={entry} onOverrideChange={onOverrideChange} semanticOptions={semanticOptions} />
      </Box>
    </Collapse>
  </Box>
));

// ── Linked Pair Container ────────────────────────────────────────────────────

interface LinkedPairContainerProps {
  primary: TriggerEntry;
  related: TriggerEntry;
  isPrimaryFirst: boolean;
  onToggle: (id: string) => void;
  onRemovePair: (primaryId: string, relatedId: string) => void;
  onAddMapping: (primaryId: string, relatedId: string) => void;
  onNumMessagesChange: (id: string, value: number) => void;
  onOverrideChange: (entryId: string, fieldPath: string, override: TriggerOverride) => void;
  semanticOptions: { id: string; name: string }[];
}

const LinkedPairContainer = ({
  primary,
  related,
  onToggle,
  onRemovePair,
  onAddMapping,
  onNumMessagesChange,
  onOverrideChange,
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
        onOverrideChange={onOverrideChange}
        semanticOptions={semanticOptions}
      />
      <EntryAccordion
        entry={related}
        canRemove={false}
        onToggle={onToggle}
        onRemove={() => {}}
        onNumMessagesChange={onNumMessagesChange}
        onOverrideChange={onOverrideChange}
        semanticOptions={semanticOptions}
      />
    </Box>
  </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────────

interface TriggerDataProps {
  onSaveRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}

const TriggerData = ({ onSaveRef }: TriggerDataProps) => {
  const { values, functions } = useTriggerDataController();
  const { data: semanticData } = useGetFakerSemanticDataQuery();
  const semanticOptions = semanticData?.data ?? [];
  const { entries, numMessages, adding, isLoading, primaryTxtp } = values;
  const {
    setNumMessages,
    handleAdd,
    handleRemove,
    handleRemovePair,
    handleToggleExpand,
    handleNumMessagesChange,
    handleOverrideChange,
    saveTriggerConfigs,
  } = functions;

  const [mappingModal, setMappingModal] = useState<{
    primaryId: string;
    relatedId: string;
    primaryConfigId: number;
    relatedConfigId: number;
  } | null>(null);

  const handleOpenMapping = (primaryId: string, relatedId: string) => {
    const primaryEntry = entries.find((e) => e.id === primaryId);
    const relatedEntry = entries.find((e) => e.id === relatedId);
    if (!primaryEntry?.triggerId || !relatedEntry?.triggerId) return;
    setMappingModal({
      primaryId,
      relatedId,
      primaryConfigId: primaryEntry.triggerId,
      relatedConfigId: relatedEntry.triggerId,
    });
  };

  const handleCloseMappingModal = () => setMappingModal(null);

  const modalPrimary = mappingModal ? entries.find((e) => e.id === mappingModal.primaryId) : undefined;
  const modalRelated = mappingModal ? entries.find((e) => e.id === mappingModal.relatedId) : undefined;

  useEffect(() => {
    if (onSaveRef) onSaveRef.current = saveTriggerConfigs;
    return () => { if (onSaveRef) onSaveRef.current = null; };
  }, [onSaveRef, saveTriggerConfigs]);

  const primaryEntries = entries.filter((e) => !e.relatedTxtpConfigId);
  const relatedEntries = entries.filter((e) => e.relatedTxtpConfigId != null);
  const entryPairs = primaryEntries.map((primary, idx) => ({
    primary,
    isFirstPrimary: idx === 0,
    related: relatedEntries.find((r) => r.relatedTxtpConfigId === primary.triggerId),
  }));

  return (
    <Box>
      <S.InfoBanner>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3b82f6", flexShrink: 0, mt: "1px" }} />
        <Text size="sub" sx={{ color: "#1e40af", lineHeight: 1.6 }}>
          Trigger data represents the transactions that will be submitted to the rule processor
          during simulation. Each entry uses the primary TXTP payload template with optional
          field overrides.
        </Text>
      </S.InfoBanner>
      <S.AddFormCard>
        <Box minWidth={140}>
          <S.FieldLabel>TXTP</S.FieldLabel>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: primaryTxtp ? "#111827" : "#9ca3af",
              height: "38px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {primaryTxtp ? primaryTxtp.txtp : "Loading…"}
          </Typography>
        </Box>

        <Box minWidth={120}>
          <S.FieldLabel>Version</S.FieldLabel>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: primaryTxtp ? "#111827" : "#9ca3af",
              height: "38px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {primaryTxtp ? primaryTxtp.txtp_version : "—"}
          </Typography>
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
              if (val === "" || /^\d+$/.test(val)) setNumMessages(val === "" ? 0 : Number(val));
            }}
            sx={{ width: "100%", "& .MuiOutlinedInput-root": { borderRadius: "6px", fontSize: "14px", height: "38px" } }}
          />
        </Box>

        <Box flexShrink={0}>
          <Button
            height="38px"
            type="secondary"
            size="md"
            text="Add"
            loading={adding}
            onClick={handleAdd}
            disabled={!primaryTxtp}
          />
        </Box>
      </S.AddFormCard>
      <Paper variant="outlined">
        {isLoading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
            <CircularProgress size={22} />
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Loading trigger configurations…</Typography>
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: "#9ca3af" }}>
            No trigger configs added yet. Click <strong>Add</strong> to create one.
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
                  onOverrideChange={handleOverrideChange}
                  semanticOptions={semanticOptions}
                />
              ) : (
                <EntryAccordion
                  key={pair.primary.id}
                  entry={pair.primary}
                  onToggle={handleToggleExpand}
                  onRemove={handleRemove}
                  onNumMessagesChange={handleNumMessagesChange}
                  onOverrideChange={handleOverrideChange}
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
          primary={{ txtp: modalPrimary.txtp, version: modalPrimary.version, fields: modalPrimary.payloadFields }}
          related={{ txtp: modalRelated.txtp, version: modalRelated.version, fields: modalRelated.payloadFields }}
          primaryConfigId={mappingModal.primaryConfigId}
          relatedConfigId={mappingModal.relatedConfigId}
          mappingType="trigger"
        />
      )}
    </Box>
  );
};

export default TriggerData;