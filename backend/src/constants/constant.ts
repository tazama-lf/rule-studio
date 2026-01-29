export const BASE_URL: string = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3100';
// Rules
export const RULES_BASE_URL = '/v1/admin/trs';
export const RULE_IDS = `${RULES_BASE_URL}/rule-ids`;
export const RULE = `${RULES_BASE_URL}/rule`;
export const RULES_WITH_ID = `${RULES_BASE_URL}/rules`;
export const RULE_FLOW = `${RULES_BASE_URL}/rule-flow`;
export const GLOBAL_VARIABLES = `${RULES_BASE_URL}/global-variables`;
export const RULE_CONFIGURATION = `${RULES_BASE_URL}/rule-configuration`;
export const CLONE_RULE = `${RULES_BASE_URL}/clone`;
export const UPDATE_RULE_STATUS = `${RULES_BASE_URL}/rule/updateStatus`;
export const SAVE_RULE_REQUEST = `${RULES_BASE_URL}/saveRuleRequest`;

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

// Base rule for cloning flow
export const BASE_RULE_ID = '21';
