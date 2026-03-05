import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../config/logger';
import { User, Conference, Committee, Directive, Message, Announcement } from '../models';

const seedDatabase = async () => {
    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');

        // Clear ALL existing data
        logger.info('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Conference.deleteMany({}),
            Committee.deleteMany({}),
            Directive.deleteMany({}),
            Message.deleteMany({}),
            Announcement.deleteMany({}),
        ]);

        // Create admin user
        logger.info('Creating admin user...');
        const admin = await User.create({
            email: 'admin@example.com',
            password: 'password123',
            name: 'System Administrator',
            role: 'admin',
        });

        // Create staff users
        logger.info('Creating staff users...');
        const staff1 = await User.create({
            email: 'staff@example.com',
            password: 'password123',
            name: 'Crisis Director',
            role: 'staff',
        });

        const staff2 = await User.create({
            email: 'staff2@example.com',
            password: 'password123',
            name: 'Assistant Director',
            role: 'staff',
        });

        // Create delegate users
        logger.info('Creating delegate users...');
        const delegates = await User.create([
            { email: 'delegate1@example.com', password: 'password123', name: 'Alice Johnson', role: 'delegate' },
            { email: 'delegate2@example.com', password: 'password123', name: 'Bob Smith', role: 'delegate' },
            { email: 'delegate3@example.com', password: 'password123', name: 'Carlos Rivera', role: 'delegate' },
            { email: 'delegate4@example.com', password: 'password123', name: 'Diana Chen', role: 'delegate' },
            { email: 'delegate5@example.com', password: 'password123', name: 'Eva Mueller', role: 'delegate' },
            { email: 'delegate6@example.com', password: 'password123', name: 'Frank Okonkwo', role: 'delegate' },
        ]);

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

        // Create committees with character names
        logger.info('Creating committees...');

        // Crisis Committee - Cold War Cabinet
        const crisisCommittee = await Committee.create({
            name: 'Cold War Crisis Cabinet',
            conference: conference._id,
            description: 'A high-stakes crisis committee set during the Cuban Missile Crisis of 1962.',
            type: 'crisis',
            members: [
                { user: delegates[0]._id, characterName: 'John F. Kennedy' },
                { user: delegates[1]._id, characterName: 'Robert McNamara' },
                { user: delegates[2]._id, characterName: 'Dean Rusk' },
                { user: delegates[3]._id, characterName: 'Robert Kennedy' },
                { user: delegates[4]._id, characterName: 'McGeorge Bundy' },
                { user: delegates[5]._id, characterName: 'Adlai Stevenson' },
            ],
            staff: [staff1._id, staff2._id],
        });

        // General Assembly Committee
        const generalCommittee = await Committee.create({
            name: 'UN General Assembly',
            conference: conference._id,
            description: 'The main deliberative body of the United Nations.',
            type: 'general',
            members: [
                { user: delegates[0]._id, characterName: 'Delegate of the United States' },
                { user: delegates[1]._id, characterName: 'Delegate of the United Kingdom' },
                { user: delegates[2]._id, characterName: 'Delegate of Mexico' },
                { user: delegates[3]._id, characterName: 'Delegate of China' },
            ],
            staff: [staff1._id],
        });

        // Security Council Committee  
        const securityCommittee = await Committee.create({
            name: 'UN Security Council',
            conference: conference._id,
            description: 'The principal organ responsible for international peace and security.',
            type: 'specialized',
            members: [
                { user: delegates[0]._id, characterName: 'Ambassador of the United States' },
                { user: delegates[2]._id, characterName: 'Ambassador of Mexico' },
                { user: delegates[4]._id, characterName: 'Ambassador of Germany' },
                { user: delegates[5]._id, characterName: 'Ambassador of Nigeria' },
            ],
            staff: [staff2._id],
        });

        // Update users with conference
        const allUserIds = [staff1._id, staff2._id, ...delegates.map(d => d._id)];
        await User.updateMany(
            { _id: { $in: allUserIds } },
            { $push: { conferences: conference._id } }
        );

        logger.info('='.repeat(50));
        logger.info('Seed completed successfully!');
        logger.info('='.repeat(50));
        logger.info('');
        logger.info('Demo accounts (all use password: password123):');
        logger.info('');
        logger.info('  Admin:    admin@example.com');
        logger.info('  Staff:    staff@example.com, staff2@example.com');
        logger.info('');
        logger.info('  Delegates:');
        logger.info('    delegate1@example.com - Alice Johnson');
        logger.info('    delegate2@example.com - Bob Smith');
        logger.info('    delegate3@example.com - Carlos Rivera');
        logger.info('    delegate4@example.com - Diana Chen');
        logger.info('    delegate5@example.com - Eva Mueller');
        logger.info('    delegate6@example.com - Frank Okonkwo');
        logger.info('');
        logger.info('Committees:');
        logger.info(`  - ${crisisCommittee.name} (${crisisCommittee.type}) - 6 characters`);
        logger.info(`  - ${generalCommittee.name} (${generalCommittee.type}) - 4 characters`);
        logger.info(`  - ${securityCommittee.name} (${securityCommittee.type}) - 4 characters`);
        logger.info('');
        logger.info('Character Assignments (Cold War Crisis Cabinet):');
        logger.info('  Alice (delegate1) -> John F. Kennedy');
        logger.info('  Bob (delegate2) -> Robert McNamara');
        logger.info('  Carlos (delegate3) -> Dean Rusk');
        logger.info('  Diana (delegate4) -> Robert Kennedy');
        logger.info('  Eva (delegate5) -> McGeorge Bundy');
        logger.info('  Frank (delegate6) -> Adlai Stevenson');
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
