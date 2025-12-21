import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../config/logger';
import { User, Conference, Committee } from '../models';

const seedDatabase = async () => {
    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');

        // Clear existing data (optional - comment out to preserve data)
        logger.info('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Conference.deleteMany({}),
            Committee.deleteMany({}),
        ]);

        // Create admin user
        logger.info('Creating admin user...');
        const admin = await User.create({
            email: 'admin@example.com',
            password: 'password123',
            name: 'System Administrator',
            role: 'admin',
        });

        // Create staff user
        logger.info('Creating staff user...');
        const staff = await User.create({
            email: 'staff@example.com',
            password: 'password123',
            name: 'Crisis Staff Member',
            role: 'staff',
        });

        // Create delegate users
        logger.info('Creating delegate users...');
        const delegate1 = await User.create({
            email: 'delegate@example.com',
            password: 'password123',
            name: 'Delegate Alpha',
            role: 'delegate',
        });

        const delegate2 = await User.create({
            email: 'delegate2@example.com',
            password: 'password123',
            name: 'Delegate Beta',
            role: 'delegate',
        });

        // Create conference
        logger.info('Creating conference...');
        const conference = await Conference.create({
            name: 'OpenMUN 2024',
            description: 'An open-source Model UN conference showcasing the OpenCrisis platform.',
            createdBy: admin._id,
        });

        // Update admin with conference
        admin.conferences.push(conference._id);
        await admin.save();

        // Create committees
        logger.info('Creating committees...');
        const crisisCommittee = await Committee.create({
            name: 'Global Crisis Committee',
            conference: conference._id,
            description: 'A dynamic crisis committee addressing global security challenges.',
            type: 'crisis',
            members: [delegate1._id, delegate2._id],
            staff: [staff._id],
        });

        const generalCommittee = await Committee.create({
            name: 'UN General Assembly',
            conference: conference._id,
            description: 'The main deliberative body of the United Nations.',
            type: 'general',
            members: [delegate1._id],
            staff: [staff._id],
        });

        // Update users with conference
        await User.updateMany(
            { _id: { $in: [staff._id, delegate1._id, delegate2._id] } },
            { $push: { conferences: conference._id } }
        );

        logger.info('='.repeat(50));
        logger.info('Seed completed successfully!');
        logger.info('='.repeat(50));
        logger.info('');
        logger.info('Demo accounts:');
        logger.info('');
        logger.info('  Admin:');
        logger.info('    Email: admin@example.com');
        logger.info('    Password: password123');
        logger.info('');
        logger.info('  Staff:');
        logger.info('    Email: staff@example.com');
        logger.info('    Password: password123');
        logger.info('');
        logger.info('  Delegate:');
        logger.info('    Email: delegate@example.com');
        logger.info('    Password: password123');
        logger.info('');
        logger.info(`Conference Code: ${conference.code}`);
        logger.info('');
        logger.info('Committees:');
        logger.info(`  - ${crisisCommittee.name} (${crisisCommittee.type})`);
        logger.info(`  - ${generalCommittee.name} (${generalCommittee.type})`);
        logger.info('');
        logger.info('='.repeat(50));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        logger.error('Seed failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seedDatabase();
