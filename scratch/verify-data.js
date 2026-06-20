const prisma = require('/Users/aarushgupta/Documents/Projects/take-one-nexus/utils/prisma');

async function test() {
    try {
        console.log('Connecting to TiDB database...');
        const userCount = await prisma.user.count();
        console.log('Total users in database:', userCount);

        const users = await prisma.user.findMany({
            take: 5,
            select: { id: true, name: true, role: true }
        });
        console.log('First 5 users:', users);

        const analyticsCount = await prisma.analyticsEvent.count();
        console.log('Total analytics events:', analyticsCount);

    } catch (err) {
        console.error('Error during database verification:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
