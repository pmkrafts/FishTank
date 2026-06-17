const kv = new Map<string, string>();

export const localKv = new (class {
  get(key: string) {
    return kv.get(key) ?? null;
  }

  put(key: string, value: string, _opts?: unknown) {
    kv.set(key, value);
  }
});
