import type { Node } from '@xyflow/react';
import { globalVariables } from './GlobalVariables';

export interface ExecutionResult {
  newVariables: Record<string, unknown>;
  logMessage: string | null;
  error: string | null;
  branchHandle?: string | null;
}

const safeEvaluateExpression = (expression: string, variables: Record<string, unknown>): boolean => {
  try {
    const varNames = Object.keys(variables);
    const varValues = varNames.map(name => variables[name]);
    const fn = new Function(...varNames, `"use strict"; return (${expression});`);
    return Boolean(fn(...varValues));
  } catch (error) {
    console.warn('Failed to evaluate expression:', expression, error);
    return false;
  }
};

export const simulateNodeExecution = (
  node: Node,
  currentVariables: Record<string, unknown>
): ExecutionResult => {
  const type = node.data.nodeType as string;
  const params = (node.data.params as Record<string, string>) || {};

  const newVariables = { ...currentVariables };
  let logMessage: string | null = null;
  let error: string | null = null;
  let branchHandle: string | null = null;

  const resolveGlobalVariable = (path: string): unknown => {
    if (!path || typeof path !== 'string') return path;
    if (!path.startsWith('RuleRequest.') && !path.startsWith('RuleConfig.')) return path;
    
    const parts = path.split('.');
    let current: unknown = globalVariables;
    
    for (const part of parts) {
      const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown[]>)?.[key]?.[parseInt(index)];
      } else {
        current = (current as Record<string, unknown>)?.[part];
      }
      if (current === undefined) return path;
    }
    
    return current;
  };

  const replaceGlobalVariables = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/(RuleRequest|RuleConfig)\.[[\w.\]]+/g, (match) => {
      const value = resolveGlobalVariable(match);
      return value === match ? match : String(value);
    });
  };

  const resolve = (val: unknown): number => {
    if (val === undefined || val === null || val === '') return 0;
    const strVal = String(val);
    if (!isNaN(Number(strVal)) && strVal.trim() !== '') return parseFloat(strVal);
    const varVal = currentVariables[strVal.trim()];
    if (varVal !== undefined) return typeof varVal === 'number' ? varVal : Number(varVal) || 0;
    return 0;
  };

  const getParam = (keys: string[]): string | null => {
    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== '') return params[key];
    }
    return null;
  };

  const evaluateCondition = (condition: string): boolean => {
    let evalExpression = condition.replace(/\{\{\s*/g, '').replace(/\s*\}\}/g, '');
    evalExpression = replaceGlobalVariables(evalExpression);
    return safeEvaluateExpression(evalExpression, { ...currentVariables });
  };

  try {
    switch (type) {
      case 'Start':
        logMessage = '🚀 Process Started';
        break;

      case 'Import':
        logMessage = `📦 Imported module: ${params.importStatement || 'default'}`;
        break;

      case 'SetVariable': {
        const varName = getParam(['name', 'variableName']);
        const varValueRaw = getParam(['value', 'variableValue']);
        const declarationType = getParam(['declarationType']) || 'var';
        const dataType = getParam(['dataType']) || 'any';

        if (varName) {
          if (currentVariables[varName] !== undefined) {
            error = `Variable "${varName}" is already declared. Overwriting existing value.`;
            logMessage = `⚠️ WARNING: ${error}`;
            console.warn(logMessage);
          }
          
          let finalValue: unknown;

          if (!varValueRaw || varValueRaw.trim() === '' || dataType === 'undefined') {
            finalValue = undefined;
          } else {
            const globalVarValue = resolveGlobalVariable(varValueRaw);
            if (globalVarValue !== varValueRaw) {
              finalValue = globalVarValue;
            }
            else if (currentVariables[varValueRaw] !== undefined) {
              finalValue = currentVariables[varValueRaw];
            }
            else if (dataType === 'number' && !isNaN(Number(varValueRaw))) {
              finalValue = parseFloat(varValueRaw);
            } else if (dataType === 'boolean') {
              finalValue = varValueRaw.toLowerCase() === 'true' || varValueRaw === '1';
            } else if (dataType === 'array') {
              try {
                finalValue = JSON.parse(varValueRaw);
              } catch {
                finalValue = [varValueRaw];
              }
            } else if (dataType === 'object') {
              try {
                finalValue = JSON.parse(varValueRaw);
              } catch {
                finalValue = { value: varValueRaw };
              }
            } else if (!isNaN(Number(varValueRaw))) {
              finalValue = parseFloat(varValueRaw);
            } else {
              finalValue = varValueRaw;
            }
          }

          newVariables[varName] = finalValue;
          
          const typeInfo = dataType !== 'any' ? ` (${dataType})` : '';
          const declInfo = declarationType !== 'var' ? `[${declarationType}] ` : '';
          
          if (!error) {
            const displayValue = finalValue === undefined ? 'undefined' : finalValue;
            logMessage = `✅ Set ${declInfo}${varName}${typeInfo} = ${displayValue}`;
          } else {
            logMessage = `⚠️ Set ${declInfo}${varName}${typeInfo} = ${finalValue} (duplicate variable)`;
          }
        }
        break;
      }

      case 'Log': {
        let msg = getParam(['text', 'message']) || '';

        msg = replaceGlobalVariables(msg);

        Object.keys(currentVariables).forEach((key) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          msg = msg.replace(regex, String(currentVariables[key]));
        });

        if (msg && currentVariables[msg] !== undefined) {
          msg = `${msg}: ${currentVariables[msg]}`;
        }

        logMessage = `📝 LOG: ${msg}`;
        break;
      }

      case 'If': {
        const conditionsStr = getParam(['conditions']);
        let conditionText = 'unknown';
        let evaluationResult = false;
        let selectedHandle = 'exit';
        let hasElseBranch = false;
        
        try {
          if (conditionsStr) {
            const conditions = JSON.parse(conditionsStr);
            hasElseBranch = conditions.some((cond: { type: string }) => cond.type === 'else');
            
            for (let i = 0; i < conditions.length; i++) {
              const cond = conditions[i];
              
              if (cond.type === 'if' || cond.type === 'elseif') {
                const condition = cond.condition || 'true';
                const result = evaluateCondition(condition);
                
                if (result) {
                  selectedHandle = cond.type === 'if' ? 'if' : `elseif-${i}`;
                  evaluationResult = true;
                  conditionText = condition;
                  break;
                }
                if (cond.type === 'if') conditionText = condition;
              } else if (cond.type === 'else' && selectedHandle === 'exit') {
                selectedHandle = 'else';
              }
            }
            
            if (!evaluationResult && !hasElseBranch) selectedHandle = 'exit';
          }
        } catch (parseError) {
          console.warn('Failed to parse conditions:', conditionsStr, parseError);
        }
        
        branchHandle = selectedHandle;
        logMessage = `🔀 IF condition: ${conditionText} → ${evaluationResult} (taking ${selectedHandle} branch)`;
        break;
      }

      case 'addTwoNumbers': {
        const val1 = resolve(getParam(['param1', 'a']));
        const val2 = resolve(getParam(['param2', 'b']));
        const sumResult = getParam(['resultVar', 'output']) || 'sum';

        const sum = val1 + val2;
        newVariables[sumResult] = sum;
        logMessage = `➕ Add: ${val1} + ${val2} = ${sum}`;
        break;
      }

      case 'calculateDiscount': {
        const price = resolve(getParam(['price', 'amount']));
        const percent = resolve(getParam(['discountPercent', 'discount']));
        const discResult = getParam(['resultVar', 'output']) || 'finalPrice';

        const discountAmount = price * (percent / 100);
        const finalPrice = price - discountAmount;

        newVariables[discResult] = finalPrice;
        logMessage = `💰 Discount: ${price} - ${percent}% = ${finalPrice.toFixed(2)}`;
        break;
      }

      case 'validateEmail': {
        const email = getParam(['email']) || '';
        const validRes = getParam(['resultVar']) || 'isValid';
        const isValid = email.includes('@');
        newVariables[validRes] = isValid;
        logMessage = `✉️ Validate Email (${email}) → ${isValid}`;
        break;
      }

      case 'fetchUserData': {
        const userId = getParam(['userId']) || '1';
        const userDataVar = getParam(['resultVar']) || 'userData';
        newVariables[userDataVar] = {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
        };
        logMessage = `👤 Fetched user data for ID: ${userId}`;
        break;
      }

      case 'CustomFunction': {
        const funcName = getParam(['functionName']) || 'customFunc';
        const resVar = getParam(['resultVar']) || 'result';
        newVariables[resVar] = 'MOCK_RESULT';
        logMessage = `⚙️ Executed ${funcName}, result saved to ${resVar}`;
        break;
      }

      case 'FetchDB': {
        const query = replaceGlobalVariables(getParam(['query']) || 'SELECT * FROM table');
        const dbVar = getParam(['resultVar', 'variable']) || 'dbResult';
        const connection = getParam(['connection']) || 'default';

        const mockResult = {
          success: true,
          rowCount: 3,
          data: [
            { id: 1, name: 'John Doe', status: 'active' },
            { id: 2, name: 'Jane Smith', status: 'active' },
            { id: 3, name: 'Bob Johnson', status: 'inactive' },
          ],
        };
        
        newVariables[dbVar] = mockResult;
        logMessage = `🗄️ DB Query [${connection}]: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''} → ${dbVar} (${mockResult.rowCount} rows)`;
        break;
      }

      case 'Code':
        logMessage = '💻 Custom Code Executed';
        break;

      case 'ThrowError': {
        const rawError = getParam(['text', 'message']) || 'Error Occurred';
        error = replaceGlobalVariables(rawError);
        logMessage = `❌ ERROR: ${error}`;
        break;
      }

      case 'HandleTransaction':
        logMessage = '📦 Handle Transaction (entering nested flow...)';
        break;

      case 'End':
        logMessage = '🏁 Process Ended';
        break;

      default:
        logMessage = `⏭️ [Skipped] Node Type: ${type}`;
        break;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
    logMessage = `❌ Execution Error: ${error}`;
    console.error('Simulator Error', e);
  }

  return { newVariables, logMessage, error, branchHandle };
};
