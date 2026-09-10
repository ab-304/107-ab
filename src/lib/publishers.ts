/**
 * Data access helpers for publisher records.
 *
 * These helpers expose the publisher table to Astro pages and keep database
 * access isolated from the page layer.
 */

import { asc } from 'drizzle-orm';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';
import type { Database } from './db';

/**
 * Loads every publisher in alphabetical order by name.
 *
 * @param db - The database client used to query the publisher table.
 * @returns A list of publishers sorted by name ascending.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
