export interface NodeInput {
  key: string;
  label: string;
  defaultValue: string;
  required?: boolean;
  type?: string; // e.g., 'text', 'textarea', 'dropdown', 'json'
  options?: string[]; // For dropdown inputs
  placeholder?: string; // Placeholder text for inputs
}

export interface NodeHandles {
  source: boolean;
  target: boolean;
  multipleOutputs?: boolean; // For nodes like If that can have multiple outputs
}

export interface BaseNodeTemplate {
  displayName: string;
  inputs: NodeInput[];
  handles: NodeHandles;
  bgColor: string;
}

export interface FunctionNodeTemplate extends BaseNodeTemplate {
  description: string;
  isExtensible: boolean;
  functionTemplate: string;
  mainFlowTemplate: string;
}

export interface NodeTemplates {
  [key: string]: BaseNodeTemplate;
}

export interface PredefinedFunctions {
  [key: string]: FunctionNodeTemplate;
}

export const nodeTemplates: Readonly<NodeTemplates> = {
  Start: {
    displayName: 'Start',
    inputs: [],
    handles: { source: true, target: false },
    bgColor: 'bg-green-50 border-green-400',
  },
  SetVariable: {
    displayName: 'Set Variable',
    inputs: [
      { key: 'name', label: 'Variable Name', defaultValue: 'x' },
      { key: 'declarationType', label: 'Declaration Type', defaultValue: 'var' },
      { key: 'dataType', label: 'Data Type', defaultValue: 'any' },
      { key: 'value', label: 'Value', defaultValue: '10' },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-blue-50 border-blue-400',
  },
  Log: {
    displayName: 'Print Log',
    inputs: [{ key: 'text', label: 'Message', defaultValue: "'Hello'" }],
    handles: { source: true, target: true },
    bgColor: 'bg-yellow-50 border-yellow-400',
  },
  Code: {
    displayName: 'Custom Code',
    inputs: [
      { key: 'code', label: 'Code', defaultValue: "console.log('Hello');" },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-purple-50 border-purple-400',
  },
  FetchDB: {
    displayName: 'Fetch from DB',
    inputs: [
      { key: 'query', label: 'SQL Query', defaultValue: 'SELECT * FROM users', required: true },
      { key: 'resultVar', label: 'Store Result In', defaultValue: 'dbResult', required: true },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-orange-50 border-orange-400',
  },
  ThrowError: {
    displayName: 'Throw Error',
    inputs: [
      { key: 'text', label: 'Error Message', defaultValue: "'Error occurred'" },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-red-50 border-red-400',
  },
  Import: {
    displayName: 'Import',
    inputs: [
      {
        key: 'importStatement',
        label: 'Import Statement',
        defaultValue: "import { something } from 'module'",
      },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-indigo-50 border-indigo-400',
  },
  If: {
    displayName: 'If Condition',
    inputs: [
      { key: 'conditions', label: 'Conditions', defaultValue: JSON.stringify([{ type: 'if', condition: 'x > 5' }]) },
    ],
    handles: { source: true, target: true, multipleOutputs: true },
    bgColor: 'bg-pink-50 border-pink-400',
  },
  End: {
    displayName: 'End',
    inputs: [],
    handles: { source: false, target: true },
    bgColor: 'bg-gray-50 border-gray-400',
  },
} as const;

export const predefinedFunctions: Readonly<PredefinedFunctions> = {
  CustomFunction: {
    displayName: 'Custom Function',
    description: 'Define a reusable function with custom logic',
    inputs: [
      { key: 'functionName', label: 'Function Name', defaultValue: 'myFunction' },
      { key: 'functionParams', label: 'Parameters (e.g., a, b)', defaultValue: '' },
      { key: 'functionArgs', label: 'Arguments (e.g., var1, 10)', defaultValue: '' },
      { key: 'resultVar', label: 'Store Result In (Optional)', defaultValue: '' },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-teal-50 border-teal-400',
    isExtensible: true,
    functionTemplate: `async function {{functionName}}({{functionParams}}) {
  {{USER_CODE}}
}`,
    mainFlowTemplate: `const {{resultVar}} = await {{functionName}}({{functionArgs}});`,
  },

  HandleTransaction: {
    displayName: 'Handle Transaction',
    description: 'Main entry point for transaction processing logic',
    inputs: [],
    handles: { source: true, target: true },
    bgColor: 'bg-teal-50 border-teal-400',
    isExtensible: true,
    functionTemplate: `export async function handleTransaction(
  req,
  determineOutcome,
  ruleRes,
  loggerService,
  ruleConfig,
  databaseManager
) {
  const context = \`Rule-\${ruleConfig.id} handleTransaction()\`;
  loggerService.trace('Start - handle transaction', context);
  
  {{USER_CODE}}
  
  loggerService.trace('End - handle transaction', context);
  const finalOutcome = 0;
  return determineOutcome(finalOutcome, ruleConfig, ruleRes);
}`,
    mainFlowTemplate: `await handleTransaction(req, determineOutcome, ruleRes, loggerService, ruleConfig, databaseManager);`,
  },

  addTwoNumbers: {
    displayName: 'Add Two Numbers',
    description: 'Adds two numbers with optional custom logic',
    inputs: [
      { key: 'param1', label: 'First Number', defaultValue: 'a' },
      { key: 'param2', label: 'Second Number', defaultValue: 'b' },
      { key: 'resultVar', label: 'Store Result In', defaultValue: 'sum' },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-teal-50 border-teal-400',
    isExtensible: true,
    functionTemplate: `function addTwoNumbers(a, b) {
  console.log("Adding:", a, "+", b);
  {{USER_CODE}}
  return a + b;
}`,
    mainFlowTemplate: `const {{resultVar}} = addTwoNumbers({{param1}}, {{param2}});`,
  },

  calculateDiscount: {
    displayName: 'Calculate Discount',
    description: 'Calculates discounted price with custom validation rules',
    inputs: [
      { key: 'price', label: 'Original Price', defaultValue: 'price' },
      { key: 'discountPercent', label: 'Discount %', defaultValue: 'discount' },
      { key: 'resultVar', label: 'Store Result In', defaultValue: 'finalPrice' },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-teal-50 border-teal-400',
    isExtensible: true,
    functionTemplate: `function calculateDiscount(price, discountPercent) {
  const discountAmount = price * (discountPercent / 100);
  {{USER_CODE}}
  return price - discountAmount;
}`,
    mainFlowTemplate: `const {{resultVar}} = calculateDiscount({{price}}, {{discountPercent}});`,
  },

  validateEmail: {
    displayName: 'Validate Email',
    description: 'Validates email format with custom business rules',
    inputs: [
      { key: 'email', label: 'Email to Validate', defaultValue: 'email' },
      { key: 'resultVar', label: 'Store Result In', defaultValue: 'isValid' },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-teal-50 border-teal-400',
    isExtensible: true,
    functionTemplate: `function validateEmail(email) {
  const basicCheck = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  {{USER_CODE}}
  return basicCheck;
}`,
    mainFlowTemplate: `const {{resultVar}} = validateEmail({{email}});`,
  },

  fetchUserData: {
    displayName: 'Fetch User Data',
    description: 'Fetches user data from database with preprocessing',
    inputs: [
      { key: 'userId', label: 'User ID', defaultValue: 'userId' },
      { key: 'resultVar', label: 'Store Result In', defaultValue: 'userData' },
    ],
    handles: { source: true, target: true },
    bgColor: 'bg-teal-50 border-teal-400',
    isExtensible: true,
    functionTemplate: `async function fetchUserData(userId) {
  console.log("Fetching data for user:", userId);
  {{USER_CODE}}
  const userData = await db.users.find(userId);
  return userData;
}`,
    mainFlowTemplate: `const {{resultVar}} = await fetchUserData({{userId}});`,
  },
} as const;

export const getNodeTemplate = (key: string): BaseNodeTemplate | FunctionNodeTemplate | undefined => {
  return allNodeTemplates[key];
};

export const isFunctionTemplate = (key: string): boolean => {
  return key in predefinedFunctions;
};

export const getAllNodeKeys = (): string[] => {
  return Object.keys(allNodeTemplates);
};

export const getBasicNodeKeys = (): string[] => {
  return Object.keys(nodeTemplates);
};

export const getFunctionKeys = (): string[] => {
  return Object.keys(predefinedFunctions);
};

export const allNodeTemplates: Readonly<Record<string, BaseNodeTemplate | FunctionNodeTemplate>> = {
  ...nodeTemplates,
  ...predefinedFunctions,
} as const;

export default allNodeTemplates;
