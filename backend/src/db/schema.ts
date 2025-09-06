import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ——— USERS
export const users = pgTable(
  "users",
  {
    id: serial().primaryKey(),
    address: varchar("address", { length: 42 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    addressIdx: index("users_address_idx").on(t.address),
  })
);

// ——— EVENTS
export const events = pgTable(
  "events",
  {
    id: serial().primaryKey(),
    contractAddress: varchar("contract_address", { length: 42 }).notNull(),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    maxTickets: bigint("max_tickets", { mode: "number" }).notNull(),
    basePriceWei: bigint("base_price_wei", { mode: "bigint" }).notNull(),
    dynamicPricing: boolean("dynamic_pricing").default(true).notNull(),
    priceIncrementWei: bigint("price_increment_wei", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    contractAddressIdx: index("events_contract_address_idx").on(t.contractAddress),
  })
);

// ——— TICKETS
export const tickets = pgTable(
  "tickets",
  {
    id: serial().primaryKey(),
    eventAddress: varchar("event_address", { length: 42 }).notNull(),
    tokenId: bigint("token_id", { mode: "number" }).notNull(),
    ownerAddress: varchar("owner_address", { length: 42 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    ticketsIdx: index("tickets_idx").on(t.eventAddress, t.tokenId),
  })
);

// ——— LISTINGS
export const listings = pgTable(
  "listings",
  {
    id: serial().primaryKey(),
    eventAddress: varchar("event_address", { length: 42 }).notNull(),
    tokenId: bigint("token_id", { mode: "number" }).notNull(),
    priceWei: bigint("price_wei", { mode: "bigint" }).notNull(),
    seller: varchar("seller", { length: 42 }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    listingsIdx: index("listings_idx").on(t.eventAddress, t.tokenId),
    activeIdx: index("listings_active_idx").on(t.active),
  })
);

// ——— Relations
export const eventsRelations = relations(events, ({ many }) => ({
  tickets: many(tickets),
  listings: many(listings),
}));
