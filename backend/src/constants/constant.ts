export const BASE_URL: string = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3100';
export const DEMS_BASE_URL: string = process.env.DEMS_BASE_URL ?? 'http://localhost:3002/dems-engine';
export const DLH_BASE_URL: string = process.env.DLH_URL ?? 'http://localhost:5000';
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

// Config
export const CONFIG = '/v1/admin/config';
export const CONFIG_VERSIONS = `${CONFIG}/versions`;
export const CONFIG_TRANSACTION_TYPES = `${CONFIG}/transaction-types`;
export const CONFIG_PAYLOAD = `${CONFIG}/payload`;

// Network Map
export const NETWORK_MAP_LIST = '/v1/admin/configuration/network_map';

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
// Simulation Table
export const SIMULATION_BASE_URL = `${RULES_BASE_URL}/simulation`;
export const SIMULATION_ALL = `${SIMULATION_BASE_URL}/all`;
export const SIMULATION_CREATE = `${SIMULATION_BASE_URL}/create`;
export const SIMULATION_STATS = `${SIMULATION_BASE_URL}/get_simulation_stats`;
export const SIMULATION_RESULTS = `${SIMULATION_BASE_URL}/get_simulation_results`;
export const CREATE_MASK = `${RULES_BASE_URL}/masking/create`;

// Simulation
export const MASKING_ACTIVE_CONFIGS = `${MASKING_BASE_URL}/active-configs`;
export const SIMULATION_ITEMS = '/v1/admin/simulation/items';
export const EXCLUDED_TYPES = `${RULES_BASE_URL}/excluded/types`;

// Base rule for cloning flow
export const BASE_RULE_ID = '21';

// DLH
export const STAGE_SIMULATION_ITEMS = '/v1/dlh/stage';

// Evaluations
export const GET_ALL_EVALUATIONS = '/v1/admin/reports/evaluations';
export const FETCH_COUNT_DLH = '/v1/admin/dlh/fetch/count';