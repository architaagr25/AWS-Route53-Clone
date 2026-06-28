/**
 * TypeScript types mirroring the backend's Pydantic schemas.
 * Keeping these in sync gives us end-to-end type safety from API to UI.
 */

export interface User {
  id: number;
  username: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type ZoneType = "Public" | "Private";

export interface HostedZone {
  id: string;
  name: string;
  type: ZoneType;
  comment: string;
  record_count: number;
  created_at: string;
}

export interface DnsRecord {
  id: number;
  zone_id: string;
  name: string;
  type: string;
  value: string;
  ttl: number;
  routing_policy: string;
  created_at: string;
}

/** Generic shape of every paginated list response from the API. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export type ZoneList = Paginated<HostedZone>;
export type RecordList = Paginated<DnsRecord>;

// --- Input payloads ---
export interface ZoneCreateInput {
  name: string;
  type: ZoneType;
  comment?: string;
}

export interface RecordInput {
  name: string;
  type: string;
  value: string;
  ttl: number;
  routing_policy?: string;
}

/** Summary returned by bulk operations. */
export interface BulkResult {
  created: number;
  deleted: number;
  errors: string[];
}

/** The DNS record types a user can create (SOA is system-managed). */
export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
] as const;
