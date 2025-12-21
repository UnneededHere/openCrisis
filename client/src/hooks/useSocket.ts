import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { SOCKET_EVENTS } from '@opencrisis/shared';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = () => {
    const { token } = useAuthStore();
    const {
        currentCommitteeId,
        addDirective,
        updateDirective,
        addUpdate,
        addNote,
        incrementUnreadNoteCount
    } = useAppStore();

    const previousCommitteeRef = useRef<string | null>(null);

    useEffect(() => {
        if (!token) {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
            return;
        }

        // Initialize socket if not already connected
        if (!socket) {
            socket = io(SOCKET_URL, {
                auth: { token },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socket.on('connect', () => {
                console.log('Socket connected');
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            // Listen for real-time events
            socket.on(SOCKET_EVENTS.DIRECTIVE_CREATED, ({ directive }) => {
                addDirective(directive);
            });

            socket.on(SOCKET_EVENTS.DIRECTIVE_UPDATED, (payload) => {
                updateDirective(payload.directiveId, {
                    status: payload.status,
                    feedback: payload.feedback,
                    outcome: payload.outcome,
                } as never);
            });

            socket.on(SOCKET_EVENTS.UPDATE_NEW, ({ update }) => {
                addUpdate(update);
            });

            socket.on(SOCKET_EVENTS.NOTE_NEW, ({ note }) => {
                addNote(note);
                incrementUnreadNoteCount();
            });
        }

        return () => {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        };
    }, [token, addDirective, updateDirective, addUpdate, addNote, incrementUnreadNoteCount]);

    // Handle committee room joining/leaving
    useEffect(() => {
        if (!socket || !socket.connected) return;

        // Leave previous committee if any
        if (previousCommitteeRef.current) {
            socket.emit(SOCKET_EVENTS.LEAVE_COMMITTEE, {
                committeeId: previousCommitteeRef.current
            });
        }

        // Join new committee if set
        if (currentCommitteeId) {
            socket.emit(SOCKET_EVENTS.JOIN_COMMITTEE, {
                committeeId: currentCommitteeId
            });
        }

        previousCommitteeRef.current = currentCommitteeId;
    }, [currentCommitteeId]);

    return socket;
};

export const getSocket = () => socket;
