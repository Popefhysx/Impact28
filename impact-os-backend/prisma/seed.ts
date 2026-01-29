import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create super admin user
    const superAdmin = await prisma.user.upsert({
        where: { email: 'c28@diranx.com' },
        update: {},
        create: {
            email: 'c28@diranx.com',
            firstName: 'Super',
            lastName: 'Admin',
            identityLevel: 'L5_CATALYST',
            isActive: true,
        },
    });

    console.log(`✅ Super admin created: ${superAdmin.email} (id: ${superAdmin.id})`);
    console.log('\n📋 Login Instructions:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Enter email: c28@diranx.com');
    console.log('3. Enter OTP: 000000 (dev bypass code)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
