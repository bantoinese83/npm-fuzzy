/**
 * Metadata decorators - attach metadata to functions and classes.
 * Enables introspection and advanced API patterns.
 */

const metadataStore = new WeakMap<object, Map<string, unknown>>();

function getMetadataMap(target: object): Map<string, unknown> {
  let map = metadataStore.get(target);
  if (map === undefined) {
    map = new Map();
    metadataStore.set(target, map);
  }
  return map;
}

export function defineMetadata(key: string, value: unknown, target: object): void {
  const map = getMetadataMap(target);
  map.set(key, value);
}

export function getMetadata<T = unknown>(key: string, target: object): T | undefined {
  const map = metadataStore.get(target);
  return map?.get(key) as T | undefined;
}

export function hasMetadata(key: string, target: object): boolean {
  const map = metadataStore.get(target);
  return map?.has(key) ?? false;
}

/**
 * Metadata decorator - attaches metadata to a method or class
 */
export function Metadata(key: string, value: unknown) {
  return function (target: unknown, propertyKey?: string | symbol): void {
    if (propertyKey !== undefined) {
      // Method decorator
      defineMetadata(key, value, target as object);
    } else {
      // Class decorator
      defineMetadata(key, value, target as object);
    }
  };
}
