import { useEffect, type MutableRefObject } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
import { Text } from "../../Text";
import * as S from "./TriggerData.styles";
import useTriggerDataController, {
  type TriggerEntry,
  type TriggerOverride,
  type TriggerOverrideType,
} from "../../../hooks/SimStudio/useTriggerDataController";

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
}

const FieldOverridesTable = ({ entry, onOverrideChange }: FieldOverridesTableProps) => {
  const getOverride = (path: string): TriggerOverride =>
    entry.fieldOverrides[path] ?? { overrideType: "null", staticValue: "", rangeMin: "", rangeMax: "" };

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
            </TableRow>
          </TableHead>
          <TableBody>
            {entry.payloadFields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#9ca3af" }}>
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

// ── Entry Row ─────────────────────────────────────────────────────────────────

interface EntryRowProps {
  entry: TriggerEntry;
  index: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onNumMessagesChange: (id: string, value: number) => void;
  onOverrideChange: (entryId: string, fieldPath: string, override: TriggerOverride) => void;
}

const EntryRow = ({
  entry,
  index,
  onToggle,
  onRemove,
  onNumMessagesChange,
  onOverrideChange,
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
          {index === 0 && <S.PrimaryBadge>Primary</S.PrimaryBadge>}
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
          sx={{ width: 130, "& .MuiOutlinedInput-root": { height: "34px", fontSize: "13px" } }}
        />
      </TableCell>
      <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
        <S.RemoveText onClick={() => onRemove(entry.id)}>Remove</S.RemoveText>
      </TableCell>
    </TableRow>
    <TableRow>
      <TableCell colSpan={6} sx={{ p: 0, borderBottom: entry.expanded ? "1px solid #e0e0e0" : "none" }}>
        <Collapse in={entry.expanded} timeout="auto" unmountOnExit>
          <FieldOverridesTable entry={entry} onOverrideChange={onOverrideChange} />
        </Collapse>
      </TableCell>
    </TableRow>
  </>
);

// ── Main Component ─────────────────────────────────────────────────────────────

interface TriggerDataProps {
  onSaveRef?: MutableRefObject<(() => Promise<boolean>) | null>;
}

const TriggerData = ({ onSaveRef }: TriggerDataProps) => {
  const { values, functions } = useTriggerDataController();
  const { entries, numMessages, adding, primaryTxtp } = values;
  const {
    setNumMessages,
    handleAdd,
    handleRemove,
    handleToggleExpand,
    handleNumMessagesChange,
    handleOverrideChange,
    saveTriggerConfigs,
  } = functions;

  useEffect(() => {
    if (onSaveRef) onSaveRef.current = saveTriggerConfigs;
    return () => { if (onSaveRef) onSaveRef.current = null; };
  }, [onSaveRef, saveTriggerConfigs]);

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

      {/* Add form */}
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
      <TableContainer component={Paper} variant="outlined">
        <MuiTable>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48, bgcolor: "#fbf9fa", pr: 0 }} />
              <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>Order</TableCell>
              <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>TXTP</TableCell>
              <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>Version</TableCell>
              <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>No. of Messages</TableCell>
              <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#9ca3af" }}>
                  No trigger configs added yet. Click <strong>Add</strong> to create one.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, idx) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  onToggle={handleToggleExpand}
                  onRemove={handleRemove}
                  onNumMessagesChange={handleNumMessagesChange}
                  onOverrideChange={handleOverrideChange}
                />
              ))
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
    </Box>
  );
};

export default TriggerData;