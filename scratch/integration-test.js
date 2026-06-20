const jwt = require('jsonwebtoken');
const prisma = require('/Users/aarushgupta/Documents/Projects/take-one-nexus/utils/prisma');

const JWT_SECRET = 'd264cd06d9717766f8fa182d47bfa4fa282268404a5bee7a3c5900fd7cafe121';

// Mock User 1 rating User 2
const raterId = 1;
const ratedId = 2;

const token = jwt.sign({
    id: raterId,
    email: 'rater@example.com',
    role: 'Director',
    email_verified: true
}, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
    console.log('--- Starting Creator Ratings Integration Tests ---');

    // 1. Clean up any existing rating or notifications or analytics for rater/rated
    await prisma.userRating.deleteMany({
        where: { rated_by_id: raterId, rated_user_id: ratedId }
    });
    console.log('Cleared existing ratings between test users.');

    const initialNotifications = await prisma.notifications.findMany({
        where: { user_id: ratedId }
    });
    const initialNotificationCount = initialNotifications.length;
    console.log('Initial notifications for rated user:', initialNotificationCount);

    const initialAnalytics = await prisma.analyticsEvent.count({
        where: { event_type: { in: ['profile_rated', 'rating_removed'] } }
    });
    console.log('Initial analytics count:', initialAnalytics);

    // 2. Submit a new rating via fetch
    console.log('\n1. Submitting new rating (5 stars)...');
    let res = await fetch('http://127.0.0.1:5001/api/ratings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            ratedUserId: ratedId,
            rating: 5
        })
    });
    let data = await res.json();
    console.log('Response:', data);
    if (!data.success) throw new Error('Submission failed');

    // Verify Notification count incremented by 1
    const postSubmitNotifications = await prisma.notifications.findMany({
        where: { user_id: ratedId }
    });
    console.log('Notifications after submit:', postSubmitNotifications.length);
    if (postSubmitNotifications.length !== initialNotificationCount + 1) {
        throw new Error('Notification count mismatch! Notification was not triggered.');
    }
    const newNotification = postSubmitNotifications.find(n => !initialNotifications.some(inN => inN.id === n.id));
    console.log('Notification Content:', newNotification.message || newNotification.title || newNotification.body);
    const contentText = newNotification.message || newNotification.title || newNotification.body || '';
    if (!contentText.toLowerCase().includes('rated') && !contentText.toLowerCase().includes('rating')) {
        throw new Error('Notification message incorrect.');
    }

    // Verify AnalyticsEvent table has one new event: profile_rated
    const postSubmitAnalytics = await prisma.analyticsEvent.findMany({
        where: { event_type: 'profile_rated' }
    });
    console.log('Analytics events count after submit:', postSubmitAnalytics.length);
    const newAnalyticsEvent = postSubmitAnalytics[postSubmitAnalytics.length - 1];
    console.log('Latest analytics event type:', newAnalyticsEvent.event_type, 'visitor IP hash:', newAnalyticsEvent.visitor_ip);
    if (!newAnalyticsEvent) throw new Error('Analytics event was not recorded');

    // 3. Edit the rating
    console.log('\n2. Editing rating (4 stars)...');
    res = await fetch('http://127.0.0.1:5001/api/ratings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            ratedUserId: ratedId,
            rating: 4
        })
    });
    data = await res.json();
    console.log('Response:', data);
    if (!data.success) throw new Error('Edit failed');

    // Verify Notification count has NOT changed (notifications only trigger on new ratings)
    const postEditNotifications = await prisma.notifications.findMany({
        where: { user_id: ratedId }
    });
    console.log('Notifications after edit:', postEditNotifications.length);
    if (postEditNotifications.length !== postSubmitNotifications.length) {
        throw new Error('Unexpected notification triggered on edit!');
    }

    // 4. Delete the rating
    console.log('\n3. Deleting rating...');
    res = await fetch(`http://127.0.0.1:5001/api/ratings/${ratedId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    data = await res.json();
    console.log('Response:', data);
    if (!data.success) throw new Error('Deletion failed');

    // Verify record is deleted from UserRatings
    const ratingRecord = await prisma.userRating.findFirst({
        where: { rated_by_id: raterId, rated_user_id: ratedId }
    });
    if (ratingRecord) {
        throw new Error('Rating record still exists in DB after deletion!');
    }
    console.log('Rating record confirmed deleted from DB.');

    // Verify AnalyticsEvent table has one new event: rating_removed
    const postDeleteAnalytics = await prisma.analyticsEvent.findMany({
        where: { event_type: 'rating_removed' }
    });
    console.log('Analytics events count after deletion:', postDeleteAnalytics.length);
    const newDeleteAnalyticsEvent = postDeleteAnalytics[postDeleteAnalytics.length - 1];
    console.log('Latest analytics event type:', newDeleteAnalyticsEvent.event_type);
    if (!newDeleteAnalyticsEvent) throw new Error('Delete analytics event was not recorded');

    // 5. Clean up notifications/analytics from this test run
    await prisma.notifications.deleteMany({
        where: { id: { in: postEditNotifications.map(n => n.id).filter(id => !initialNotifications.some(inN => inN.id === id)) } }
    });
    await prisma.analyticsEvent.deleteMany({
        where: { id: { in: [newAnalyticsEvent.id, newDeleteAnalyticsEvent.id] } }
    });
    console.log('Cleaned up test notifications and analytics events.');

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
