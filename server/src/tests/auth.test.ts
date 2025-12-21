import request from 'supertest';
import app from '../app';
import { User } from '../models';

describe('Auth Routes', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('test@example.com');
            expect(res.body.data.tokens.accessToken).toBeDefined();
            expect(res.body.data.tokens.refreshToken).toBeDefined();
        });

        it('should fail with duplicate email', async () => {
            await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User 2',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('EMAIL_EXISTS');
        });

        it('should fail with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    name: 'Test User',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should fail with short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'short',
                    name: 'Test User',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await User.create({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });
        });

        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('test@example.com');
            expect(res.body.data.tokens.accessToken).toBeDefined();
        });

        it('should fail with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh access token', async () => {
            // First register to get tokens
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            const { refreshToken } = registerRes.body.data.tokens;

            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should fail with invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user', async () => {
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            const { accessToken } = registerRes.body.data.tokens;

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('test@example.com');
        });

        it('should fail without token', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                });

            const { accessToken, refreshToken } = registerRes.body.data.tokens;

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Refresh token should no longer work
            const refreshRes = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });

            expect(refreshRes.status).toBe(401);
        });
    });
});
