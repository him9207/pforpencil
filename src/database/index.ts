/**
 * Master Database Module
 * Centralized entry point for all Supabase client, sync, schema, and SQL generator utilities.
 */

// 1. Client & Connection
export * from './client';

// 2. Schema Definitions & Table Metadata
export * from './schema';

// 3. Dynamic SQL DDL & Seed Generators
export * from './sqlGenerator';

// 4. Live Mutation & Batch Sync Services
export * from './sync';
