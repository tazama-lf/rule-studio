export function getValueByPath(obj: any, path: string): any {
  const properties = path.split('.');
  if (obj === null || obj === undefined) {
    throw new Error(`Property '${path}' not found`);
  }

  let current: any = obj;

  for (const prop of properties) {
    if (/^\d+$/.test(prop)) {
      const index = Number(prop);
      current = current?.[index];
    } else {
      current = current?.[prop];
    }

    if (current === undefined || current === null) {
      throw new Error(`Property '${path}' not found`);
    }
  }

  return current;
}
