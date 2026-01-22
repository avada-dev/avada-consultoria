import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Search history table for OSINT queries
 * Stores all search parameters and metadata for auditing and analytics
 */
export const searchHistory = mysqlTable("search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Matrícula do servidor público */
  matricula: varchar("matricula", { length: 100 }).notNull(),
  /** Cidade de lotação */
  cidade: varchar("cidade", { length: 255 }).notNull(),
  /** Estado (UF) */
  estado: varchar("estado", { length: 2 }).notNull(),
  /** Órgão (opcional) */
  orgao: text("orgao"),
  /** Cargo (opcional) */
  cargo: text("cargo"),
  /** Query string construída para o Google */
  queryString: text("queryString").notNull(),
  /** Número de resultados encontrados */
  resultCount: int("resultCount").notNull().default(0),
  /** Indica se a busca veio do cache */
  fromCache: int("fromCache").notNull().default(0),
  /** Tempo de resposta em milissegundos */
  responseTime: int("responseTime").notNull(),
  /** URL do arquivo JSON com resultados completos no S3 */
  resultsUrl: text("resultsUrl"),
  /** Status da busca: success, error, empty */
  status: mysqlEnum("status", ["success", "error", "empty"]).notNull(),
  /** Mensagem de erro, se houver */
  errorMessage: text("errorMessage"),
  /** Timestamp da busca */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;
