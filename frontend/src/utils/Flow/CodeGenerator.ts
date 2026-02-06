import type { Node, Edge } from '@xyflow/react';
import type { EditableNodeData } from '../../components/RuleBuilder/EditableNode';
import { getNodesInBranch } from '../Common/helpers';
import { getApiNodes, getNodeTemplate } from './nodeTemplateService';
import { getFunctionParameters, generateFunctionArgs } from './functionParameterUtils';

interface NestedCanvasData {
  nodes: Node[];
  edges: Edge[];
}

const stripVariableIndicators = (text: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  if (!text || typeof text !== 'string') return text;
  const stripped = text.replace(/\{\{\s*(.+?)\s*\}\}/g, '$1');
  return normalizeVariableNames(stripped, mode);
};

const normalizeVariableNames = (text: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  if (!text || typeof text !== 'string') return text;

  if (mode === 'rule-builder') {
    return text
      .replace(/\bRuleRequest\b/g, 'req')
      .replace(/\bruleRequest\b/g, 'req')
      .replace(/\bRuleConfig\b/g, 'ruleConfig');
  }
  
  return text;
};

const processCodeTemplate = (
  template: string,
  params: Record<string, string>,
  indent: string = '',
  mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'
): string => {
  if (!template) return '';

  const cleanParams: Record<string, string> = {};
  Object.keys(params).forEach((key) => {
    cleanParams[key] = stripVariableIndicators(params[key] || '', mode);
  });

  let processedCode = template.replace(/\$\{params\.(\w+)\s*\|\|\s*['"]([^'"]*)['"  ]\}/g, (_match, key, defaultValue) => {
    const value = cleanParams[key] || defaultValue;
    if (value.includes('\n') && indent) {
      return value.split('\n').map((line: string, index: number) => {
        return index === 0 ? line : indent + '  ' + line;
      }).join('\n');
    }
    return value;
  });

  processedCode = processedCode.replace(/\$\{params\.(\w+)\}/g, (_match, key) => {
    const value = cleanParams[key] || '';
    if (value.includes('\n') && indent) {
      return value.split('\n').map((line: string, index: number) => {
        return index === 0 ? line : indent + '  ' + line;
      }).join('\n');
    }
    return value;
  });

  processedCode = processedCode.replace(/\$\{indent\}/g, indent);

  return processedCode;
};

const generateFunctionCallCode = (
  node: Node,
  allNodes: Node[],
  indent: string = ''
): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  const functionName = params.function_name || nodeData.function_name;

  if (!functionName) return '';

  const functionParams = getFunctionParameters(functionName, allNodes);
  
  const args = functionParams && functionParams.length > 0 
    ? generateFunctionArgs(functionParams, params)
    : '';

  const storeResult = params.storeResult !== 'false';
  const resultVariable = params.resultVariable || 'result';

  let code = '';
  if (storeResult) {
    code = `const ${resultVariable} = ${functionName}(${args});`;
  } else {
    code = `${functionName}(${args});`;
  }

  if (indent) {
    code = indent + code;
  }

  return code;
};

const generateNodeCode = (
  node: Node, 
  indent: string = '', 
  allNodes?: Node[],
  generationMode?: 'rule-builder' | 'test-case-generate'
): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  const nodeType = nodeData.nodeType;
  const mode = nodeData.mode || nodeData.generation_type;

  const template = getNodeTemplate(nodeType, mode);

  if (nodeType === 'Import') {
    const importStatement = params.importStatement || '';
    return stripVariableIndicators(importStatement, generationMode).trim();
  }

  if (nodeType === 'RuleConfigFactory') {
    return generateRuleConfigFactoryCode(params, indent);
  }

  if (nodeType === 'RuleRequestFactory') {
    return generateRuleRequestFactoryCode(params, indent);
  }

  if (nodeType === 'RuleResultFactory') {
    return generateRuleResultFactoryCode(params, indent);
  }

  if (nodeType === 'DataCacheFactory') {
    return '\n' + generateDataCacheFactoryCode(params, indent);
  }

  if (nodeType === 'If') {
    return generateIfNodeCode(node, indent, generationMode);
  }

  if (nodeType === 'FetchDB') {
    return generateFetchDBCode(params, indent, generationMode);
  }

  if (nodeType === 'SetVariable') {
    return generateSetVariableCode(params, indent, generationMode);
  }

  if (nodeType === 'Log') {
    return generateLogCode(params, indent, generationMode);
  }

  if (nodeType === 'ThrowError') {
    return generateThrowErrorCode(params, indent, generationMode);
  }

  if (nodeType === 'Loop') {
    return generateLoopCode(params, indent, generationMode);
  }

  if (nodeType === 'Exit') {
    return generateExitCode(params, indent, generationMode);
  }

  if (nodeType === 'Ternary') {
    return generateTernaryCode(params, indent, generationMode);
  }

  if (nodeType === 'arrayOp') {
    return generateArrayOpCode(params, indent, generationMode);
  }

  if (nodeType === 'math') {
    return generateMathCode(params, indent, generationMode);
  }

  if (nodeType === 'stringFunc') {
    return generateStringFuncCode(params, indent, generationMode);
  }

  if (nodeType === 'objectOp') {
    return generateObjectOpCode(params, indent, generationMode);
  }

  if (mode === 'call' && (nodeData.function_name || params.function_name)) {
    const dynamicCode = generateFunctionCallCode(node, allNodes || [], indent);
    if (dynamicCode) {
      return dynamicCode;
    }
  }

  if (template && template.call_template) {
    return processCodeTemplate(template.call_template as string, params, indent, generationMode);
  }

  if (template && template.code_template) {
    return processCodeTemplate(template.code_template as string, params, indent, generationMode);
  }

  const nodeDefinition = getApiNodes().find((n) => {
    const nodeJson = n.node_json as { node_type?: string };
    return nodeJson.node_type === nodeType;
  });

  if (nodeDefinition) {
    const nodeJson = nodeDefinition.node_json as { code_template?: string };
    if (nodeJson?.code_template && typeof nodeJson.code_template === 'string') {
      return processCodeTemplate(nodeJson.code_template, params, indent, generationMode);
    }
  }

  return `${indent}// ${nodeType} - ${nodeData.label}`;
};

const generateRuleConfigFactoryCode = (params: Record<string, string>, indent: string): string => {
  const factoryName = params.factoryName || 'getRuleConfig';
  const ruleConfigData = params.ruleConfigData || '';
  
  if (!ruleConfigData) {
    return `${indent}const ${factoryName} = (): RuleConfig => {\n${indent}  return {} as RuleConfig;\n${indent}};`;
  }
  
  try {
    // Parse the RuleConfig data
    const ruleConfig = JSON.parse(ruleConfigData);
    
    // Format the object with proper indentation
    const formatObject = (obj: unknown, currentIndent: string): string => {
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        const items = obj.map(item => `${currentIndent}  ${formatObject(item, currentIndent + '  ')}`).join(',\n');
        return `[\n${items},\n${currentIndent}]`;
      }
      
      if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';
        const props = entries.map(([key, value]) => {
          const formattedValue = formatObject(value, currentIndent + '  ');
          return `${currentIndent}  ${key}: ${formattedValue}`;
        }).join(',\n');
        return `{\n${props},\n${currentIndent}}`;
      }
      
      return 'undefined';
    };
    
    const formattedConfig = formatObject(ruleConfig, indent + '  ');
    
    return `${indent}const ${factoryName} = (): RuleConfig => {\n${indent}  return ${formattedConfig};\n${indent}};`;
  } catch (error) {
    console.error('Error parsing RuleConfig data:', error);
    return `${indent}const ${factoryName} = (): RuleConfig => {\n${indent}  // Error parsing RuleConfig data\n${indent}  return {} as RuleConfig;\n${indent}};`;
  }
};

const generateRuleRequestFactoryCode = (params: Record<string, string>, indent: string): string => {
  const factoryName = params.factoryName || 'getMockRequest';
  const ruleRequestData = params.ruleRequestData || '';
  
  if (!ruleRequestData) {
    return `${indent}const ${factoryName} = (): RuleRequest => {\n${indent}  const quote = {\n${indent}    transaction: JSON.parse(''),\n${indent}    networkMap: JSON.parse(''),\n${indent}    DataCache: JSON.parse(''),\n${indent}  };\n${indent}  return quote;\n${indent}};`;
  }
  
  // If it's already transformed code (from Monaco editor), use it directly
  if (ruleRequestData.includes('JSON.parse') || ruleRequestData.includes('const quote')) {
    // Remove leading/trailing whitespace but preserve internal formatting
    const codeLines = ruleRequestData.split('\n').map(line => `${indent}${line}`).join('\n');
    return `${indent}const ${factoryName} = (): RuleRequest => {\n${codeLines}\n${indent}};`;
  }
  
  // Otherwise, treat it as JSON and transform it
  try {
    const ruleRequest = JSON.parse(ruleRequestData);
    
    // Transform into the required format with proper escaping
    const transactionStr = ruleRequest.transaction ? JSON.stringify(ruleRequest.transaction) : '';
    const networkMapStr = ruleRequest.networkMap ? JSON.stringify(ruleRequest.networkMap) : '';
    const dataCacheStr = ruleRequest.DataCache ? JSON.stringify(ruleRequest.DataCache) : '';
    
    // Escape for template literals and single quotes
    const escapeForTemplate = (str: string) => str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const escapeForSingleQuote = (str: string) => str.replace(/'/g, "\\'");
    
    return `${indent}const ${factoryName} = (): RuleRequest => {\n${indent}  const quote = {\n${indent}    transaction: JSON.parse(\n${indent}      \`${escapeForTemplate(transactionStr)}\`,\n${indent}    ),\n${indent}    networkMap: JSON.parse(\n${indent}      '${escapeForSingleQuote(networkMapStr)}',\n${indent}    ),\n${indent}    DataCache: JSON.parse(\n${indent}      '${escapeForSingleQuote(dataCacheStr)}',\n${indent}    ),\n${indent}  };\n${indent}  return quote;\n${indent}};`;
  } catch (error) {
    console.error('Error parsing RuleRequest data:', error);
    return `${indent}const ${factoryName} = (): RuleRequest => {\n${indent}  // Error parsing RuleRequest data\n${indent}  return {} as RuleRequest;\n${indent}};`;
  }
};

const generateRuleResultFactoryCode = (params: Record<string, string>, indent: string): string => {
  const factoryName = params.factoryName || 'getRuleResult';
  const ruleResultData = params.ruleResultData || '';
  
  if (!ruleResultData) {
    return `${indent}const ${factoryName} = (): RuleResult => {\n${indent}  return {} as RuleResult;\n${indent}};`;
  }
  
  try {
    const ruleResult = JSON.parse(ruleResultData);
    
    const formatObject = (obj: unknown, currentIndent: string): string => {
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        const items = obj.map(item => `${currentIndent}  ${formatObject(item, currentIndent + '  ')}`).join(',\n');
        return `[\n${items},\n${currentIndent}]`;
      }
      
      if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';
        const props = entries.map(([key, value]) => {
          const formattedValue = formatObject(value, currentIndent + '  ');
          return `${currentIndent}  ${key}: ${formattedValue}`;
        }).join(',\n');
        return `{\n${props},\n${currentIndent}}`;
      }
      
      return 'undefined';
    };
    
    const formattedResult = formatObject(ruleResult, indent + '  ');
    
    return `${indent}const ${factoryName} = (): RuleResult => {\n${indent}  return ${formattedResult};\n${indent}};`;
  } catch (error) {
    console.error('Error parsing RuleResult data:', error);
    return `${indent}const ${factoryName} = (): RuleResult => {\n${indent}  // Error parsing RuleResult data\n${indent}  return {} as RuleResult;\n${indent}};`;
  }
};

const generateDataCacheFactoryCode = (params: Record<string, string>, indent: string): string => {
  const variableName = params.variableName || 'dataCache';
  const dataCacheData = params.dataCacheData || '';
  
  if (!dataCacheData) {
    return `${indent}const ${variableName}: DataCache = {};`;
  }
  
  try {
    const dataCache = JSON.parse(dataCacheData);
    
    const formatObject = (obj: unknown, currentIndent: string): string => {
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        const items = obj.map(item => `${currentIndent}  ${formatObject(item, currentIndent + '  ')}`).join(',\n');
        return `[\n${items},\n${currentIndent}]`;
      }
      
      if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';
        const props = entries.map(([key, value]) => {
          const formattedValue = formatObject(value, currentIndent + '  ');
          return `${currentIndent}  ${key}: ${formattedValue}`;
        }).join(',\n');
        return `{\n${props},\n${currentIndent}}`;
      }
      
      return 'undefined';
    };
    
    const formattedDataCache = formatObject(dataCache, indent);
    
    return `${indent}const ${variableName}: DataCache = ${formattedDataCache};`;
  } catch (error) {
    console.error('Error parsing DataCache data:', error);
    return `${indent}const ${variableName}: DataCache = {};\n${indent}// Error parsing DataCache data`;
  }
};

const generateSetVariableCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const varName = params.name || params.variableName || 'variable';
  const declarationType = params.declarationType || 'var';
  const dataType = params.dataType || 'any';
  const originalValue = params.value || params.variableValue || '';

  const isVariableReference = /\{\{\s*.+?\s*\}\}/.test(originalValue);
  const varValue = stripVariableIndicators(originalValue, mode);

  if (!varValue || varValue.trim() === '' || dataType === 'undefined') {
    return `${indent}${declarationType} ${varName};`;
  }

  let valueStr: string;

  if (isVariableReference) {
    valueStr = varValue;
  } else {
    const isNumber = !isNaN(Number(varValue)) && varValue.trim() !== '';
    
    if (dataType === 'number' && isNumber) {
      valueStr = varValue;
    } else if (dataType === 'boolean') {
      valueStr = varValue.toLowerCase() === 'true' || varValue === '1' ? 'true' : 'false';
    } else if (dataType === 'array') {
      valueStr = varValue.trim().startsWith('[') ? varValue : `[${varValue}]`;
    } else if (dataType === 'object') {
      valueStr = varValue.trim().startsWith('{') ? varValue : `{${varValue}}`;
    } else if (isNumber && dataType === 'any') {
      valueStr = varValue;
    } else if (varValue.includes('$')) {
      valueStr = `\`${varValue.replace(/`/g, '\\`')}\``;
    } else {
      valueStr = varValue.startsWith('"') || varValue.startsWith("'") ? varValue : `"${varValue}"`;
    }
  }
  
  return `${indent}${declarationType} ${varName} = ${valueStr};`;
};

const generateLogCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  let message = params.text || params.message || '';
  const hasVariables = /\{\{\s*.+?\s*\}\}/.test(message);
  message = message.replace(/^['"]|['"]$/g, '').trim();
  
  let messageStr: string;
  
  if (!message) {
    messageStr = "''";
  } else if (hasVariables) {
    const onlyVariableMatch = message.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/);
    if (onlyVariableMatch) {
      messageStr = normalizeVariableNames(onlyVariableMatch[1].trim(), mode);
    } else {
      const interpolatedMessage = message.replace(/\{\{\s*(.+?)\s*\}\}/g, (_, varName) => `\${${normalizeVariableNames(varName, mode)}}`);
      messageStr = `\`${interpolatedMessage.replace(/`/g, '\\`')}\``;
    }
  } else {
    messageStr = `'${message.replace(/'/g, "\\'")}'`;
  }
  
  return `${indent}loggerService.log(${messageStr}, context, msgId);`;
};

const generateThrowErrorCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  let message = params.text || params.message || 'Error occurred';
  const hasVariables = /\{\{\s*.+?\s*\}\}/.test(message);
  message = message.replace(/^['"]|['"]$/g, '').trim();
  
  let messageStr: string;
  
  if (!message) {
    messageStr = "'Error occurred'";
  } else if (hasVariables) {
    const onlyVariableMatch = message.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/);
    if (onlyVariableMatch) {
      messageStr = normalizeVariableNames(onlyVariableMatch[1].trim(), mode);
    } else {
      const interpolatedMessage = message.replace(/\{\{\s*(.+?)\s*\}\}/g, (_, varName) => `\${${normalizeVariableNames(varName, mode)}}`);
      messageStr = `\`${interpolatedMessage.replace(/`/g, '\\`')}\``;
    }
  } else {
    messageStr = `'${message.replace(/'/g, "\\'")}'`;
  }
  
  return `${indent}throw new Error(${messageStr});`;
};


const generateExitCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const exitType = params.exitType || 'break';
  
  if (exitType === 'return') {
    const returnValue = params.returnValue?.trim() || '';
    if (returnValue) {
      const cleanedValue = stripVariableIndicators(returnValue, mode);
      return `${indent}return ${cleanedValue};`;
    }
    return `${indent}return;`;
  } else if (exitType === 'continue') {
    return `${indent}continue;`;
  } else { // break
    return `${indent}break;`;
  }
};

interface TernaryBranch {
  type: 'value' | 'nested';
  value?: string;
  nested?: TernaryNode;
}

interface TernaryNode {
  condition: string;
  trueValue: TernaryBranch;
  falseValue: TernaryBranch;
}

const generateTernaryCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const storeResult = params.storeResult !== 'false';
  const resultVar = params.resultVar || 'ternaryResult';
  
  try {
    const treeStr = params.ternaryTree || 
      '{"condition":"true","trueValue":{"type":"value","value":"\'yes\'"},"falseValue":{"type":"value","value":"\'no\'"}}';
    const tree = JSON.parse(treeStr) as TernaryNode;

    const buildTernaryExpression = (node: TernaryNode): string => {
      const condition = stripVariableIndicators(node.condition || 'true', mode);

      let trueExpr: string;
      if (node.trueValue.type === 'value') {
        trueExpr = stripVariableIndicators(node.trueValue.value || 'null', mode);
      } else if (node.trueValue.nested) {
        trueExpr = `(${buildTernaryExpression(node.trueValue.nested)})`;
      } else {
        trueExpr = 'null';
      }

      let falseExpr: string;
      if (node.falseValue.type === 'value') {
        falseExpr = stripVariableIndicators(node.falseValue.value || 'null', mode);
      } else if (node.falseValue.nested) {
        falseExpr = `(${buildTernaryExpression(node.falseValue.nested)})`;
      } else {
        falseExpr = 'null';
      }
      
      return `${condition} ? ${trueExpr} : ${falseExpr}`;
    };
    
    const ternaryExpression = buildTernaryExpression(tree);
    
    if (storeResult) {
      return `${indent}const ${resultVar} = ${ternaryExpression};`;
    } else {
      return `${indent}${ternaryExpression};`;
    }
  } catch (error) {
    console.error('Error parsing ternary tree:', error);
    const expression = "'error'";
    return storeResult 
      ? `${indent}const ${resultVar} = ${expression}; // Error parsing ternary tree`
      : `${indent}${expression}; // Error parsing ternary tree`;
  }
};

const generateArrayOpCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const array = stripVariableIndicators(params.array || 'arr', mode);
  const operation = params.operation || 'pop';
  const value = stripVariableIndicators(params.value || '', mode);
  const resultVar = params.resultVar || 'arrayOpResult';
  
  if (operation === 'length') {
    return `${indent}const ${resultVar} = ${array}.length;`;
  }

  const needsValue = operation === 'push' || operation === 'concat' || operation === 'findIndex';
  const operationCall = needsValue && value ? `${operation}(${value})` : `${operation}()`;
  
  return `${indent}const ${resultVar} = ${array}.${operationCall};`;
};

const generateMathCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const method = params.method || 'sqrt';
  const value = stripVariableIndicators(params.value || '0', mode);
  const value2 = params.value2 ? stripVariableIndicators(params.value2, mode) : '';
  const resultVar = params.resultVar || 'mathResult';
  const methodArgs = method === 'pow' && value2 ? `${value}, ${value2}` : value;
  
  return `${indent}const ${resultVar} = Math.${method}(${methodArgs});`;
};

const generateStringFuncCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const method = params.method || 'trim';
  const text = stripVariableIndicators(params.text || '""', mode);
  const separator = params.separator ? stripVariableIndicators(params.separator, mode) : '';
  const start = params.start || '';
  const end = params.end || '';
  const resultVar = params.resultVar || 'stringResult';
  
  if (method === 'length') {
    return `${indent}const ${resultVar} = ${text}.length;`;
  }
  
  let methodCall = '';
  
  if (method === 'split') {
    methodCall = separator ? `${method}(${separator})` : `${method}('')`;
  } else if (method === 'slice' || method === 'substring') {
    if (end) {
      methodCall = `${method}(${start}, ${end})`;
    } else if (start) {
      methodCall = `${method}(${start})`;
    } else {
      methodCall = `${method}(0)`;
    }
  } else {
    methodCall = `${method}()`;
  }
  
  return `${indent}const ${resultVar} = ${text}.${methodCall};`;
};

const generateObjectOpCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const operation = params.operation || 'keys';
  const obj = stripVariableIndicators(params.object || 'obj', mode);
  const resultVar = params.resultVar || 'objectResult';
  
  if (operation === 'destructure') {
    const keys = params.keys || 'prop1, prop2';
    return `${indent}const { ${keys} } = ${obj};`;
  }
  
  if (operation === 'hasOwnProperty') {
    const property = params.property ? stripVariableIndicators(params.property, mode) : 'prop';
    return `${indent}const ${resultVar} = ${obj}.hasOwnProperty(${property});`;
  }
  
  if (operation === 'assign') {
    const sources = params.sourceObjects ? `, ${stripVariableIndicators(params.sourceObjects, mode)}` : '';
    return `${indent}const ${resultVar} = Object.assign(${obj}${sources});`;
  }
  
  return `${indent}const ${resultVar} = Object.${operation}(${obj});`;
};

const generateFetchDBCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const resultVar = params.resultVar || params.variable || 'dbResult';
  const queryVar = params.queryVar || 'query';
  const query = params.query || 'SELECT * FROM table';
  
  const varPattern = /\{\{\s*(.+?)\s*\}\}/g;
  const globalVars: string[] = [];
  let parameterizedQuery = query;
  
  const matches = [...query.matchAll(varPattern)];
  if (matches.length > 0) {
    const uniqueVars = Array.from(new Set(matches.map(m => m[1])));
    uniqueVars.forEach((varPath, index) => {
      const normalizedVarPath = normalizeVariableNames(varPath, mode);
      globalVars.push(normalizedVarPath);
      const placeholder = `$${index + 1}`;
      const escapedVar = varPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      parameterizedQuery = parameterizedQuery.replace(new RegExp(`\\{\\{\\s*${escapedVar}\\s*\\}\\}`, 'g'), placeholder);
    });
  }
  
  const lines = [
    `${indent}// Define parameterized query`,
    `${indent}const ${queryVar} = \`${parameterizedQuery.replace(/`/g, '\\`')}\`;`,
    '',
  ];
  
  if (globalVars.length > 0) {
    lines.push(`${indent}// Execute query with parameters`);
    lines.push(`${indent}const ${resultVar} = await databaseManager._eventHistory.query<{ [key: string]: unknown }>(${queryVar}, [`);
    globalVars.forEach((varPath, index) => {
      const comma = index < globalVars.length - 1 ? ',' : '';
      lines.push(`${indent}  ${varPath}${comma}`);
    });
    lines.push(`${indent}]);`);
  } else {
    lines.push(`${indent}// Execute query without parameters`);
    lines.push(`${indent}const ${resultVar} = await databaseManager._eventHistory.query<{ [key: string]: unknown }>(${queryVar});`);
  }
  
  return lines.join('\n');
};

const generateIfNodeCode = (node: Node, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  
  try {
    const conditionsStr = params.conditions || JSON.stringify([{ type: 'if', condition: 'true' }]);
    const conditions = JSON.parse(conditionsStr);
    
    let code = '';
    conditions.forEach((cond: { type: string; condition?: string }) => {
      const conditionText = cond.condition || 'true';
      const cleanCondition = normalizeVariableNames(stripVariableIndicators(conditionText, mode), mode);
      
      const branchBody = `\n${indent}  // Add logic here`;
      
      if (cond.type === 'if') {
        code += `${indent}if (${cleanCondition}) {${branchBody}\n${indent}}`;
      } else if (cond.type === 'elseif') {
        code += ` else if (${cleanCondition}) {${branchBody}\n${indent}}`;
      } else if (cond.type === 'else') {
        code += ` else {${branchBody}\n${indent}}`;
      }
    });
    
    return code;
  } catch {
    return `${indent}if (true) {\n${indent}  // Add logic here\n${indent}}`;
  }
};

const generateLoopCode = (params: Record<string, string>, indent: string, mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'): string => {
  const loopType = params.loopType || 'forEach';
  const arrayVariable = stripVariableIndicators(params.arrayVariable || 'items', mode);
  const itemVariable = params.itemVariable || 'item';
  const indexVariable = params.indexVariable || '';
  const resultVariable = params.resultVariable || 'loopResult';
  const filterCondition = stripVariableIndicators(params.filterCondition || '', mode);
  const condition = stripVariableIndicators(params.condition || '', mode);
  const loopBody = stripVariableIndicators(params.loopBody || '// Custom logic here', mode);
  
  const lines: string[] = [];
  
  lines.push(`${indent}// Loop: ${loopType} over ${arrayVariable}`);
  
  switch (loopType) {
    case 'forEach': {
      const forEachParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      lines.push(`${indent}${arrayVariable}.forEach((${forEachParams}) => {`);
      if (condition) {
        lines.push(`${indent}  if (${condition}) {`);
        lines.push(`${indent}    ${loopBody}`);
        lines.push(`${indent}  }`);
      } else {
        lines.push(`${indent}  ${loopBody}`);
      }
      lines.push(`${indent}});`);
      break;
    }
      
    case 'for':
      lines.push(`${indent}for (let ${indexVariable} = 0; ${indexVariable} < ${arrayVariable}.length; ${indexVariable}++) {`);
      lines.push(`${indent}  ${loopBody}`);
      lines.push(`${indent}}`);
      break;
      
    case 'map': {
      const mapParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      lines.push(`${indent}const ${resultVariable} = ${arrayVariable}.map((${mapParams}) => {`);
      lines.push(`${indent}  ${loopBody}`);
      if (condition) {
        lines.push(`${indent}  return ${condition};`);
      } else {
        lines.push(`${indent}  return ${itemVariable};`);
      }
      lines.push(`${indent}});`);
      break;
    }
      
    case 'while': {
      lines.push(`${indent}let ${indexVariable} = 0;`);
      const whileCondition = `${indexVariable} < ${arrayVariable}.length`;
      lines.push(`${indent}while (${whileCondition}) {`);
      lines.push(`${indent}  ${loopBody}`);
      lines.push(`${indent}  ${indexVariable}++;`);
      lines.push(`${indent}}`);
      break;
    }
      
    case 'filter': {
      const filterParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      lines.push(`${indent}const ${resultVariable} = ${arrayVariable}.filter((${filterParams}) => {`);
      if (filterCondition) {
        lines.push(`${indent}  return ${filterCondition};`);
      } else {
        lines.push(`${indent}  return true;`);
      }
      lines.push(`${indent}});`);
      break;
    }
      
    default:
      lines.push(`${indent}// Unsupported loop type: ${loopType}`);
  }
  
  return lines.join('\n');
};

const processExitEdge = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  indent: string,
  processedNodes: Set<string>,
  mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'
): string => {
  const exitEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'exit');
  if (!exitEdge) return '';
  
  const exitNode = nodes.find((n) => n.id === exitEdge.target);
  if (!exitNode || processedNodes.has(exitNode.id)) return '';
  
  processedNodes.add(exitNode.id);
  const exitNodeData = exitNode.data as EditableNodeData;
  
  if (exitNodeData.nodeType === 'End') return '';
  
  return generateNodeCodeRecursive(exitNode, nodes, edges, indent, processedNodes, mode);
};

const processNextNode = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  indent: string,
  processedNodes: Set<string>,
  mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'
): string => {
  const nextEdge = edges.find((e) => e.source === nodeId);
  if (!nextEdge) return '';
  
  const nextNode = nodes.find((n) => n.id === nextEdge.target);
  if (!nextNode || processedNodes.has(nextNode.id)) return '';
  
  processedNodes.add(nextNode.id);
  const nextNodeData = nextNode.data as EditableNodeData;
  
  if (nextNodeData.nodeType === 'End') return '';
  
  return generateNodeCodeRecursive(nextNode, nodes, edges, indent, processedNodes, mode);
};

const generateLoopCodeWithBody = (
  params: Record<string, string>,
  innerCode: string,
  indent: string,
  mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'
): string => {
  const loopType = params.loopType || 'forEach';
  const arrayVariable = stripVariableIndicators(params.arrayVariable || 'items', mode);
  const itemVariable = params.itemVariable || 'item';
  const indexVariable = params.indexVariable || '';
  const resultVariable = params.resultVariable || 'loopResult';
  const filterCondition = stripVariableIndicators(params.filterCondition || '', mode);
  const condition = stripVariableIndicators(params.condition || '', mode);

  let loopCode = `${indent}// Loop: ${loopType} over ${arrayVariable}\n`;
  
  const indentInnerCode = (code: string): string => {
    return code.split('\n').map(line => line ? `${indent}  ${line.trimStart()}` : '').join('\n');
  };
  
  switch (loopType) {
    case 'forEach': {
      const forEachParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      loopCode += `${indent}${arrayVariable}.forEach((${forEachParams}) => {\n`;
      if (condition && innerCode) {
        loopCode += `${indent}  if (${condition}) {\n`;
        loopCode += indentInnerCode(innerCode).split('\n').map(line => line ? `  ${line}` : '').join('\n') + '\n';
        loopCode += `${indent}  }\n`;
      } else if (innerCode) {
        loopCode += indentInnerCode(innerCode) + '\n';
      }
      loopCode += `${indent}});`;
      break;
    }
      
    case 'for': {
      const loopIndexVar = indexVariable || 'i';
      const initialization = stripVariableIndicators(params.initialization || `${loopIndexVar} = 0`, mode);
      const loopCondition = stripVariableIndicators(params.loopCondition || `${loopIndexVar} < ${arrayVariable}.length`, mode);
      const incrementOp = params.incrementOperation || 'i++';
      const customIncrement = stripVariableIndicators(params.customIncrement || '', mode);
      const incrementStatement = incrementOp === 'custom' ? customIncrement : incrementOp.replace('i', loopIndexVar);
      
      loopCode += `${indent}for (let ${initialization}; ${loopCondition}; ${incrementStatement}) {\n`;
      if (innerCode) loopCode += indentInnerCode(innerCode) + '\n';
      loopCode += `${indent}}`;
      break;
    }
      
    case 'while': {
      const whileCustomCondition = stripVariableIndicators(params.loopCondition || '', mode);
      const loopIndexVar = indexVariable || 'i';
      
      if (whileCustomCondition) {
        loopCode += `${indent}while (${whileCustomCondition}) {\n`;
      } else {
        loopCode += `${indent}let ${loopIndexVar} = 0;\n`;
        const whileCondition = `${loopIndexVar} < ${arrayVariable}.length`;
        loopCode += `${indent}while (${whileCondition}) {\n`;
      }
      
      if (innerCode) loopCode += indentInnerCode(innerCode) + '\n';
      if (!whileCustomCondition) loopCode += `${indent}  ${loopIndexVar}++;\n`;
      loopCode += `${indent}}`;
      break;
    }
      
    case 'map': {
      const mapParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.map((${mapParams}) => {\n`;
      if (innerCode) loopCode += indentInnerCode(innerCode) + '\n';
      if (condition) {
        loopCode += `${indent}  return ${condition};\n${indent}});`;
      } else {
        loopCode += `${indent}  return ${itemVariable};\n${indent}});`;
      }
      break;
    }
      
    case 'filter': {
      const filterParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.filter((${filterParams}) => {\n`;
      loopCode += `${indent}  return ${filterCondition || 'true'};\n${indent}});`;
      break;
    }

    case 'every': {
      const condition = stripVariableIndicators(params.condition || 'true', mode);
      const everyParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.every((${everyParams}) => ${condition});`;
      break;
    }

    case 'some': {
      const condition = stripVariableIndicators(params.condition || 'true', mode);
      const someParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.some((${someParams}) => ${condition});`;
      break;
    }

    case 'find': {
      const condition = stripVariableIndicators(params.condition || 'true', mode);
      const findParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.find((${findParams}) => ${condition});`;
      break;
    }

    case 'reduce': {
      const reduceLogic = stripVariableIndicators(params.reduceLogic || 'return acc;', mode);
      const initialValue = stripVariableIndicators(params.initialValue || '0', mode);
      const reduceParams = indexVariable ? `acc, ${itemVariable}, ${indexVariable}` : `acc, ${itemVariable}`;
      loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.reduce((${reduceParams}) => {\n`;
      loopCode += `${indent}  ${reduceLogic}\n${indent}}, ${initialValue});`;
      break;
    }
      
    default:
      loopCode += `${indent}// Unknown loop type: ${loopType}`;
  }
  
  return loopCode;
};

const generateNodeCodeRecursive = (
  node: Node,
  nodes: Node[],
  edges: Edge[],
  indent: string,
  processedNodes: Set<string>,
  mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'
): string => {
  const nodeData = node.data as EditableNodeData;

  if (nodeData.nodeType === 'If') {
    try {
      const params = nodeData.params || {};
      const conditionsStr = params.conditions || JSON.stringify([{ type: 'if', condition: 'true' }]);
      const conditions = JSON.parse(conditionsStr);
      
      const codeLines: string[] = [];
      let ifCode = '';
      
      for (let i = 0; i < conditions.length; i++) {
        const cond = conditions[i];
        const handleId = cond.type === 'else' ? 'else' : cond.type === 'if' ? 'if' : `elseif-${i}`;

        const branchNodes = getNodesInBranch(node.id, handleId, nodes, edges, new Set(processedNodes));
        branchNodes.forEach((n) => processedNodes.add(n.id));

        const branchCode = branchNodes
          .map((n) => generateNodeCodeRecursive(n, nodes, edges, indent + '  ', processedNodes, mode))
          .filter(Boolean)
          .join('\n');
        
        const branchBody = branchCode || `${indent}  // Add logic here`;
        
        if (cond.type === 'if') {
          const cleanCondition = normalizeVariableNames(stripVariableIndicators(cond.condition || 'true', mode), mode);
          ifCode += `${indent}if (${cleanCondition}) {\n${branchBody}\n${indent}}`;
        } else if (cond.type === 'elseif') {
          const cleanCondition = normalizeVariableNames(stripVariableIndicators(cond.condition || 'true', mode), mode);
          ifCode += ` else if (${cleanCondition}) {\n${branchBody}\n${indent}}`;
        } else if (cond.type === 'else') {
          ifCode += ` else {\n${branchBody}\n${indent}}`;
        }
      }
      
      codeLines.push(ifCode);
  
      const exitCode = processExitEdge(node.id, nodes, edges, indent, processedNodes);
      if (exitCode) codeLines.push(exitCode);
      
      return codeLines.filter(Boolean).join('\n');
    } catch {
      return `${indent}// Error parsing If node conditions`;
    }
  }
  
  if (nodeData.nodeType === 'Loop') {
    const params = nodeData.params || {};
    const loopBodyNodes = getNodesInBranch(node.id, 'loopBody', nodes, edges, new Set(processedNodes));
    loopBodyNodes.forEach((n) => processedNodes.add(n.id));

    const innerCode = loopBodyNodes
      .map((n) => generateNodeCodeRecursive(n, nodes, edges, indent + '  ', processedNodes, mode))
      .filter(Boolean)
      .join('\n');

    const loopCode = generateLoopCodeWithBody(params, innerCode, indent, mode);
    const exitCode = processExitEdge(node.id, nodes, edges, indent, processedNodes, mode);
    
    return [loopCode, exitCode].filter(Boolean).join('\n');
  }

  if (nodeData.nodeType === 'Describe') {
    const params = nodeData.params || {};
    const describeName = params.describeName || 'test suite';
    
    const bodyNodes = getNodesInBranch(node.id, 'body', nodes, edges, new Set(processedNodes));
    
    // Mark body nodes as processed to prevent duplicate processing
    bodyNodes.forEach((n) => processedNodes.add(n.id));

    const innerCode = bodyNodes
      .map((n) => generateNodeCodeRecursive(n, nodes, edges, indent + '  ', processedNodes))
      .filter(Boolean)
      .join('\n');

    let describeCode = `${indent}describe('${describeName}', () => {\n`;
    if (innerCode) {
      describeCode += innerCode + '\n';
    }
    describeCode += `${indent}});`;

    const exitCode = processExitEdge(node.id, nodes, edges, indent, processedNodes);
    
    return [describeCode, exitCode].filter(Boolean).join('\n');
  }
  
  // For regular nodes
  const nodeCode = generateNodeCode(node, indent, nodes, mode);
  const nextCode = processNextNode(node.id, nodes, edges, indent, processedNodes);
  
  return [nodeCode, nextCode].filter(Boolean).join('\n');
};

const generateNestedFlowCode = (
  nodes: Node[], 
  edges: Edge[], 
  indent: string = '  ',
  mainCanvasNodes: Node[] = [],
  mode: 'rule-builder' | 'test-case-generate' = 'test-case-generate'
): string => {
  const codeLines: string[] = [];
  const processedNodes = new Set<string>();
  
  const allNodes = [...mainCanvasNodes, ...nodes];
  
  const startNode = nodes.find((n) => (n.data as EditableNodeData).nodeType === 'Start');
  if (!startNode) return `${indent}// No start node found`;
  
  const processNode = (nodeId: string): void => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || processedNodes.has(node.id)) return;
    
    processedNodes.add(node.id);
    const nodeData = node.data as EditableNodeData;
    
    if (nodeData.nodeType === 'Start' || nodeData.nodeType === 'End') {
      const nextEdge = edges.find((e) => e.source === nodeId);
      if (nextEdge) processNode(nextEdge.target);
      return;
    }
    
    if (nodeData.nodeType === 'Loop') {
      processedNodes.add(node.id);
      const params = nodeData.params || {};

      const loopBodyNodes = getNodesInBranch(node.id, 'loopBody', nodes, edges, new Set(processedNodes));
      loopBodyNodes.forEach((n) => processedNodes.add(n.id));

      const innerCode = loopBodyNodes
        .map((n) => generateNodeCodeRecursive(n, allNodes, edges, indent + '  ', processedNodes, mode))
        .filter(Boolean)
        .join('\n');

      const loopCode = generateLoopCodeWithBody(params, innerCode, indent, mode);
      codeLines.push(loopCode);
      
      const exitEdge = edges.find((e) => e.source === node.id && e.sourceHandle === 'exit');
      if (exitEdge) processNode(exitEdge.target);
      return;
    }

    if (nodeData.nodeType === 'Describe') {
      processedNodes.add(node.id);
      const params = nodeData.params || {};
      const describeName = params.describeName || 'test suite';

      const bodyNodes = getNodesInBranch(node.id, 'body', nodes, edges, new Set(processedNodes));
      
      // Use a fresh processedNodes set for the body to allow nested describes
      const bodyProcessedNodes = new Set<string>(processedNodes);
      bodyNodes.forEach((n) => bodyProcessedNodes.add(n.id));

      const innerCode = bodyNodes
        .map((n) => generateNodeCodeRecursive(n, nodes, edges, indent + '  ', bodyProcessedNodes, mode))
        .filter(Boolean)
        .join('\n');

      let describeCode = `${indent}describe('${describeName}', () => {\n`;
      if (innerCode) {
        describeCode += innerCode + '\n';
      }
      describeCode += `${indent}});`;
      
      codeLines.push(describeCode);
      
      // Mark all body nodes as processed in the main set too
      bodyNodes.forEach((n) => processedNodes.add(n.id));
      
      const exitEdge = edges.find((e) => e.source === node.id && e.sourceHandle === 'exit');
      if (exitEdge) processNode(exitEdge.target);
      return;
    }
    
    if (nodeData.nodeType === 'If') {
      try {
        const params = nodeData.params || {};
        const conditionsStr = params.conditions || JSON.stringify([{ type: 'if', condition: 'true' }]);
        const conditions = JSON.parse(conditionsStr);
        
        let ifCode = '';
        
        for (let i = 0; i < conditions.length; i++) {
          const cond = conditions[i];
          const handleId = cond.type === 'else' ? 'else' : cond.type === 'if' ? 'if' : `elseif-${i}`;
          
          const branchNodes = getNodesInBranch(node.id, handleId, nodes, edges, new Set(processedNodes));
          branchNodes.forEach((n) => processedNodes.add(n.id));
          
          const branchCode = branchNodes
            .map((n) => generateNodeCodeRecursive(n, nodes, edges, indent + '  ', processedNodes, mode))
            .filter(Boolean)
            .join('\n');
          
          const branchBody = branchCode || `${indent}  // Add logic here`;
          
          if (cond.type === 'if') {
            const cleanCondition = normalizeVariableNames(stripVariableIndicators(cond.condition || 'true', mode), mode);
            ifCode += `${indent}if (${cleanCondition}) {\n`;
            ifCode += branchBody + '\n';
            ifCode += `${indent}}`;
          } else if (cond.type === 'elseif') {
            const cleanCondition = normalizeVariableNames(stripVariableIndicators(cond.condition || 'true', mode), mode);
            ifCode += ` else if (${cleanCondition}) {\n`;
            ifCode += branchBody + '\n';
            ifCode += `${indent}}`;
          } else if (cond.type === 'else') {
            ifCode += ` else {\n`;
            ifCode += branchBody + '\n';
            ifCode += `${indent}}`;
          }
        }
        
        codeLines.push(ifCode);
        
        const exitEdge = edges.find((e) => e.source === node.id && e.sourceHandle === 'exit');
        if (exitEdge) processNode(exitEdge.target);
      } catch {
        codeLines.push(`${indent}// Error parsing If node conditions`);
      }
    } else {
      const code = generateNodeCode(node, indent, allNodes, mode);
      if (code) {
        // Add consistent blank line between all statements (except the first)
        if (codeLines.length > 0 && codeLines[codeLines.length - 1] !== '') {
          codeLines.push('');
        }
        codeLines.push(code);
      }
      
      const nextEdge = edges.find((e) => e.source === nodeId);
      if (nextEdge) processNode(nextEdge.target);
    }
  };
  
  processNode(startNode.id);
  
  return codeLines.join('\n');
};

const generateFunctionDefinition = (node: Node): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  const mode = nodeData.mode || nodeData.generation_type || 'definition';
  const nodeType = nodeData.nodeType;
  const template = getNodeTemplate(nodeType, mode);

  if (nodeType === 'CustomFunction' && params.parameters) {
    try {
      const codeTemplate = params.code_template || '';
      
      if (codeTemplate.includes('export const') || codeTemplate.includes('export function')) {
        return codeTemplate;
      }
      
      const functionName = params.function_name || 'customFunction';
      const codeBody = codeTemplate || '// Add your code here';

      const parameters = JSON.parse(params.parameters);
      
      const paramList = parameters
        .map((p: { name: string; type: string; required?: boolean }) => {
          const optionalMarker = p.required === false ? '?' : '';
          return `${p.name}${optionalMarker}: ${p.type}`;
        })
        .join(', ');
      
      return `export const ${functionName} = (${paramList}) => {
${codeBody}
};`;
    } catch (error) {
      console.error('Error generating CustomFunction definition:', error);
      return '// Error generating custom function';
    }
  }
  
  if (!template || !template.code_template) {
    return '';
  }
  const codeTemplate = params.code_template || template.code_template;
  
  return processCodeTemplate(codeTemplate as string, params, '', 'rule-builder');
};

export const generateTypeScriptCode = (
  nodes: Node[],
  edges: Edge[],
  nestedCanvasData: Record<string, NestedCanvasData>
): string => {
  const handleTransactionNode = nodes.find((node) => node.data.nodeType === 'HandleTransaction');
  
  if (!handleTransactionNode || !nestedCanvasData[handleTransactionNode.id]) {
    return `// No HandleTransaction node found or no nested flow defined
// Please add a HandleTransaction node with nested flow to generate code`;
  }
  
  const nestedData = nestedCanvasData[handleTransactionNode.id];
  const nestedCode = generateNestedFlowCode(nestedData.nodes, nestedData.edges, '  ', nodes, 'rule-builder');
  
  const isNodeConnected = (nodeId: string): boolean => {
    return edges.some((edge) => edge.source === nodeId || edge.target === nodeId);
  };
  
  const extractImportStatement = (node: Node): string => {
    const params = (node.data as EditableNodeData).params || {};
    const rawImportStatement = params.importStatement || '';
    return stripVariableIndicators(rawImportStatement, 'rule-builder').trim();
  };

  const importNodes = nodes.filter((node) => node.data.nodeType === 'Import');
  const customImportStatements = importNodes
    .map(extractImportStatement)
    .filter(Boolean)
    .join('\n');
  
  const baseImports = `import type { DatabaseManagerInstance, LoggerService, ManagerConfig } from '@tazama-lf/frms-coe-lib';
import type { RuleConfig, RuleRequest, RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';`;
  
  const allImports = customImportStatements 
    ? `${baseImports}\n${customImportStatements}` 
    : baseImports;

  const functionNodes = nodes.filter((node) => {
    const nodeData = node.data as EditableNodeData;
    const nodeType = nodeData.nodeType;
    const mode = nodeData.mode || nodeData.generation_type;
    
    if (nodeType === 'CustomFunction' && mode === 'definition' && isNodeConnected(node.id)) {
      return true;
    }
    
    const template = getNodeTemplate(nodeType, mode);
    
    return template && template.isFunction === true && (mode === 'definition' || !mode) && isNodeConnected(node.id);
  });
  
  const functionDefinitions = functionNodes
    .map((node) => generateFunctionDefinition(node))
    .filter(Boolean)
    .join('\n\n');
  
  const code = `${allImports}
${functionDefinitions ? '\n' + functionDefinitions + '\n' : ''}
export async function handleTransaction(
  req: RuleRequest,
  determineOutcome: (value: number, ruleConfig: RuleConfig, ruleResult: RuleResult) => RuleResult,
  ruleRes: RuleResult,
  loggerService: LoggerService,
  ruleConfig: RuleConfig,
  databaseManager: DatabaseManagerInstance<RuleExecutorConfig>,
): Promise<RuleResult> {
  
${nestedCode}
  
  return determineOutcome(countOfMatchingAmounts, ruleConfig, ruleRes);
}`;
  
  return code;
};

export const generateTestCaseCode = (
  nodes: Node[],
  edges: Edge[],
): string => {
  const flowCode = generateNestedFlowCode(nodes, edges, '', nodes, 'test-case-generate');
  
  return flowCode || '// Add nodes to the canvas to generate code';
};
