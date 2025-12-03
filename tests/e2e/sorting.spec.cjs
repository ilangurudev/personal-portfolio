const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:4321';

(async () => {
    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
        slowMo: 100
    });
    const page = await browser.newPage();

    console.log('🧪 Testing Photo Sorting...\n');

    // Test 1: Album View Sorting
    console.log('📍 Test 1: Album View Sorting (tampa-2025)');
    await page.goto(`${TARGET_URL}/photography/album/tampa-2025`);
    await page.waitForLoadState('networkidle');

    // Get the first few photo IDs
    const albumPhotoIds = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.photo-card'));
        return cards.map(card => card.getAttribute('data-photo-id'));
    });

    console.log('   First 3 photos in album:', albumPhotoIds.slice(0, 3));

    // Check if 20251109-_AR51599 is in the top 2
    // The ID format usually includes the folder, e.g., "tampa-2025/20251109-_AR51599"
    const targetAlbumPhoto = 'tampa-2025/20251109-_AR51599';
    const isTop2Album = albumPhotoIds.slice(0, 2).some(id => id && id.includes('20251109-_AR51599'));

    if (isTop2Album) {
        console.log('   ✓ Target photo is in top 2');
    } else {
        console.error('   ✗ Target photo is NOT in top 2');
        process.exitCode = 1;
    }

    // Test 2: Tag View Sorting
    console.log('\n📍 Test 2: Tag View Sorting (#flowers)');
    await page.goto(`${TARGET_URL}/photography/tag/flowers`);
    await page.waitForLoadState('networkidle');

    // Get the first photo ID
    const tagPhotoIds = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.photo-card'));
        return cards.map(card => card.getAttribute('data-photo-id'));
    });

    console.log('   First 3 photos in tag view:', tagPhotoIds.slice(0, 3));

    // Check if 20250810-_AR59512 is the first one
    const targetTagPhoto = 'burnside-farms-2025/20250810-_AR59512';
    const isFirstTag = tagPhotoIds.length > 0 && tagPhotoIds[0].includes('20250810-_AR59512');

    if (isFirstTag) {
        console.log('   ✓ Target photo is first');
    } else {
        console.error('   ✗ Target photo is NOT first');
        process.exitCode = 1;
    }

    console.log('\n✅ Sorting tests completed!\n');

    await browser.close();
})();
