import dayjs from "dayjs";
import type { DropdownOption } from "../../components/DropDown";
import type { User } from "./types";

export const hideValue = (value: string, sign = "*") => sign?.repeat(value?.length)

interface NodeWithId {
  id: string;
  [key: string]: unknown;
}

interface EdgeWithSourceTarget {
  source: string;
  target: string;
  [key: string]: unknown;
}

export const sortNodesInFlowOrder = <T extends NodeWithId, E extends EdgeWithSourceTarget>(
  nodesToSort: T[],
  edgesToSort: E[]
): T[] => {
  const adjacencyMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodesToSort.forEach(node => {
    adjacencyMap.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edgesToSort.forEach(edge => {
    adjacencyMap.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  const sorted: string[] = [];

  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    const neighbors = adjacencyMap.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  const nodeMap = new Map(nodesToSort.map(node => [node.id, node]));

  if (sorted.length === nodesToSort.length) {
    return sorted.map(id => nodeMap.get(id)!);
  }
  return nodesToSort;
}

export const getLabelForHandle = (handleId: string): string => {
  if (handleId === 'if') return 'if';
  if (handleId === 'else') return 'else';
  if (handleId === 'exit') return 'exit';
  if (handleId === 'loopBody') return 'loop body';
  if (handleId === 'body') return 'body';
  if (handleId.startsWith('elseif')) return 'else if';
  return '';
};

export const getColorForHandle = (handleId: string): string => {
  if (handleId === 'if') return '#4caf50';
  if (handleId === 'else') return '#4caf50';
  if (handleId === 'exit') return '#000000';
  if (handleId === 'loopBody') return '#2196F3';
  if (handleId === 'body') return '#9c27b0';
  if (handleId.startsWith('elseif')) return '#4caf50';
  return '#555';
};

export const getNodesInBranch = <T extends NodeWithId, E extends EdgeWithSourceTarget>(
  startNodeId: string,
  handleId: string | null,
  nodes: T[],
  edges: E[],
  visitedNodes: Set<string> = new Set()
): T[] => {
  const branchNodes: T[] = [];

  const outgoingEdges = edges.filter(
    (edge) => edge.source === startNodeId && (handleId === null || (edge as { sourceHandle?: string }).sourceHandle === handleId)
  );

  for (const edge of outgoingEdges) {
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!targetNode || visitedNodes.has(targetNode.id)) continue;

    const nodeData = (targetNode as { data?: { nodeType?: string } }).data;

    if (nodeData?.nodeType === 'End') continue;

    visitedNodes.add(targetNode.id);
    branchNodes.push(targetNode);

    // Don't recursively collect nodes from block structures (If, Loop, Describe)
    // They handle their own branching logic
    if (nodeData?.nodeType !== 'If' && nodeData?.nodeType !== 'Loop' && nodeData?.nodeType !== 'Describe') {
      const childNodes = getNodesInBranch(targetNode.id, null, nodes, edges, visitedNodes);
      branchNodes.push(...childNodes);
    }
  }

  return branchNodes;
};

export const dateFormatter = (date: string, options = { time: true }) => {

  if (date) {

    let format = "MM/DD/YYYY hh:mm a"

    if (!options?.time) {
      format = "MM/DD/YYYY"
    }

    const formatted_date = dayjs(date).format(format)
    return formatted_date
  }

  return null
}

type Path = string | string[] | null | undefined

export const getNestedValue = (
  obj: unknown,
  path: Path,
  separator: string = " - "
): string => {
  if (!path) return "-"

  if (Array.isArray(path)) {
    const values = path
      .map((key) => getNestedValue(obj, key, separator))
      .filter(
        (val): val is string =>
          val !== "-" && val !== null && val !== undefined
      )

    return values.length ? values.join(separator) : "-"
  }

  if (typeof path === "string") {
    const value = path
      .replace(/\[(\w+)\]/g, ".$1")
      .replace(/^\./, "")
      .split(".")
      .reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object" && key in acc) {
          return acc[key as keyof typeof acc]
        }
        return null
      }, obj)

    return value !== null && value !== undefined && value !== ""
      ? String(value)
      : "-"
  }

  return "-"
}

export const toDropdown = (value?: string | null): DropdownOption | null =>
  value ? { label: value, value } : null;

export const capitalize = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());


const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;

    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const decodeToken = (token: string): User | null => {
  try {
    const outerPayload = decodeJwtPayload(token);
    if (!outerPayload) return null;

    const innerPayload =
      typeof outerPayload.tokenString === 'string'
        ? decodeJwtPayload(outerPayload.tokenString) ?? outerPayload
        : outerPayload;

    const claimsRaw = (outerPayload.claims as unknown[]) ??
      ((innerPayload.realm_access as Record<string, unknown>)?.roles as unknown[]) ??
      [];
    const trsClaim = (claimsRaw as string[]).find((c: string) => c.startsWith('trs_'))?.replace(/^trs_/, '');

    return {
      id:
        (innerPayload.sub as string) ??
        (outerPayload.sub as string) ??
        (outerPayload.clientId as string) ??
        'unknown',

      username:
        (innerPayload.preferred_username as string) ??
        (innerPayload.username as string) ??
        (outerPayload.preferred_username as string) ??
        (outerPayload.username as string) ??
        (innerPayload.sub as string) ??
        (outerPayload.sub as string) ??
        'user',

      email: (innerPayload.email as string) ?? (outerPayload.email as string),

      claims: trsClaim,

      tenantId:
        (outerPayload.tenantId as string) ??
        (innerPayload.tenantId as string),
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

