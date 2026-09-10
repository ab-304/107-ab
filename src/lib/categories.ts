/**
 * Data-access helpers for category records.
 *
 * These helpers expose category choices to Astro pages while keeping database
 * access isolated from the page layer.
 */

import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Loads every category in alphabetical order by name.
 *
 * @param db - The database client used to query the category table.
 * @returns A list of categories sorted by name ascending.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}
