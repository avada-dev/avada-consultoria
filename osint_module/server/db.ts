import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, searchHistory, InsertSearchHistory, SearchHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Insert a new search history record
 */
export async function insertSearchHistory(record: InsertSearchHistory): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(searchHistory).values(record);
  return Number(result[0].insertId);
}

/**
 * Get search history for a specific user
 */
export async function getSearchHistoryByUserId(userId: number, limit: number = 50): Promise<SearchHistory[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

/**
 * Get all search history (admin only)
 */
export async function getAllSearchHistory(limit: number = 100): Promise<SearchHistory[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(searchHistory)
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

/**
 * Get search statistics
 */
export async function getSearchStatistics() {
  const db = await getDb();
  if (!db) {
    return {
      totalSearches: 0,
      successfulSearches: 0,
      errorSearches: 0,
      emptySearches: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
    };
  }

  const stats = await db
    .select()
    .from(searchHistory);

  const totalSearches = stats.length;
  const successfulSearches = stats.filter(s => s.status === 'success').length;
  const errorSearches = stats.filter(s => s.status === 'error').length;
  const emptySearches = stats.filter(s => s.status === 'empty').length;
  const cacheHits = stats.filter(s => s.fromCache === 1).length;
  const avgResponseTime = stats.length > 0 
    ? Math.round(stats.reduce((sum, s) => sum + s.responseTime, 0) / stats.length)
    : 0;

  return {
    totalSearches,
    successfulSearches,
    errorSearches,
    emptySearches,
    cacheHitRate: totalSearches > 0 ? Math.round((cacheHits / totalSearches) * 100) : 0,
    avgResponseTime,
  };
}
