import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters games by one or more categories and publisher', async () => {
        const [strategy, puzzle] = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: 'strategy' },
                { name: 'Puzzle', description: 'puzzle' },
            ])
            .returning({ id: categories.id });
        const [firstPublisher, secondPublisher] = await db
            .insert(publishers)
            .values([
                { name: 'Pub One', description: 'first' },
                { name: 'Pub Two', description: 'second' },
            ])
            .returning({ id: publishers.id });

        await db.insert(games).values([
            {
                title: 'Alpha Strategy',
                description: 'alpha',
                starRating: 4,
                categoryId: strategy.id,
                publisherId: firstPublisher.id,
            },
            {
                title: 'Beta Puzzle',
                description: 'beta',
                starRating: 4,
                categoryId: puzzle.id,
                publisherId: firstPublisher.id,
            },
            {
                title: 'Gamma Strategy',
                description: 'gamma',
                starRating: 4,
                categoryId: strategy.id,
                publisherId: secondPublisher.id,
            },
        ]);

        const categoriesOnly = await getFilteredGames(db, {
            categoryIds: [strategy.id, puzzle.id],
        });
        expect(categoriesOnly.map((game) => game.title)).toEqual([
            'Alpha Strategy',
            'Beta Puzzle',
            'Gamma Strategy',
        ]);

        const publisherOnly = await getFilteredGames(db, {
            publisherId: firstPublisher.id,
        });
        expect(publisherOnly.map((game) => game.title)).toEqual([
            'Alpha Strategy',
            'Beta Puzzle',
        ]);

        const combined = await getFilteredGames(db, {
            categoryIds: [strategy.id],
            publisherId: secondPublisher.id,
        });
        expect(combined.map((game) => game.title)).toEqual(['Gamma Strategy']);
    });

    it('returns an empty list when filters match no games', async () => {
        await seedGames(db, 2);
        expect(await getFilteredGames(db, { categoryIds: [99999] })).toEqual([]);
    });
});
