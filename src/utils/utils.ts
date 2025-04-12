export function getObjectType(obj: any) {
  if (obj.getClass) return obj.getClass();
  switch (typeof obj) {
    case 'string':
      return String;
    case 'number':
      return Number;
    case 'boolean':
      return Boolean;
  }
  return obj instanceof Array ? Array : Object;
}

export function checkIsNumber(value: any) {
  // f.lang.Number.isInstance
  return typeof value === 'number' && !isNaN(value);
}
export function checkIsBoolean(value: any) {
  // GraphBoolean.isInstance
  return typeof value === 'boolean';
}
function calculateHashCode(inputObj: any): number {
  if (inputObj && typeof inputObj.hashCode === 'function') {
    // If the input has a `hashCode` method, use it
    return inputObj.hashCode();
  } else if (typeof inputObj === 'string' || inputObj instanceof String) {
    // If the input is a string, calculate its hash code
    let hash = 0;
    for (let i = 0; i < inputObj.length; i++) {
      hash = (((31 * hash) | 0) + inputObj.charCodeAt(i)) | 0;
    }
    return hash;
  } else if (typeof inputObj === 'number' || inputObj instanceof Number) {
    // If the input is a number, round it
    return Math.round(inputObj as number);
  } else if (inputObj === null || typeof inputObj === 'undefined') {
    // If the input is null or undefined, return 0
    return 0;
  } else if (typeof inputObj === 'function') {
    // If the input is a function, return a fixed value (42)
    return 42;
  } else if (typeof inputObj === 'boolean') {
    // If the input is a boolean, return 1 for true and 0 for false
    return inputObj ? 1 : 0;
  } else {
    // default case return a fixed value (1337)
    return 1337;
  }
}
export function hashCode(obj: any): number {
  if (obj && typeof obj.hashCode === 'function') {
    return obj.hashCode();
  } else {
    return calculateHashCode(obj);
  }
}
export function referenceEquals(obj1: any, obj2: any): boolean {
  return obj1 === obj2;
}
export function checkEquality(value1: any, value2: any): boolean {
  if (value1 === value2) {
    return true;
  }
  return false;
}
