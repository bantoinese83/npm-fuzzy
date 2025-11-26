/**
 * LRU Cache implementation for efficient memory management.
 * Uses doubly-linked list for O(1) operations.
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  expires?: number;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
}

export class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, CacheNode<K, V>>();
  private head: CacheNode<K, V> | null = null;
  private tail: CacheNode<K, V> | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (node === undefined) return undefined;

    // Check expiration
    if (node.expires !== undefined && node.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  set(key: K, value: V, ttl?: number): void {
    const existing = this.cache.get(key);
    if (existing !== undefined) {
      existing.value = value;
      existing.expires = ttl !== undefined ? Date.now() + ttl : undefined;
      this.moveToFront(existing);
      return;
    }

    // Evict if at capacity
    if (this.cache.size >= this.capacity && this.tail !== null) {
      this.delete(this.tail.key);
    }

    const newNode: CacheNode<K, V> = {
      key,
      value,
      expires: ttl !== undefined ? Date.now() + ttl : undefined,
      prev: null,
      next: this.head,
    };

    if (this.head !== null) {
      this.head.prev = newNode;
    }
    this.head = newNode;

    if (this.tail === null) {
      this.tail = newNode;
    }

    this.cache.set(key, newNode);
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (node === undefined) return false;

    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    this.cache.delete(key);
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
  }

  size(): number {
    return this.cache.size;
  }

  private moveToFront(node: CacheNode<K, V>): void {
    if (node === this.head) return;

    // Remove from current position
    if (node.prev !== null) {
      node.prev.next = node.next;
    }
    if (node.next !== null) {
      node.next.prev = node.prev;
    }
    if (node === this.tail) {
      this.tail = node.prev;
    }

    // Move to front
    node.prev = null;
    node.next = this.head;
    if (this.head !== null) {
      this.head.prev = node;
    }
    this.head = node;
  }

  cleanupExpired(): number {
    let cleaned = 0;
    const now = Date.now();
    // Optimize: delete during iteration to avoid double pass
    const keysToDelete: K[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (node.expires !== undefined && node.expires < now) {
        keysToDelete.push(key);
      }
    }

    // Batch delete to minimize list operations
    for (const key of keysToDelete) {
      if (this.delete(key)) {
        cleaned++;
      }
    }

    return cleaned;
  }
}
