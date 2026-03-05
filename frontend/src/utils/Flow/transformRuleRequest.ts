export const transformRuleRequestToCode = (ruleRequestData: unknown): string => {
  if (!ruleRequestData || typeof ruleRequestData !== 'object') {
    return `  const quote = {
    transaction: JSON.parse(''),
    networkMap: JSON.parse(''),
    DataCache: JSON.parse(''),
  };
  return quote;`;
  }

  const data = ruleRequestData as Record<string, unknown>;
  
  const transaction = data.transaction || {};
  const networkMap = data.networkMap || {};
  const dataCache = data.DataCache || {};

  const transactionStr = JSON.stringify(transaction);
  const networkMapStr = JSON.stringify(networkMap);
  const dataCacheStr = JSON.stringify(dataCache);

  const escapeForTemplate = (str: string) => str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  return `  const quote = {
    transaction: JSON.parse(
      \`${escapeForTemplate(transactionStr)}\`,
    ),
    networkMap: JSON.parse(
      '${networkMapStr.replace(/'/g, "\\'")}',
    ),
    DataCache: JSON.parse(
      '${dataCacheStr.replace(/'/g, "\\'")}',
    ),
  };
  return quote;`;
};

