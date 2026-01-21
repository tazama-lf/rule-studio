import type { Node } from '@xyflow/react';
import { globalVariables } from './GlobalVariables';

export interface ExecutionResult {
  newVariables: Record<string, unknown>;
  logMessage: string | null;
  error: string | null;
  branchHandle?: string | null; // For If nodes, which branch to take
}

/**
 * Simulates the execution logic of a node and tracks variable state
 */
export const simulateNodeExecution = (
  node: Node,
  currentVariables: Record<string, unknown>
): ExecutionResult => {
  const type = node.data.nodeType as string;
  const params = (node.data.params as Record<string, string>) || {};

  const newVariables = { ...currentVariables };
  let logMessage: string | null = null;
  let error: string | null = null;
  let branchHandle: string | null = null; // Track which branch to take for If nodes

  /**
   * Helper: Resolve global variable paths to actual values
   * Example: "RuleRequest.TenantId" -> "123"
   */
  const resolveGlobalVariable = (path: string): unknown => {
    if (!path || typeof path !== 'string') return path;
    if (!path.startsWith('RuleRequest.') && !path.startsWith('RuleConfig.')) {
      return path;
    }
    
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

  /**
   * Helper: Replace global variable paths in text with their values
   * Supports expressions like: "RuleRequest.amount > 100" -> "50 > 100"
   */
  const replaceGlobalVariables = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    const variablePattern = /(RuleRequest|RuleConfig)\.[[\w.\]]+/g;
    
    return text.replace(variablePattern, (match) => {
      const value = resolveGlobalVariable(match);
      if (value === match) return match;
      return String(value);
    });
  };

  /**
   * Helper: Resolve a value (number or variable reference)
   */
  const resolve = (val: unknown): number => {
    if (val === undefined || val === null || val === '') return 0;

    // Check if it's a number
    const strVal = String(val);
    if (!isNaN(Number(strVal)) && strVal.trim() !== '') {
      return parseFloat(strVal);
    }

    // Check if it's a variable name
    const key = strVal.trim();
    if (currentVariables[key] !== undefined) {
      const varVal = currentVariables[key];
      return typeof varVal === 'number' ? varVal : Number(varVal) || 0;
    }

    return 0; // Default fallback
  };

  /**
   * Helper: Safe parameter lookup with fallback keys
   */
  const getParam = (keys: string[]): string | null => {
    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== '') {
        return params[key];
      }
    }
    return null;
  };

  try {
    switch (type) {
      // BASIC NODES
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
          // Check if variable already exists (duplicate variable warning)
          if (currentVariables[varName] !== undefined) {
            error = `Variable "${varName}" is already declared. Overwriting existing value.`;
            logMessage = `⚠️ WARNING: ${error}`;
            console.warn(logMessage);
          }
          
          let finalValue: unknown;

          // Handle undefined or empty value case
          if (!varValueRaw || varValueRaw.trim() === '' || dataType === 'undefined') {
            finalValue = undefined;
          } else {
            // First check if it's a global variable path
            const globalVarValue = resolveGlobalVariable(varValueRaw);
            if (globalVarValue !== varValueRaw) {
              finalValue = globalVarValue;
            }
            // If value is a variable reference, resolve it
            else if (currentVariables[varValueRaw] !== undefined) {
              finalValue = currentVariables[varValueRaw];
            }
            // Handle based on data type
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
              // Auto-detect number for 'any' type
              finalValue = parseFloat(varValueRaw);
            } else {
              // String or default
              finalValue = varValueRaw;
            }
          }

          newVariables[varName] = finalValue;
          
          // Update log message with type info
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

        // First resolve any global variables in the message
        msg = replaceGlobalVariables(msg);

        // Replace {{ variable }} placeholders with local variables (with optional spaces)
        Object.keys(currentVariables).forEach((key) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          msg = msg.replace(regex, String(currentVariables[key]));
        });

        // Check if message is just a local variable name
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
        let selectedHandle = 'else'; // Default to else
        
        try {
          if (conditionsStr) {
            const conditions = JSON.parse(conditionsStr);
            
            // Evaluate conditions in order: if, then else if, then else
            for (let i = 0; i < conditions.length; i++) {
              const cond = conditions[i];
              
              if (cond.type === 'if') {
                conditionText = cond.condition || 'true';
                
                // Strip {{ }} indicators first
                let evalExpression = conditionText.replace(/\{\{\s*/g, '').replace(/\s*\}\}/g, '');
                
                // First resolve global variables
                evalExpression = replaceGlobalVariables(evalExpression);
                
                // Then replace local variable names with their values for evaluation
                Object.keys(currentVariables).forEach((key) => {
                  const regex = new RegExp(`\\b${key}\\b`, 'g');
                  const value = currentVariables[key];
                  const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                  evalExpression = evalExpression.replace(regex, valueStr);
                });
                
                // Evaluate the condition
                try {
                  evaluationResult = eval(evalExpression);
                  if (evaluationResult) {
                    selectedHandle = 'if';
                    break;
                  }
                } catch (evalError) {
                  console.warn('Failed to evaluate condition:', evalExpression, evalError);
                }
              } else if (cond.type === 'elseif') {
                const elseIfCondition = cond.condition || 'true';
                
                // Strip {{ }} indicators first
                let evalExpression = elseIfCondition.replace(/\{\{\s*/g, '').replace(/\s*\}\}/g, '');
                
                // First resolve global variables
                evalExpression = replaceGlobalVariables(evalExpression);
                
                // Then replace local variable names with their values for evaluation
                Object.keys(currentVariables).forEach((key) => {
                  const regex = new RegExp(`\\b${key}\\b`, 'g');
                  const value = currentVariables[key];
                  const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
                  evalExpression = evalExpression.replace(regex, valueStr);
                });
                
                // Evaluate the condition
                try {
                  const result = eval(evalExpression);
                  if (result) {
                    selectedHandle = `elseif-${i}`;
                    evaluationResult = true;
                    conditionText = elseIfCondition;
                    break;
                  }
                } catch (evalError) {
                  console.warn('Failed to evaluate else if condition:', evalExpression, evalError);
                }
              } else if (cond.type === 'else') {
                selectedHandle = 'else';
                // Else is the fallback, keep evaluationResult as false
              }
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse conditions:', conditionsStr, parseError);
        }
        
        branchHandle = selectedHandle;
        logMessage = `🔀 IF condition: ${conditionText} → ${evaluationResult} (taking ${selectedHandle} branch)`;
        break;
      }

      // FUNCTION NODES
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
        
        // Simulate database fetch with mock data
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
        // Resolve variables in error message
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
