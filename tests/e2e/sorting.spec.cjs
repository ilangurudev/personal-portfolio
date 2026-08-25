const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

function sortByRules(cards, dateSortOrder = 'desc') {
    const dateMultiplier = dateSortOrder === 'asc' ? 1 : -1;
    return [...cards].sort((a, b) => {
        if (b.orderScore !== a.orderScore) {
            return b.orderScore - a.orderScore;
        }
        return dateMultiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
    });
}

function pickRandomIndices(total, count = 3) {
    const target = Math.min(total, count);
    const indices = new Set();
    while (indices.size < target) {
        indices.add(Math.floor(Math.random() * total));
    }
    return [...indices];
}

async function getCardData(page) {
    await page.waitForSelector('.photo-card[data-photo-id]');
    return page.evaluate(() => {
        return Array.from(document.querySelectorAll('.photo-card[data-photo-id]')).map(card => ({
            id: card.getAttribute('data-photo-id'),
            orderScore: Number(card.getAttribute('data-order-score') || 0),
            date: card.getAttribute('data-photo-date') || ''
        })).filter(card => card.id && card.date);
    });
}

(async () => {
    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
        slowMo: 100
    });
    const page = await browser.newPage();

    console.log('🧪 Testing Photo Sorting...\n');

    // Test 0: Home (Photography) Sorting
    console.log('📍 Test 0: Photography Home Sorting (first visible batch)');
    await page.goto(`${TARGET_URL}/photography`);
    const homeCards = await getCardData(page);

    console.log('   Visible photos:', homeCards.length);
    console.log('   First 3 IDs:', homeCards.slice(0, 3).map(c => c.id));

    if (homeCards.length === 0) {
        console.error('   ✗ No photos found on photography home');
        process.exitCode = 1;
    } else {
        const expectedHomeOrder = sortByRules(homeCards).map(card => card.id);
        const actualHomeOrder = homeCards.map(card => card.id);

        if (actualHomeOrder.join('|') === expectedHomeOrder.join('|')) {
            console.log('   ✓ Home photos sorted by order_score, then date desc');
        } else {
            console.error('   ✗ Home photos not sorted correctly');
            console.error('     Actual first 5:', actualHomeOrder.slice(0, 5));
            console.error('     Expected first 5:', expectedHomeOrder.slice(0, 5));
            process.exitCode = 1;
        }
    }

    // Test 1: Album View Sorting (3 random albums)
    console.log('📍 Test 1: Album View Sorting (3 random albums, first visible batch)');
    await page.goto(`${TARGET_URL}/photography/albums`);
    await page.waitForSelector('[data-album-card]');
    const albumSlugs = await page.$$eval('[data-album-card]', cards =>
        cards.map(card => card.getAttribute('data-album-slug'))
    );
    const albumIndices = pickRandomIndices(albumSlugs.length, 3);
    console.log(`   Total albums: ${albumSlugs.length}, testing indices: ${albumIndices.join(', ')}`);

    for (const idx of albumIndices) {
        await page.goto(`${TARGET_URL}/photography/albums`);
        await page.waitForSelector('[data-album-card]');
        const albumLink = page.locator('[data-album-card]').nth(idx);
        const albumSlug = albumSlugs[idx] || `(album ${idx})`;
        console.log(`   Navigating to album: ${albumSlug}`);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            albumLink.click()
        ]);

        const albumCards = await getCardData(page);

        // Get the album's configured date sort order (default: 'asc')
        const dateSortOrder = await page.$eval(
            '.gallery-container[data-date-sort-order]',
            el => el.getAttribute('data-date-sort-order') || 'asc'
        ).catch(() => 'asc');

        console.log(`   Visible photos in ${albumSlug}:`, albumCards.length);
        console.log(`   Date sort order: ${dateSortOrder}`);
        console.log('   First 3 IDs:', albumCards.slice(0, 3).map(c => c.id));

        if (albumCards.length === 0) {
            console.error(`   ✗ No photos found in album view (${albumSlug})`);
            process.exitCode = 1;
        } else {
            const expectedAlbumOrder = sortByRules(albumCards, dateSortOrder).map(card => card.id);
            const actualAlbumOrder = albumCards.map(card => card.id);

            if (actualAlbumOrder.join('|') === expectedAlbumOrder.join('|')) {
                console.log(`   ✓ Album photos sorted by order_score, then date ${dateSortOrder}`);
            } else {
                console.error(`   ✗ Album photos not sorted correctly for ${albumSlug}`);
                console.error('     Actual first 5:', actualAlbumOrder.slice(0, 5));
                console.error('     Expected first 5:', expectedAlbumOrder.slice(0, 5));
                process.exitCode = 1;
            }
        }
    }

    // Test 2: Tag View Sorting (3 random tags)
    console.log('\n📍 Test 2: Tag View Sorting (3 random tags, first visible batch)');
    await page.goto(`${TARGET_URL}/photography/tags`);
    await page.waitForSelector('[data-tag-link]');
    const tagValues = await page.$$eval('[data-tag-link]', links =>
        links.map(link => link.getAttribute('data-tag'))
    );
    const tagIndices = pickRandomIndices(tagValues.length, 3);
    console.log(`   Total tags: ${tagValues.length}, testing indices: ${tagIndices.join(', ')}`);

    for (const idx of tagIndices) {
        await page.goto(`${TARGET_URL}/photography/tags`);
        await page.waitForSelector('[data-tag-link]');
        const tagLink = page.locator('[data-tag-link]').nth(idx);
        const tagValue = tagValues[idx] || `(tag ${idx})`;
        console.log(`   Navigating to tag: #${tagValue}`);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            tagLink.click()
        ]);

        const tagCards = await getCardData(page);

        console.log(`   Visible photos in #${tagValue}:`, tagCards.length);
        console.log('   First 3 IDs:', tagCards.slice(0, 3).map(c => c.id));

        if (tagCards.length === 0) {
            console.error(`   ✗ No photos found in tag view (#${tagValue})`);
            process.exitCode = 1;
        } else {
            const expectedTagOrder = sortByRules(tagCards).map(card => card.id);
            const actualTagOrder = tagCards.map(card => card.id);

            if (actualTagOrder.join('|') === expectedTagOrder.join('|')) {
                console.log('   ✓ Tag photos sorted by order_score, then date desc');
            } else {
                console.error(`   ✗ Tag photos not sorted correctly for #${tagValue}`);
                console.error('     Actual first 5:', actualTagOrder.slice(0, 5));
                console.error('     Expected first 5:', expectedTagOrder.slice(0, 5));
                process.exitCode = 1;
            }
        }
    }

    console.log('\n✅ Sorting tests completed!\n');

    await browser.close();
})();
