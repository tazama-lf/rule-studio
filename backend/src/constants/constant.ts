export const BASE_URL: string =
  process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3100';
// Rules
export const RULES_WITH_FILTERS = '/v1/admin/trs/rules';

export const RULES_WITH_ID = '/v1/admin/trs/rules';

export const RULE_FLOW = '/v1/admin/trs/rule-flow';

export const GLOBAL_VARIABLES = '/v1/admin/trs/global-variables';

export const NODES = '/v1/admin/nodes';

export const BASE_RULE_ID = '21';
