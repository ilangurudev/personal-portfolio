const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

function sortByDate(cards, dateSortOrder = 'asc') {
    const dateMultiplier = dateSortOrder === 'asc' ? 1 : -1;
    return [...cards].sort((a, b) =>
        dateMultiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
    );
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

    // Test 0: Home uses a manually authored sequence, independent of archive sorting.
    console.log('📍 Test 0: Photography Home Curated Sequence');
    await page.goto(`${TARGET_URL}/photography`);
    await page.waitForSelector('[data-curated-photo]');
    const homeIds = await page.$$eval('[data-curated-photo]', cards => cards.map(card => card.getAttribute('data-photo-id')));
    const expectedOpening = [
      'new-york-2025/AR53824.md',
      'georgetown-metro-2025/20250914-_AR50392.md',
      'dc-hot-summer/20250623-_AR55740.md'
    ];
    if (homeIds.length !== 20 || homeIds.slice(0, 3).join('|') !== expectedOpening.join('|')) {
      console.error('   Curated homepage sequence changed unexpectedly');
      process.exitCode = 1;
    } else {
      console.log('   ✓ Manual 20-photo sequence begins with the approved opening rhythm');
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
        const storySource = await page.locator('#photos-data').evaluate(element =>
            JSON.parse(element.textContent || '[]').map(photo => ({
                id: photo.id,
                date: photo.data?.date || ''
            }))
        );

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
            const expectedAlbumOrder = sortByDate(storySource, dateSortOrder).map(card => card.id);
            const actualAlbumOrder = storySource.map(card => card.id);

            if (actualAlbumOrder.join('|') === expectedAlbumOrder.join('|')) {
                console.log(`   ✓ Album story source sorted by date ${dateSortOrder}; editorial emphasis is applied separately`);
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
        const tagSource = await page.locator('#photos-data').evaluate(element =>
            JSON.parse(element.textContent || '[]').map(photo => ({
                id: photo.id,
                date: photo.data?.date || ''
            }))
        );

        console.log(`   Visible photos in #${tagValue}:`, tagCards.length);
        console.log('   First 3 IDs:', tagCards.slice(0, 3).map(c => c.id));

        if (tagCards.length === 0) {
            console.error(`   ✗ No photos found in tag view (#${tagValue})`);
            process.exitCode = 1;
        } else {
            const expectedTagOrder = sortByDate(tagSource, 'desc').map(card => card.id);
            const actualTagOrder = tagSource.map(card => card.id);

            if (actualTagOrder.join('|') === expectedTagOrder.join('|')) {
                console.log('   ✓ Tag story source sorted by date desc; editorial emphasis is applied separately');
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
