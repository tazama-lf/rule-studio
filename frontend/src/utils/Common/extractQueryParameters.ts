import { encrypt } from "./crypto";

/**
 * Extracts variable paths from a query string and resolves their values from global data.
 *
 * @param query - The SQL query containing placeholders like `{{ variable.path }}`.
 * @param globalData - The object containing the variables to resolve.
 * @returns An object containing the parameterized query and an array of resolved values.
 */
export const extractQueryParameters = (
    query: string,
    globalData: any,
): string => {
    let parameterizedQuery = query;

    // Combine all variable definitions from globalData into one array
    const allVars = [
        ...(globalData?.ruleConfigTree || []),
        ...(globalData?.ruleRequestTree || []),
        ...(globalData?.ruleResultTree || []),
    ];

    // Create a map of path -> value for easy lookup
    const valueMap = new Map<string, any>();
    const processNode = (node: any) => {
        if (node.path && node.value !== undefined) {
            valueMap.set(node.path, node.value);
        }
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(processNode);
        }
    };
    allVars.forEach(processNode);

    valueMap.forEach((v, k) => {
        const placeholder = `{{ ${k} }}`;
        if (parameterizedQuery.includes(placeholder)) {
            let replacementValue;
            const valueType = typeof v;

            if (valueType === 'string') {
                replacementValue = `'${v}'`;
            } else if (valueType === 'number') {
                replacementValue = v;
            } else if (valueType === 'object') {
                // For objects, we'll stringify them. You might want to adjust this based on your needs.
                replacementValue = `'${JSON.stringify(v)}'`;
            } else {
                // For other types like boolean, undefined, etc.
                replacementValue = v;
            }

            parameterizedQuery = parameterizedQuery.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacementValue);
        }
    });

    const encryptedQuery = encrypt(parameterizedQuery);
    return `${encryptedQuery}`;
};
