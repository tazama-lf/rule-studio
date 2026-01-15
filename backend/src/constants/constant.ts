export const  BASE_URL: string = process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3100';
  // Rules
export const  RULES_WITH_FILTERS: string = '/v1/admin/trs/rules';

export const RULES_WITH_ID : string = `/v1/admin/trs/rules`;

export const RULE_FLOW : string = `/v1/admin/trs/rule-flow`;

export const GLOBAL_VARIABLES: string = '/v1/admin/trs/global-variables';