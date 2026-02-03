/**
 * Seed Super Admin User
 * Run with: npx ts-node prisma/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
    const adminEmail = 'c28@diranx.com';
    const adminPin = '3100'; // Default PIN - should be changed on first login
    const hashedPin = await bcrypt.hash(adminPin, 10);

    console.log('🔐 Creating super admin user...');

    // Create or update the user
    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            firstName: 'Super',
            lastName: 'Admin',
            username: 'xbuk',
            pin: hashedPin,
        },
        create: {
            email: adminEmail,
            firstName: 'Super',
            lastName: 'Admin',
            username: 'xbuk',
            pin: hashedPin,
            identityLevel: 'L5_CATALYST',
            currentPhase: 'CATALYST',
            isActive: true,
        },
    });

    console.log(`✅ User created/updated: ${user.id} (${user.email})`);

    // Create or update staff record
    const staff = await prisma.staff.upsert({
        where: { userId: user.id },
        update: {
            category: 'ADMIN',
            isSuperAdmin: true,
            setupCompleted: true,
            capabilities: [
                'manage_staff',
                'manage_admissions',
                'manage_support',
                'manage_curriculum',
                'manage_cohorts',
                'view_analytics',
                'manage_settings',
                'manage_communications',
            ],
        },
        create: {
            userId: user.id,
            category: 'ADMIN',
            isSuperAdmin: true,
            setupCompleted: true,
            invitedBy: 'SYSTEM',
            capabilities: [
                'manage_staff',
                'manage_admissions',
                'manage_support',
                'manage_curriculum',
                'manage_cohorts',
                'view_analytics',
                'manage_settings',
                'manage_communications',
            ],
        },
    });

    console.log(`✅ Staff record created/updated: ${staff.id} (super admin)`);
    console.log(`\n🎉 Super admin ready!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Username: xbuk`);
    console.log(`   PIN: ${adminPin} (change this after first login!)`);
}

seedSuperAdmin()
    .catch((e) => {
        console.error('❌ Error seeding super admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
