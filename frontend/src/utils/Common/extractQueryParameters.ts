import CryptoJS from "crypto-js";

const CRYPTO_KEY = import.meta.env.VITE_CRYPTO_KEY as string;

if (!CRYPTO_KEY) {
  throw new Error("VITE_CRYPTO_KEY is not defined in environment variables");
}

const encryptString = (data: string): string => {
  return CryptoJS.AES.encrypt(data, CRYPTO_KEY).toString();
};

interface VariableTreeNode {
    path: string;
    value: unknown;
    children?: VariableTreeNode[];
}

interface VariableData {
    localVarsTree?: VariableTreeNode[];
    loopVarsTree?: VariableTreeNode[];
    ruleRequestTree?: VariableTreeNode[];
    ruleConfigTree?: VariableTreeNode[];
    ruleResultTree?: VariableTreeNode[];
}

export const extractQueryParameters = (
    query: string,
    variableData: VariableData,
): string => {
    if (!query || typeof query !== 'string') {
        return encryptString('');
    }

    let parameterizedQuery = query;

    if (!parameterizedQuery.includes('{{')) {
        return encryptString(parameterizedQuery);
    }

    const valueMap = new Map<string, unknown>();
    
    const extractFromTree = (nodes: VariableTreeNode[] | undefined) => {
        if (!nodes || !Array.isArray(nodes)) return;
        
        nodes.forEach((node) => {
            if (node.path && node.value !== undefined) {
                const val = node.value;
                if (typeof val === 'string') {
                    if ((val.startsWith('<') && val.endsWith('>')) || 
                        val === '{ }' || 
                        val === '<array>') {
                        // Skip placeholders
                    } else {
                        valueMap.set(node.path, val);
                    }
                } else {

                    valueMap.set(node.path, val);
                }
            }

            if (node.children && Array.isArray(node.children)) {
                extractFromTree(node.children);
            }
        });
    };

    extractFromTree(variableData?.ruleRequestTree);
    extractFromTree(variableData?.ruleConfigTree);
    extractFromTree(variableData?.ruleResultTree);
    extractFromTree(variableData?.loopVarsTree);
    extractFromTree(variableData?.localVarsTree);

    const resolveValue = (value: unknown, visited = new Set<string>(), depth = 0): unknown => {
        if (depth > 10) {
            console.warn('Max recursion depth reached in extractQueryParameters');
            return value;
        }

        if (typeof value === 'string' && value.includes('{{')) {
            const templateRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
            let resolvedValue = value;
            
            resolvedValue = value.replace(templateRegex, (match, varPath) => {
                const trimmedPath = varPath.trim();

                if (visited.has(trimmedPath)) {
                    console.warn(`Circular reference detected: ${trimmedPath}`);
                    return match;
                }

                let replacement = valueMap.get(trimmedPath);
                
                if (replacement === undefined) {
                    return match;
                }

                const newVisited = new Set(visited);
                newVisited.add(trimmedPath);

                replacement = resolveValue(replacement, newVisited, depth + 1);

                if (typeof replacement === 'object' && replacement !== null) {
                    return JSON.stringify(replacement);
                } else if (replacement !== null && replacement !== undefined) {
                    return String(replacement);
                }
                
                return match;
            });
            
            return resolvedValue;
        }
        
        return value;
    };

    const templateRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
    const placeholders = new Map<string, string>();
    let match;
    
    while ((match = templateRegex.exec(parameterizedQuery)) !== null) {
        placeholders.set(match[0], match[1].trim());
    }

    placeholders.forEach((varPath, placeholder) => {
        const rawValue = valueMap.get(varPath);
        
        if (rawValue === undefined) {
            console.warn(`Variable not found: ${varPath}`);
            return;
        }

        const resolvedValue = resolveValue(rawValue);

        let replacementValue: string;
        const valueType = typeof resolvedValue;

        if (valueType === 'string') {
            const strValue = resolvedValue as string;
            
            if (strValue.includes('{{')) {
                console.warn(`Unresolved template in value for ${varPath}: ${strValue}`);
                return;
            }

            if ((strValue.startsWith("'") && strValue.endsWith("'")) || 
                (strValue.startsWith('"') && strValue.endsWith('"'))) {
                replacementValue = strValue;
            } else {
                const escapedValue = strValue.replace(/'/g, "''");
                replacementValue = `'${escapedValue}'`;
            }
        } else if (valueType === 'number') {
            replacementValue = String(resolvedValue);
        } else if (valueType === 'boolean') {
            replacementValue = (resolvedValue as boolean) ? 'TRUE' : 'FALSE';
        } else if (resolvedValue === null) {
            replacementValue = 'NULL';
        } else if (valueType === 'object') {
            const jsonStr = JSON.stringify(resolvedValue);
            const escapedJson = jsonStr.replace(/'/g, "''");
            replacementValue = `'${escapedJson}'`;
        } else {
            replacementValue = 'NULL';
        }
        
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        parameterizedQuery = parameterizedQuery.replace(
            new RegExp(escapedPlaceholder, 'g'), 
            replacementValue
        );
    });

    const normalizedQuery = parameterizedQuery
        .replace(/\r\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const encryptedQuery = encryptString(normalizedQuery);
    return encryptedQuery;
};
