export function pbrReplaceArray<T>(arr: any[], toBeAdded: T[]): void {
  // clears the array
  arr.length = 0;
  arr.push(...toBeAdded);
}

export function pbrEmptyObject(obj: Record<string, unknown>): void {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) delete obj[key];
  }
}

export function pbrReplaceObject(obj: Record<string, any>, newObject: Record<string, any>) {
  pbrEmptyObject(obj);
  for (const [key, val] of Object.entries(newObject)) {
    obj[key] = val;
  }
}
