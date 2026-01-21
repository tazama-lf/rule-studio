import type { Node, Edge } from '@xyflow/react';
import type { EditableNodeData } from '../../components/RuleBuilder/EditableNode';
import { getNodesInBranch } from '../Common/helpers';
import { getApiNodes, getNodeTemplate } from './nodeTemplateService';
import { getFunctionParameters, generateFunctionArgs } from './functionParameterUtils';

interface NestedCanvasData {
  nodes: Node[];
  edges: Edge[];
}

const stripVariableIndicators = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\{\{\s*(.+?)\s*\}\}/g, '$1');
};

const processCodeTemplate = (
  template: string,
  params: Record<string, string>,
  indent: string = ''
): string => {
  if (!template) return '';

  // Strip {{ }} from all params first
  const cleanParams: Record<string, string> = {};
  Object.keys(params).forEach((key) => {
    cleanParams[key] = stripVariableIndicators(params[key] || '');
  });

  // Replace ${params.key} with actual values
  let processedCode = template.replace(/\$\{params\.(\w+)\s*\|\|\s*['"]([^'"]*)['"  ]\}/g, (_match, key, defaultValue) => {
    return cleanParams[key] || defaultValue;
  });

  processedCode = processedCode.replace(/\$\{params\.(\w+)\}/g, (_match, key) => {
    return cleanParams[key] || '';
  });

  // Replace ${indent} if present
  processedCode = processedCode.replace(/\$\{indent\}/g, indent);

  // Add indent to each line
  if (indent) {
    processedCode = processedCode
      .split('\n')
      .map((line) => (line.trim() ? indent + line : line))
      .join('\n');
  }

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

  // Get function parameters from definition
  const functionParams = getFunctionParameters(functionName, allNodes);
  
  // Generate arguments string (empty if no parameters)
  const args = functionParams && functionParams.length > 0 
    ? generateFunctionArgs(functionParams, params)
    : '';

  // Check if user wants to store result in variable
  const storeResult = params.storeResult !== 'false'; // Default to true
  const resultVariable = params.resultVariable || 'result';

  // Generate the function call
  let code = '';
  if (storeResult) {
    code = `const ${resultVariable} = ${functionName}(${args});`;
  } else {
    code = `${functionName}(${args});`;
  }

  // Add indent
  if (indent) {
    code = indent + code;
  }

  return code;
};

const generateNodeCode = (node: Node, indent: string = '', allNodes?: Node[]): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  const nodeType = nodeData.nodeType;
  const mode = nodeData.mode || nodeData.generation_type;

  // Get the correct template based on node type and mode
  const template = getNodeTemplate(nodeType, mode);

  if (nodeType === 'If') {
    return generateIfNodeCode(node, indent);
  }

  if (nodeType === 'FetchDB') {
    return generateFetchDBCode(params, indent);
  }

  if (nodeType === 'SetVariable') {
    return generateSetVariableCode(params, indent);
  }

  if (nodeType === 'Log') {
    return generateLogCode(params, indent);
  }

  if (nodeType === 'ThrowError') {
    return generateThrowErrorCode(params, indent);
  }

  if (nodeType === 'Loop') {
    return generateLoopCode(params, indent);
  }

  if (nodeType === 'Exit') {
    return generateExitCode(params, indent);
  }

  if (nodeType === 'arrayOp') {
    return generateArrayOpCode(params, indent);
  }

  if (nodeType === 'math') {
    return generateMathCode(params, indent);
  }

  if (nodeType === 'stringFunc') {
    return generateStringFuncCode(params, indent);
  }

  if (nodeType === 'objectOp') {
    return generateObjectOpCode(params, indent);
  }

  // Handle function call nodes with dynamic parameters (call mode)
  if (mode === 'call' && (nodeData.function_name || params.function_name)) {
    const dynamicCode = generateFunctionCallCode(node, allNodes || [], indent);
    if (dynamicCode) {
      return dynamicCode;
    }
  }

  // Handle function nodes with call_template (call mode)
  if (template && template.call_template) {
    return processCodeTemplate(template.call_template as string, params, indent);
  }

  // Handle regular nodes with code_template
  if (template && template.code_template) {
    return processCodeTemplate(template.code_template as string, params, indent);
  }

  // Fallback: try to use API node definition
  const nodeDefinition = getApiNodes().find((n) => {
    const nodeJson = n.node_json as { node_type?: string };
    return nodeJson.node_type === nodeType;
  });

  if (nodeDefinition) {
    const nodeJson = nodeDefinition.node_json as { code_template?: string };
    if (nodeJson?.code_template && typeof nodeJson.code_template === 'string') {
      return processCodeTemplate(nodeJson.code_template, params, indent);
    }
  }

  // Fallback for unknown nodes
  return `${indent}// ${nodeType} - ${nodeData.label}`;
};

const generateSetVariableCode = (params: Record<string, string>, indent: string): string => {
  const varName = params.name || params.variableName || 'variable';
  const declarationType = params.declarationType || 'var';
  const dataType = params.dataType || 'any';
  let varValue = params.value || params.variableValue || '';
  
  // Strip {{ }} variable indicators from value
  varValue = stripVariableIndicators(varValue);
  
  // Handle undefined or empty value case
  if (!varValue || varValue.trim() === '' || dataType === 'undefined') {
    return `${indent}${declarationType} ${varName};`;
  }
  
  // Determine value string based on data type and content
  let valueStr: string;
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
  
  return `${indent}${declarationType} ${varName} = ${valueStr};`;
};

const generateLogCode = (params: Record<string, string>, indent: string): string => {
  let message = params.text || params.message || '';
  const hasVariables = /\{\{\s*.+?\s*\}\}/.test(message);
  message = message.replace(/^['"]|['"]$/g, '').trim();
  
  let messageStr: string;
  
  if (!message) {
    messageStr = "''";
  } else if (hasVariables) {
    const onlyVariableMatch = message.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/);
    if (onlyVariableMatch) {
      messageStr = onlyVariableMatch[1].trim();
    } else {
      const interpolatedMessage = message.replace(/\{\{\s*(.+?)\s*\}\}/g, '${$1}');
      messageStr = `\`${interpolatedMessage.replace(/`/g, '\\`')}\``;
    }
  } else {
    messageStr = `'${message.replace(/'/g, "\\'")}'`;
  }
  
  return `${indent}loggerService.log(${messageStr}, context, msgId);`;
};

const generateThrowErrorCode = (params: Record<string, string>, indent: string): string => {
  let message = params.text || params.message || 'Error occurred';
  const hasVariables = /\{\{\s*.+?\s*\}\}/.test(message);
  message = message.replace(/^['"]|['"]$/g, '').trim();
  
  let messageStr: string;
  
  if (!message) {
    messageStr = "'Error occurred'";
  } else if (hasVariables) {
    const onlyVariableMatch = message.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/);
    if (onlyVariableMatch) {
      messageStr = onlyVariableMatch[1].trim();
    } else {
      const interpolatedMessage = message.replace(/\{\{\s*(.+?)\s*\}\}/g, '${$1}');
      messageStr = `\`${interpolatedMessage.replace(/`/g, '\\`')}\``;
    }
  } else {
    messageStr = `'${message.replace(/'/g, "\\'")}'`;
  }
  
  return `${indent}throw new Error(${messageStr});`;
};


const generateExitCode = (params: Record<string, string>, indent: string): string => {
  const exitType = params.exitType || 'break';
  
  if (exitType === 'return') {
    const returnValue = params.returnValue?.trim() || '';
    if (returnValue) {
      // Strip {{ }} indicators from return value
      const cleanedValue = stripVariableIndicators(returnValue);
      return `${indent}return ${cleanedValue};`;
    }
    return `${indent}return;`;
  } else if (exitType === 'continue') {
    return `${indent}continue;`;
  } else { // break
    return `${indent}break;`;
  }
};

const generateArrayOpCode = (params: Record<string, string>, indent: string): string => {
  const array = stripVariableIndicators(params.array || 'arr');
  const operation = params.operation || 'pop';
  const value = stripVariableIndicators(params.value || '');
  const resultVar = params.resultVar || 'arrayOpResult';
  
  if (operation === 'length') {
    return `${indent}const ${resultVar} = ${array}.length;`;
  }
  
  // Only push and concat need a value parameter
  const needsValue = operation === 'push' || operation === 'concat' || operation === 'findIndex';
  const operationCall = needsValue && value ? `${operation}(${value})` : `${operation}()`;
  
  return `${indent}const ${resultVar} = ${array}.${operationCall};`;
};

const generateMathCode = (params: Record<string, string>, indent: string): string => {
  const method = params.method || 'sqrt';
  const value = stripVariableIndicators(params.value || '0');
  const value2 = params.value2 ? stripVariableIndicators(params.value2) : '';
  const resultVar = params.resultVar || 'mathResult';
  
  // Only pow needs two arguments
  const methodArgs = method === 'pow' && value2 ? `${value}, ${value2}` : value;
  
  return `${indent}const ${resultVar} = Math.${method}(${methodArgs});`;
};

const generateStringFuncCode = (params: Record<string, string>, indent: string): string => {
  const method = params.method || 'trim';
  const text = stripVariableIndicators(params.text || '""');
  const separator = params.separator ? stripVariableIndicators(params.separator) : '';
  const start = params.start || '';
  const end = params.end || '';
  const resultVar = params.resultVar || 'stringResult';
  
  if (method === 'length') {
    return `${indent}const ${resultVar} = ${text}.length;`;
  }
  
  let methodCall = '';
  
  // Different string methods need different parameters
  if (method === 'split') {
    // split needs a separator
    methodCall = separator ? `${method}(${separator})` : `${method}('')`;
  } else if (method === 'slice' || method === 'substring') {
    // slice and substring need start and optionally end
    if (end) {
      methodCall = `${method}(${start}, ${end})`;
    } else if (start) {
      methodCall = `${method}(${start})`;
    } else {
      methodCall = `${method}(0)`;
    }
  } else {
    // trim, toUpperCase, toLowerCase, toString don't need parameters
    methodCall = `${method}()`;
  }
  
  return `${indent}const ${resultVar} = ${text}.${methodCall};`;
};

const generateObjectOpCode = (params: Record<string, string>, indent: string): string => {
  const operation = params.operation || 'keys';
  const obj = stripVariableIndicators(params.object || 'obj');
  const resultVar = params.resultVar || 'objectResult';
  
  if (operation === 'destructure') {
    const keys = params.keys || 'prop1, prop2';
    return `${indent}const { ${keys} } = ${obj};`;
  }
  
  if (operation === 'hasOwnProperty') {
    const property = params.property ? stripVariableIndicators(params.property) : 'prop';
    return `${indent}const ${resultVar} = ${obj}.hasOwnProperty(${property});`;
  }
  
  if (operation === 'assign') {
    const sources = params.sourceObjects ? `, ${stripVariableIndicators(params.sourceObjects)}` : '';
    return `${indent}const ${resultVar} = Object.assign(${obj}${sources});`;
  }
  
  return `${indent}const ${resultVar} = Object.${operation}(${obj});`;
};

const generateFetchDBCode = (params: Record<string, string>, indent: string): string => {
  const resultVar = params.resultVar || params.variable || 'dbResult';
  const query = params.query || 'SELECT * FROM table';
  
  const varPattern = /\{\{\s*(.+?)\s*\}\}/g;
  const globalVars: string[] = [];
  let parameterizedQuery = query;
  
  const matches = [...query.matchAll(varPattern)];
  if (matches.length > 0) {
    const uniqueVars = Array.from(new Set(matches.map(m => m[1])));
    uniqueVars.forEach((varPath, index) => {
      globalVars.push(varPath);
      const placeholder = `$${index + 1}`;
      const escapedVar = varPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      parameterizedQuery = parameterizedQuery.replace(new RegExp(`\\{\\{\\s*${escapedVar}\\s*\\}\\}`, 'g'), placeholder);
    });
  }
  
  const queryConstName = `query${resultVar.charAt(0).toUpperCase()}${resultVar.slice(1)}`;
  
  const lines = [
    `${indent}// Define parameterized query`,
    `${indent}const ${queryConstName} = \`${parameterizedQuery.replace(/`/g, '\\`')}\`;`,
    '',
  ];
  
  if (globalVars.length > 0) {
    lines.push(`${indent}// Execute query with parameters`);
    lines.push(`${indent}const ${resultVar} = await databaseManager._eventHistory.query<{ [key: string]: unknown }>(${queryConstName}, [`);
    globalVars.forEach((varPath, index) => {
      const comma = index < globalVars.length - 1 ? ',' : '';
      lines.push(`${indent}  ${varPath}${comma}`);
    });
    lines.push(`${indent}]);`);
  } else {
    lines.push(`${indent}// Execute query without parameters`);
    lines.push(`${indent}const ${resultVar} = await databaseManager._eventHistory.query<{ [key: string]: unknown }>(${queryConstName});`);
  }
  
  return lines.join('\n');
};

const generateIfNodeCode = (node: Node, indent: string): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  
  try {
    const conditionsStr = params.conditions || JSON.stringify([{ type: 'if', condition: 'true' }]);
    const conditions = JSON.parse(conditionsStr);
    
    let code = '';
    conditions.forEach((cond: { type: string; condition?: string }) => {
      const conditionText = cond.condition || 'true';
      const cleanCondition = stripVariableIndicators(conditionText);
      
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

const generateLoopCode = (params: Record<string, string>, indent: string): string => {
  const loopType = params.loopType || 'forEach';
  const arrayVariable = stripVariableIndicators(params.arrayVariable || 'items');
  const itemVariable = params.itemVariable || 'item';
  const indexVariable = params.indexVariable || ''; // Empty by default
  const resultVariable = params.resultVariable || 'loopResult';
  const filterCondition = stripVariableIndicators(params.filterCondition || '');
  const loopBody = stripVariableIndicators(params.loopBody || '// Custom logic here');
  
  const lines: string[] = [];
  
  lines.push(`${indent}// Loop: ${loopType} over ${arrayVariable}`);
  
  switch (loopType) {
    case 'forEach': {
      // Only include index parameter if user specified an index variable
      const forEachParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      lines.push(`${indent}${arrayVariable}.forEach((${forEachParams}) => {`);
      lines.push(`${indent}  ${loopBody}`);
      lines.push(`${indent}});`);
      break;
    }
      
    case 'for':
      lines.push(`${indent}for (let ${indexVariable} = 0; ${indexVariable} < ${arrayVariable}.length; ${indexVariable}++) {`);
      lines.push(`${indent}  ${loopBody}`);
      lines.push(`${indent}}`);
      break;
      
    case 'map': {
      // Only include index parameter if user specified an index variable
      const mapParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
      lines.push(`${indent}const ${resultVariable} = ${arrayVariable}.map((${mapParams}) => {`);
      lines.push(`${indent}  ${loopBody}`);
      lines.push(`${indent}  return ${itemVariable};`);
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
      // Only include index parameter if user specified an index variable
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

const generateNodeCodeRecursive = (
  node: Node,
  nodes: Node[],
  edges: Edge[],
  indent: string,
  processedNodes: Set<string>
): string => {
  const nodeData = node.data as EditableNodeData;
  
  // Handle If nodes with branch traversal
  if (nodeData.nodeType === 'If') {
    try {
      const params = nodeData.params || {};
      const conditionsStr = params.conditions || JSON.stringify([{ type: 'if', condition: 'true' }]);
      const conditions = JSON.parse(conditionsStr);
      
      let ifCode = '';
      
      for (let i = 0; i < conditions.length; i++) {
        const cond = conditions[i];
        const handleId = cond.type === 'else' ? 'else' : cond.type === 'if' ? 'if' : `elseif-${i}`;
        
        // Get nodes in this branch
        const branchNodes = getNodesInBranch(node.id, handleId, nodes, edges, new Set(processedNodes));
        branchNodes.forEach((n) => processedNodes.add(n.id));
        
        // Recursively generate code for branch nodes
        const branchCode = branchNodes
          .map((n) => generateNodeCodeRecursive(n, nodes, edges, indent + '  ', processedNodes))
          .filter(Boolean)
          .join('\n');
        
        // Determine branch body
        const branchBody = branchCode || `${indent}  // Add logic here`;
        
        if (cond.type === 'if') {
          const cleanCondition = stripVariableIndicators(cond.condition || 'true');
          ifCode += `${indent}if (${cleanCondition}) {\n`;
          ifCode += branchBody + '\n';
          ifCode += `${indent}}`;
        } else if (cond.type === 'elseif') {
          const cleanCondition = stripVariableIndicators(cond.condition || 'true');
          ifCode += ` else if (${cleanCondition}) {\n`;
          ifCode += branchBody + '\n';
          ifCode += `${indent}}`;
        } else if (cond.type === 'else') {
          ifCode += ` else {\n`;
          ifCode += branchBody + '\n';
          ifCode += `${indent}}`;
        }
      }
      
      return ifCode;
    } catch {
      return `${indent}// Error parsing If node conditions`;
    }
  }
  
  // For all other nodes, use standard code generation
  return generateNodeCode(node, indent, nodes);
};

const generateNestedFlowCode = (
  nodes: Node[], 
  edges: Edge[], 
  indent: string = '  ',
  mainCanvasNodes: Node[] = []
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
      const loopType = params.loopType || 'forEach';
      const arrayVariable = stripVariableIndicators(params.arrayVariable || 'items');
      const itemVariable = params.itemVariable || 'item';
      const indexVariable = params.indexVariable || ''; // Empty by default
      const resultVariable = params.resultVariable || 'loopResult';
      const filterCondition = stripVariableIndicators(params.filterCondition || '');
      
      // Get nodes connected to loopBody edge (right side - loop body)
      const loopBodyNodes = getNodesInBranch(node.id, 'loopBody', nodes, edges, new Set(processedNodes));
      loopBodyNodes.forEach((n) => processedNodes.add(n.id));
      
      // Use recursive generation to handle nested If nodes with branches
      const innerCode = loopBodyNodes
        .map((n) => generateNodeCodeRecursive(n, allNodes, edges, indent + '  ', processedNodes))
        .filter(Boolean)
        .join('\n');
      
      // Generate loop wrapper based on type
      let loopCode = `${indent}// Loop: ${loopType} over ${arrayVariable}\n`;
      
      switch (loopType) {
        case 'forEach': {
          // Only include index parameter if user specified an index variable
          const forEachParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
          loopCode += `${indent}${arrayVariable}.forEach((${forEachParams}) => {\n`;
          if (innerCode) {
            const indentedInnerCode = innerCode.split('\n').map(line => line ? `${indent}  ${line.trimStart()}` : '').join('\n');
            loopCode += indentedInnerCode + '\n';
          }
          loopCode += `${indent}});`;
          break;
        }
          
        case 'for': {
          const loopIndexVar = indexVariable || 'i';
          const initialization = stripVariableIndicators(params.initialization || `${loopIndexVar} = 0`);
          const loopCondition = stripVariableIndicators(params.loopCondition || `${loopIndexVar} < ${arrayVariable}.length`);
          const incrementOp = params.incrementOperation || 'i++';
          const customIncrement = stripVariableIndicators(params.customIncrement || '');
          const incrementStatement = incrementOp === 'custom' ? customIncrement : incrementOp.replace('i', loopIndexVar);
          
          loopCode += `${indent}for (let ${initialization}; ${loopCondition}; ${incrementStatement}) {\n`;
          if (innerCode) {
            const indentedInnerCode = innerCode.split('\n').map(line => line ? `${indent}  ${line.trimStart()}` : '').join('\n');
            loopCode += indentedInnerCode + '\n';
          }
          loopCode += `${indent}}`;
          break;
        }
          
        case 'while': {
          const whileCustomCondition = stripVariableIndicators(params.loopCondition || '');
          const loopIndexVar = indexVariable || 'i';
          
          if (whileCustomCondition) {
            // User provided custom while condition
            loopCode += `${indent}while (${whileCustomCondition}) {\n`;
          } else {
            // Default: iterate over array
            loopCode += `${indent}let ${loopIndexVar} = 0;\n`;
            const whileCondition = `${loopIndexVar} < ${arrayVariable}.length`;
            loopCode += `${indent}while (${whileCondition}) {\n`;
          }
          
          if (innerCode) {
            const indentedInnerCode = innerCode.split('\n').map(line => line ? `${indent}  ${line.trimStart()}` : '').join('\n');
            loopCode += indentedInnerCode + '\n';
          }
          
          if (!whileCustomCondition) {
            loopCode += `${indent}  ${loopIndexVar}++;\n`;
          }
          loopCode += `${indent}}`;
          break;
        }
          
        case 'map': {
          // Only include index parameter if user specified an index variable
          const mapParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
          loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.map((${mapParams}) => {\n`;
          if (innerCode) {
            const indentedInnerCode = innerCode.split('\n').map(line => line ? `${indent}  ${line.trimStart()}` : '').join('\n');
            loopCode += indentedInnerCode + '\n';
          }
          loopCode += `${indent}  return ${itemVariable};\n`;
          loopCode += `${indent}});`;
          break;
        }
          
        case 'filter': {
          // Only include index parameter if user specified an index variable
          const filterParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
          loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.filter((${filterParams}) => {\n`;
          if (filterCondition) {
            loopCode += `${indent}  return ${filterCondition};\n`;
          } else {
            loopCode += `${indent}  return true;\n`;
          }
          loopCode += `${indent}});`;
          break;
        }

        case 'every': {
          const condition = stripVariableIndicators(params.condition || 'true');
          const everyParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
          loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.every((${everyParams}) => ${condition});`;
          break;
        }

        case 'some': {
          const condition = stripVariableIndicators(params.condition || 'true');
          const someParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
          loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.some((${someParams}) => ${condition});`;
          break;
        }

        case 'find': {
          const condition = stripVariableIndicators(params.condition || 'true');
          const findParams = indexVariable ? `${itemVariable}, ${indexVariable}` : itemVariable;
          loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.find((${findParams}) => ${condition});`;
          break;
        }

        case 'reduce': {
          const reduceLogic = stripVariableIndicators(params.reduceLogic || 'return acc;');
          const initialValue = stripVariableIndicators(params.initialValue || '0');
          const reduceParams = indexVariable ? `acc, ${itemVariable}, ${indexVariable}` : `acc, ${itemVariable}`;
          loopCode += `${indent}const ${resultVariable} = ${arrayVariable}.reduce((${reduceParams}) => {\n`;
          loopCode += `${indent}  ${reduceLogic}\n`;
          loopCode += `${indent}}, ${initialValue});`;
          break;
        }
          
        default:
          loopCode += `${indent}// Unknown loop type: ${loopType}`;
      }
      
      codeLines.push(loopCode);
      
      // Continue with exit edge
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
            .map((n) => generateNodeCode(n, indent + '  ', allNodes))
            .filter(Boolean)
            .join('\n');
          
          // Determine branch body
          const branchBody = branchCode || `${indent}  // Add logic here`;
          
          if (cond.type === 'if') {
            const cleanCondition = stripVariableIndicators(cond.condition || 'true');
            ifCode += `${indent}if (${cleanCondition}) {\n`;
            ifCode += branchBody + '\n';
            ifCode += `${indent}}`;
          } else if (cond.type === 'elseif') {
            const cleanCondition = stripVariableIndicators(cond.condition || 'true');
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
      const code = generateNodeCode(node, indent, allNodes);
      if (code) codeLines.push(code);
      
      const nextEdge = edges.find((e) => e.source === nodeId);
      if (nextEdge) processNode(nextEdge.target);
    }
  };
  
  processNode(startNode.id);
  
  return codeLines.join('\n');
};

/**
 * Helper function to generate function definition from a function node
 */
const generateFunctionDefinition = (node: Node): string => {
  const nodeData = node.data as EditableNodeData;
  const params = nodeData.params || {};
  const mode = nodeData.mode || nodeData.generation_type || 'definition';
  const nodeType = nodeData.nodeType;
  const template = getNodeTemplate(nodeType, mode);
  
  // Handle CustomFunction with dynamic parameters
  if (nodeType === 'CustomFunction' && params.parameters) {
    try {
      const codeTemplate = params.code_template || '';
      
      // If code_template already contains 'export const', it's a complete function - use as is
      if (codeTemplate.includes('export const') || codeTemplate.includes('export function')) {
        return codeTemplate;
      }
      
      // Otherwise, wrap the code body with function signature
      const functionName = params.function_name || 'customFunction';
      const codeBody = codeTemplate || '// Add your code here';
      
      // Parse parameters from JSON
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
  
  return processCodeTemplate(codeTemplate as string, params, '');
};

export const generateTypeScriptCode = (
  nodes: Node[],
  edges: Edge[],
  nestedCanvasData: Record<string, NestedCanvasData>
): string => {
  // Check if there's a HandleTransaction node
  const handleTransactionNode = nodes.find((node) => node.data.nodeType === 'HandleTransaction');
  
  if (!handleTransactionNode || !nestedCanvasData[handleTransactionNode.id]) {
    return `// No HandleTransaction node found or no nested flow defined
// Please add a HandleTransaction node with nested flow to generate code`;
  }
  
  const nestedData = nestedCanvasData[handleTransactionNode.id];
  const nestedCode = generateNestedFlowCode(nestedData.nodes, nestedData.edges, '  ', nodes);
  
  const isNodeConnected = (nodeId: string): boolean => {
    return edges.some((edge) => edge.source === nodeId || edge.target === nodeId);
  };
  
  const extractImportStatement = (node: Node): string => {
    const params = (node.data as EditableNodeData).params || {};
    const rawImportStatement = params.importStatement || '';
    return stripVariableIndicators(rawImportStatement).trim();
  };

  const importNodes = nodes.filter((node) => node.data.nodeType === 'Import');
  const customImportStatements = importNodes
    .map(extractImportStatement)
    .filter(Boolean)
    .join('\n');
  
  const baseImports = `import { aql, type DatabaseManagerInstance, type LoggerService, type ManagerConfig } from '@tazama-lf/frms-coe-lib';
import type { OutcomeResult, RuleConfig, RuleRequest, RuleResult } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { unwrap } from '@tazama-lf/frms-coe-lib/lib/helpers/unwrap';`;
  
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
  
  const context = \`Rule-\${ruleConfig.id ? ruleConfig.id : '<unresolved>'} handleTransaction()\`;
  const msgId = req.transaction.FIToFIPmtSts.GrpHdr.MsgId;
  
  loggerService.trace('Start - handle transaction', context, msgId);
  
${nestedCode}
  
  loggerService.trace('End - handle transaction', context, msgId);
  
  return determineOutcome(count, ruleConfig, ruleRes);
}`;
  
  return code;
};
