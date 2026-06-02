import { useEffect, useState } from "react";
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
import { Text } from "../../Text";
import * as S from "./TriggerData.styles";
import { LocalStorage } from "../../../utils/Common/enums";
import { extractData } from "../../../utils/Common/storage";
import { useLazyGetContextConfigsQuery } from "../../../redux/Api/SimStudio";
import type {
  FieldAction,
  FieldConfig,
  TxtpEntry,
} from "../../../hooks/SimStudio/useTxtpSelectionController";

const FIELD_ACTION_OPTIONS: { label: string; value: FieldAction }[] = [
  { label: "Use Sample Value", value: "sample" },
  { label: "Set Static Value", value: "static" },
  { label: "Use Range", value: "range" },
  { label: "Skip Field", value: "skip" },
];

interface FieldConfigTableProps {
  entry: TxtpEntry;
  onFieldConfigChange: (path: string, config: FieldConfig) => void;
}

const FieldConfigTable = ({ entry, onFieldConfigChange }: FieldConfigTableProps) => {
  const getConfig = (path: string): FieldConfig =>
    (entry.fieldConfigs ?? {})[path] ?? { action: "sample", staticValue: "", rangeStart: "", rangeEnd: "" };

  return (
    <S.FieldConfigSection>
      <S.FieldConfigHeader>
        <S.FieldConfigTitle>Field Configuration for {entry.txtp}</S.FieldConfigTitle>
        <S.FieldConfigSubtitle>
          Configure only the fields relevant to the rule. Unconfigured fields may keep sample values or defaults.
        </S.FieldConfigSubtitle>
      </S.FieldConfigHeader>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340, overflowY: "auto" }}>
        <MuiTable stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "30%" }}>Field Name</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "18%" }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa", width: "22%" }}>Static Value</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "12px", bgcolor: "#fbf9fa" }}>Range</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(entry.fieldPaths ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#9ca3af" }}>
                  No fields available from payload
                </TableCell>
              </TableRow>
            ) : (
              (entry.fieldPaths ?? []).map((path) => {
                const config = getConfig(path);
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
                        value={config.action}
                        size="small"
                        onChange={(e) => {
                          const newAction = e.target.value as FieldAction;
                          onFieldConfigChange(path, {
                            action: newAction,
                            staticValue: newAction === "static" ? config.staticValue : "",
                            rangeStart: newAction === "range" ? config.rangeStart : "",
                            rangeEnd: newAction === "range" ? config.rangeEnd : "",
                          });
                        }}
                        sx={{ fontSize: "12px", minWidth: 160, "& .MuiSelect-select": { py: "4px" } }}
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
                          onChange={(e) => onFieldConfigChange(path, { ...config, staticValue: e.target.value })}
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
                            onChange={(e) => onFieldConfigChange(path, { ...config, rangeStart: e.target.value })}
                            sx={{ width: 90, "& input": { fontSize: "12px", py: "4px" } }}
                          />
                          <Typography sx={{ fontSize: "12px", color: "#9ca3af", px: 0.25 }}>–</Typography>
                          <TextField
                            size="small"
                            value={config.rangeEnd}
                            placeholder="End"
                            onChange={(e) => onFieldConfigChange(path, { ...config, rangeEnd: e.target.value })}
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

const TriggerData = () => {
  const [primaryEntry, setPrimaryEntry] = useState<TxtpEntry | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [fetchContextConfigs] = useLazyGetContextConfigsQuery();

  useEffect(() => {
    const genId = extractData("sim_gen_id", LocalStorage, false) as string | number | null;
    if (!genId) return;

    void fetchContextConfigs(Number(genId)).then((res) => {
      const configs = res.data?.data ?? [];
      if (configs.length === 0) return;
      const primary = configs[0];
      const payload = primary.sample_payload_snapshot ?? null;
      const fieldPaths = payload
        ? Object.keys(payload).reduce<string[]>((acc, k) => {
            const val = (payload as Record<string, unknown>)[k];
            if (typeof val === "object" && val !== null && !Array.isArray(val)) {
              Object.keys(val as object).forEach((sub) => acc.push(`${k}.${sub}`));
            } else {
              acc.push(k);
            }
            return acc;
          }, [])
        : [];
      const fieldConfigs: Record<string, FieldConfig> = {};
      for (const s of primary.field_strategies ?? []) {
        const code = s.strategy_code;
        fieldConfigs[s.field_path] = {
          action: code === "static" ? "static" : code === "range" ? "range" : code === "skip" ? "skip" : "sample",
          staticValue: s.static_value != null ? String(s.static_value) : "",
          rangeStart: s.range_min != null ? String(s.range_min) : "",
          rangeEnd: s.range_max != null ? String(s.range_max) : "",
        };
      }
      setPrimaryEntry({
        id: `${primary.txtp}_${primary.txtp_version}`,
        txtp: primary.txtp,
        version: primary.txtp_version,
        numMessages: 1,
        expanded: false,
        payload,
        fieldPaths,
        fieldConfigs,
        schemaLoaded: true,
        sampleAvailable: fieldPaths.length > 0,
        contextConfigId: Number(primary.context_txtp_config_id ?? (primary as { id?: number }).id ?? 0) || undefined,
      });
    });
  }, [fetchContextConfigs]);

  const handleMessagesChange = (value: number) => {
    if (primaryEntry) {
      setPrimaryEntry({ ...primaryEntry, numMessages: value });
    }
  };

  const handleFieldConfigChange = (path: string, config: FieldConfig) => {
    if (primaryEntry) {
      setPrimaryEntry({
        ...primaryEntry,
        fieldConfigs: { ...primaryEntry.fieldConfigs, [path]: config },
      });
    }
  };

  return (
    <Box>
      <S.InfoBanner>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: "#3b82f6", flexShrink: 0, mt: "1px" }} />
        <Text size="sub" sx={{ color: "#1e40af", lineHeight: 1.6 }}>
          Trigger data represents the transaction that will be submitted to the rule processor during simulation. Configure the base payload for the primary TXTP.
        </Text>
      </S.InfoBanner>

      {primaryEntry ? (
        <TableContainer component={Paper} variant="outlined">
          <MuiTable>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48, bgcolor: "#fbf9fa", pr: 0 }} />
                <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>TXTP Type</TableCell>
                <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>Version</TableCell>
                <TableCell sx={{ bgcolor: "#fbf9fa", fontWeight: 600, fontSize: "13px" }}>No. of Messages</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover sx={{ bgcolor: "#fff" }}>
                <TableCell sx={{ width: 48, borderBottom: "1px solid #e0e0e0", pr: 0 }}>
                  <IconButton size="small" onClick={() => setExpanded((prev) => !prev)}>
                    {expanded ? (
                      <ExpandMoreIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <ChevronRightIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                  <Box display="flex" alignItems="center">
                    <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{primaryEntry.txtp}</Typography>
                    <S.PrimaryBadge>Primary</S.PrimaryBadge>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: "13px", borderBottom: "1px solid #e0e0e0" }}>
                  {primaryEntry.version}
                </TableCell>
                <TableCell sx={{ borderBottom: "1px solid #e0e0e0" }}>
                  <TextField
                    type="text"
                    inputMode="numeric"
                    size="small"
                    value={primaryEntry.numMessages || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) {
                        handleMessagesChange(val === "" ? 0 : Number(val));
                      }
                    }}
                    sx={{ width: 130, "& .MuiOutlinedInput-root": { height: "34px", fontSize: "13px" } }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} sx={{ p: 0, borderBottom: expanded ? "1px solid #e0e0e0" : "none" }}>
                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <FieldConfigTable
                      entry={primaryEntry}
                      onFieldConfigChange={handleFieldConfigChange}
                    />
                  </Collapse>
                </TableCell>
              </TableRow>
            </TableBody>
          </MuiTable>
        </TableContainer>
      ) : (
        <Box sx={{ p: 3, textAlign: "center", color: "#9ca3af" }}>
          <Typography>No primary TXTP configured. Please complete Step 2.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default TriggerData;