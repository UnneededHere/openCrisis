import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api/client';
import type { UserRole } from '@opencrisis/shared';

interface User {
    _id: string;
    email: string;
    name: string;
    role: UserRole;
    conferences?: string[];
}

interface AuthState {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            user: null,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { user, tokens } = response.data.data;

                    set({
                        token: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        user,
                        isLoading: false,
                    });
                } catch (error: unknown) {
                    const message = (error as { response?: { data?: { error?: { message?: string } } } })
                        ?.response?.data?.error?.message || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            register: async (email: string, password: string, name: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/register', { email, password, name });
                    const { user, tokens } = response.data.data;

                    set({
                        token: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        user,
                        isLoading: false,
                    });
                } catch (error: unknown) {
                    const message = (error as { response?: { data?: { error?: { message?: string } } } })
                        ?.response?.data?.error?.message || 'Registration failed';
                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                const { token, refreshToken } = get();
                if (token && refreshToken) {
                    api.post('/auth/logout', { refreshToken }).catch(() => { });
                }
                set({ token: null, refreshToken: null, user: null, error: null });
            },

            loadUser: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.get('/auth/me');
                    set({ user: response.data.data, isLoading: false });
                } catch (error) {
                    set({ token: null, refreshToken: null, user: null, isLoading: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'opencrisis-auth',
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
