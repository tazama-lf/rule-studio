export const BASE_URL: string = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3100';
// Rules
export const RULES_BASE_URL = '/v1/admin/trs';
export const RULE_IDS = `${RULES_BASE_URL}/rule-ids`;
export const RULE = `${RULES_BASE_URL}/rule`;
export const RULES_WITH_ID = `${RULES_BASE_URL}/rules`;
export const RULE_FLOW = `${RULES_BASE_URL}/rule-flow`;
export const GLOBAL_VARIABLES = `${RULES_BASE_URL}/global-variables`;
export const RULE_CONFIGURATION = `${RULES_BASE_URL}/rule-configuration`;
export const CLONE_RULE = `${RULE}/clone`;
export const UPDATE_RULE_STATUS = `${RULES_BASE_URL}/rule/updateStatus`;
export const SAVE_RULE_REQUEST = `${RULES_BASE_URL}/saveRuleRequest`;

//MASK
export const CREATE_MASK = `${RULES_BASE_URL}/mask/create`;

// Config
export const CONFIG = '/v1/admin/config';
export const CONFIG_VERSIONS = `${CONFIG}/versions`;
export const CONFIG_TRANSACTION_TYPES = `${CONFIG}/transaction-types`;
export const CONFIG_PAYLOAD = `${CONFIG}/payload`;

// Network Map
export const ACTIVE_NETWORK_MAP = '/v1/admin/network-map/active';

// Nodes
export const NODES = '/v1/admin/nodes';
export const CREATE_NODES = `${NODES}/create`;
export const QUERY_NODES = `${NODES}/query`;
export const DELETE_NODES = `${NODES}/delete`;

// Simulation Logs
export const SIMULATION_LOGS = '/v1/admin/simulation-logs';
export const INSERT_SIMULATION_LOGS = `${SIMULATION_LOGS}/insert`;
export const GET_SIMULATION_LOGS = `${SIMULATION_LOGS}/:ruleId`;

// Masking
export const MASKING_BASE_URL = '/v1/admin/trs/masking';
export const MASKING_ALL = `${MASKING_BASE_URL}/all`;
export const MASKING_UPDATE = MASKING_BASE_URL;
export const MASKING_REVIEW = MASKING_BASE_URL;
// Simulation Messages
export const SIMULATION_MESSAGES = '/v1/admin/simulation/messages';

// Base rule for cloning flow
export const BASE_RULE_ID = '21';
