import { encrypt } from "./crypto";

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

/**
 * Extracts variable paths from a query string and resolves their values from variable data.
 *
 * @param query - The SQL query containing placeholders like `{{ variable.path }}`.
 * @param variableData - The object containing all variable trees (local, loop, global).
 * @returns The encrypted query string with variables replaced by their actual values.
 */
export const extractQueryParameters = (
    query: string,
    variableData: VariableData,
): string => {
    // Early return if no query
    if (!query || typeof query !== 'string') {
        return encrypt('');
    }

    let parameterizedQuery = query;

    // Performance optimization: Only process if query contains template variables
    if (!parameterizedQuery.includes('{{')) {
        return encrypt(parameterizedQuery);
    }

    // Build a complete value map from all variable sources
    const valueMap = new Map<string, unknown>();
    
    /**
     * Recursively extract all path-value pairs from a tree
     */
    const extractFromTree = (nodes: VariableTreeNode[] | undefined) => {
        if (!nodes || !Array.isArray(nodes)) return;
        
        nodes.forEach((node) => {
            if (node.path && node.value !== undefined) {
                // Skip template placeholders like <number>, <string>, etc.
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
                    // Non-string values (numbers, booleans, objects, etc.)
                    valueMap.set(node.path, val);
                }
            }
            
            // Process children recursively
            if (node.children && Array.isArray(node.children)) {
                extractFromTree(node.children);
            }
        });
    };
    
    // Extract from all trees (order matters: local overrides global)
    extractFromTree(variableData?.ruleRequestTree);
    extractFromTree(variableData?.ruleConfigTree);
    extractFromTree(variableData?.ruleResultTree);
    extractFromTree(variableData?.loopVarsTree);
    extractFromTree(variableData?.localVarsTree);

    /**
     * Recursively resolve template variables in a value
     * Handles cases like: creditorAccount -> "{{ RuleRequest.transaction.creditor }}"
     */
    const resolveValue = (value: unknown, visited = new Set<string>(), depth = 0): unknown => {
        // Prevent infinite recursion
        if (depth > 10) {
            console.warn('Max recursion depth reached in extractQueryParameters');
            return value;
        }

        // If value is a string with template variables, resolve them
        if (typeof value === 'string' && value.includes('{{')) {
            const templateRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
            let resolvedValue = value;
            
            resolvedValue = value.replace(templateRegex, (match, varPath) => {
                const trimmedPath = varPath.trim();
                
                // Prevent circular references
                if (visited.has(trimmedPath)) {
                    console.warn(`Circular reference detected: ${trimmedPath}`);
                    return match;
                }
                
                // Try to find the value in our valueMap
                let replacement = valueMap.get(trimmedPath);
                
                if (replacement === undefined) {
                    return match; // Keep original if can't resolve
                }
                
                // Create new visited set for recursive call
                const newVisited = new Set(visited);
                newVisited.add(trimmedPath);
                
                // Recursively resolve if the replacement is also a template
                replacement = resolveValue(replacement, newVisited, depth + 1);
                
                // Convert to string for inline replacement
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

    // Find all unique placeholders in the query
    const templateRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
    const placeholders = new Map<string, string>(); // placeholder -> varPath
    let match;
    
    while ((match = templateRegex.exec(parameterizedQuery)) !== null) {
        placeholders.set(match[0], match[1].trim());
    }

    // Resolve and replace each placeholder
    placeholders.forEach((varPath, placeholder) => {
        // Get the raw value from the map
        const rawValue = valueMap.get(varPath);
        
        if (rawValue === undefined) {
            // Variable not found - keep the placeholder as is
            console.warn(`Variable not found: ${varPath}`);
            return;
        }
        
        // Recursively resolve any nested templates
        const resolvedValue = resolveValue(rawValue);
        
        // Format the value for SQL
        let replacementValue: string;
        const valueType = typeof resolvedValue;

        if (valueType === 'string') {
            const strValue = resolvedValue as string;
            
            // Check if the resolved value still contains templates (unresolved)
            if (strValue.includes('{{')) {
                // Still has templates - keep original placeholder
                console.warn(`Unresolved template in value for ${varPath}: ${strValue}`);
                return;
            }
            
            // Check if already quoted
            if ((strValue.startsWith("'") && strValue.endsWith("'")) || 
                (strValue.startsWith('"') && strValue.endsWith('"'))) {
                replacementValue = strValue;
            } else {
                // Escape single quotes and wrap in quotes
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
            // For objects/arrays, stringify and quote
            const jsonStr = JSON.stringify(resolvedValue);
            const escapedJson = jsonStr.replace(/'/g, "''");
            replacementValue = `'${escapedJson}'`;
        } else {
            replacementValue = 'NULL';
        }
        
        // Replace all occurrences of this placeholder
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        parameterizedQuery = parameterizedQuery.replace(
            new RegExp(escapedPlaceholder, 'g'), 
            replacementValue
        );
    });

    console.log('📊 Query variable replacement:', {
        originalHadTemplates: query.includes('{{'),
        resolvedHadTemplates: parameterizedQuery.includes('{{'),
        variablesFound: valueMap.size,
        placeholdersInQuery: placeholders.size,
    });

    const encryptedQuery = encrypt(parameterizedQuery);
    return encryptedQuery;
};
