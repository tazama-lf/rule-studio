export const transformRuleResultToCode = (ruleResultData: unknown): string => {
  if (!ruleResultData || typeof ruleResultData !== 'object') {
    return `const ruleResult: RuleResult = {
  id: '021@1.0.0',
  tenantId: 'DEFAULT',
  cfg: '1.0.0',
  subRuleRef: '.err',
  reason: 'Unhandled rule result outcome',
};`;
  }

  const data = ruleResultData as Record<string, unknown>;
  
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      const items = value.map(item => formatValue(item)).join(', ');
      return `[${items}]`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`);
      return `{ ${entries.join(', ')} }`;
    }
    return 'undefined';
  };

  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`  ${key}: ${formatValue(value)},`);
  }

  return `const ruleResult: RuleResult = {\n${lines.join('\n')}\n};`;
};
