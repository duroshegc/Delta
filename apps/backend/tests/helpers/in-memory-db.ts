import { ObjectId } from "mongodb";

type Document = Record<string, any>;

export class InMemoryDb {
  private collections = new Map<string, InMemoryCollection>();

  collection<T extends Document = Document>(name: string): InMemoryCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection<T>());
    }

    return this.collections.get(name)! as InMemoryCollection<T>;
  }
}

export class InMemoryCollection<T extends Document = Document> {
  docs: T[] = [];

  async insertOne(doc: T): Promise<{ insertedId: ObjectId }> {
    const inserted = clone({
      ...doc,
      _id: doc._id || new ObjectId(),
    }) as T;
    this.docs.push(inserted);
    return { insertedId: inserted._id };
  }

  async insertMany(docs: T[]): Promise<void> {
    for (const doc of docs) {
      await this.insertOne(doc);
    }
  }

  async findOne(query: Document, options?: { sort?: Document }): Promise<T | null> {
    let docs = this.docs.filter((doc) => matches(doc, query));
    if (options?.sort) {
      docs = sortDocs(docs, options.sort);
    }
    return docs[0] ? clone(docs[0]) : null;
  }

  find(query: Document = {}): InMemoryCursor<T> {
    return new InMemoryCursor(this.docs.filter((doc) => matches(doc, query)));
  }

  async findOneAndUpdate(
    query: Document,
    update: Document,
    options?: { upsert?: boolean; returnDocument?: "after" | "before" },
  ): Promise<T | null> {
    const index = this.docs.findIndex((doc) => matches(doc, query));
    const before = index >= 0 ? clone(this.docs[index]!) : null;

    if (index < 0) {
      if (!options?.upsert) {
        return null;
      }

      const inserted = {
        _id: new ObjectId(),
        ...extractEqualityFields(query),
      };
      applyUpdate(inserted, update, true);
      this.docs.push(inserted as unknown as T);
      return clone(inserted) as unknown as T;
    }

    applyUpdate(this.docs[index]!, update, false);
    return options?.returnDocument === "before" ? before : clone(this.docs[index]!);
  }

  async updateOne(query: Document, update: Document): Promise<{ matchedCount: number }> {
    const doc = this.docs.find((item) => matches(item, query));
    if (!doc) {
      return { matchedCount: 0 };
    }
    applyUpdate(doc, update, false);
    return { matchedCount: 1 };
  }

  async updateMany(query: Document, update: Document): Promise<{ matchedCount: number }> {
    let count = 0;
    for (const doc of this.docs) {
      if (matches(doc, query)) {
        applyUpdate(doc, update, false);
        count += 1;
      }
    }
    return { matchedCount: count };
  }

  async countDocuments(query: Document = {}): Promise<number> {
    return this.docs.filter((doc) => matches(doc, query)).length;
  }

  aggregate<R = Document>(pipeline: Document[]): { toArray: () => Promise<R[]> } {
    return {
      toArray: async () => {
        const matchStage = pipeline.find((stage) => stage.$match)?.$match || {};
        const docs = this.docs.filter((doc) => matches(doc, matchStage));
        const balance = docs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
        return balance === 0 ? [] : ([{ balance }] as R[]);
      },
    };
  }
}

class InMemoryCursor<T extends Document> {
  constructor(private docs: T[]) {}

  sort(sort: Document): InMemoryCursor<T> {
    this.docs = sortDocs(this.docs, sort);
    return this;
  }

  limit(limit: number): InMemoryCursor<T> {
    this.docs = this.docs.slice(0, limit);
    return this;
  }

  project<R extends Document>(projection: Document): InMemoryCursor<R> {
    this.docs = this.docs.map((doc) => {
      const projected: Document = {};
      for (const [key, include] of Object.entries(projection)) {
        if (include) {
          projected[key] = getPath(doc, key);
        }
      }
      if (projection._id !== 0 && doc._id) {
        projected._id = doc._id;
      }
      return projected as T;
    });
    return this as unknown as InMemoryCursor<R>;
  }

  async toArray(): Promise<T[]> {
    return clone(this.docs);
  }
}

function matches(doc: Document, query: Document): boolean {
  return Object.entries(query).every(([key, expected]) => {
    const actual = getPath(doc, key);

    if (isOperatorObject(expected)) {
      return Object.entries(expected).every(([operator, value]) => {
        switch (operator) {
          case "$in":
            return Array.isArray(value) && value.some((item) => equals(actual, item));
          case "$nin":
            return Array.isArray(value) && !value.some((item) => equals(actual, item));
          case "$ne":
            return !equals(actual, value);
          case "$gte":
            return actual >= (value as any);
          case "$lte":
            return actual <= (value as any);
          case "$lt":
            return compareValues(actual, value) < 0;
          case "$near":
            return isNear(actual, value);
          default:
            return false;
        }
      });
    }

    return equals(actual, expected);
  });
}

function isNear(actual: any, near: any): boolean {
  if (
    actual?.type !== "Point" ||
    near?.$geometry?.type !== "Point" ||
    !Array.isArray(actual.coordinates) ||
    !Array.isArray(near.$geometry.coordinates)
  ) {
    return false;
  }

  const distanceKm = haversineDistanceKm(
    actual.coordinates[1],
    actual.coordinates[0],
    near.$geometry.coordinates[1],
    near.$geometry.coordinates[0],
  );
  const maxDistanceKm = (near.$maxDistance ?? Number.POSITIVE_INFINITY) / 1000;
  return distanceKm <= maxDistanceKm;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const radiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function equals(actual: any, expected: any): boolean {
  if (Array.isArray(actual)) {
    return actual.some((item) => equals(item, expected));
  }

  if (actual instanceof ObjectId && expected instanceof ObjectId) {
    return actual.equals(expected);
  }

  if (actual instanceof ObjectId && typeof expected === "string") {
    return actual.toString() === expected;
  }

  return actual === expected;
}

function isOperatorObject(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    !(value instanceof ObjectId) &&
    !Array.isArray(value) &&
    Object.keys(value).some((key) => key.startsWith("$"))
  );
}

function applyUpdate(doc: Document, update: Document, isInsert: boolean): void {
  if (isInsert && update.$setOnInsert) {
    for (const [key, value] of Object.entries(update.$setOnInsert)) {
      setPath(doc, key, clone(value));
    }
  }

  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) {
      setPath(doc, key, clone(value));
    }
  }

  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      setPath(doc, key, (getPath(doc, key) || 0) + Number(value));
    }
  }

  if (update.$addToSet) {
    for (const [key, value] of Object.entries(update.$addToSet)) {
      const values = getPath(doc, key) || [];
      if (!values.some((item: any) => equals(item, value))) {
        values.push(value);
      }
      setPath(doc, key, values);
    }
  }
}

function extractEqualityFields(query: Document): Document {
  const fields: Document = {};
  for (const [key, value] of Object.entries(query)) {
    if (!isOperatorObject(value)) {
      setPath(fields, key, value);
    }
  }
  return fields;
}

function sortDocs<T extends Document>(docs: T[], sort: Document): T[] {
  const entries = Object.entries(sort);
  return [...docs].sort((a, b) => {
    for (const [key, direction] of entries) {
      const comparison = compareValues(getPath(a, key), getPath(b, key));
      if (comparison !== 0) {
        return direction === -1 ? -comparison : comparison;
      }
    }
    return 0;
  });
}

function compareValues(a: any, b: any): number {
  const left =
    a instanceof ObjectId ? a.toString() : a instanceof Date ? a.getTime() : a;
  const right =
    b instanceof ObjectId ? b.toString() : b instanceof Date ? b.getTime() : b;
  return left > right ? 1 : left < right ? -1 : 0;
}

function getPath(doc: Document, path: string): any {
  return path.split(".").reduce((value, segment) => value?.[segment], doc);
}

function setPath(doc: Document, path: string, value: any): void {
  const segments = path.split(".");
  let current = doc;
  for (const segment of segments.slice(0, -1)) {
    current[segment] ||= {};
    current = current[segment];
  }
  current[segments[segments.length - 1]!] = value;
}

function clone<T>(value: T): T {
  if (value instanceof ObjectId || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => clone(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clone(item)]),
    ) as T;
  }

  return value;
}

// Made with Bob
