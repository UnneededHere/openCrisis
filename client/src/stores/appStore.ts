import { create } from 'zustand';
import type { DirectivePopulated, CrisisUpdatePopulated, CrisisNotePopulated } from '@opencrisis/shared';

interface AppState {
    // Current selections
    currentConferenceId: string | null;
    currentCommitteeId: string | null;

    // Real-time data
    realtimeDirectives: DirectivePopulated[];
    realtimeUpdates: CrisisUpdatePopulated[];
    realtimeNotes: CrisisNotePopulated[];
    unreadNoteCount: number;

    // Actions
    setCurrentConference: (id: string | null) => void;
    setCurrentCommittee: (id: string | null) => void;

    addDirective: (directive: DirectivePopulated) => void;
    updateDirective: (directiveId: string, updates: Partial<DirectivePopulated>) => void;

    addUpdate: (update: CrisisUpdatePopulated) => void;
    addNote: (note: CrisisNotePopulated) => void;

    setUnreadNoteCount: (count: number) => void;
    incrementUnreadNoteCount: () => void;

    clearRealtime: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
    currentConferenceId: null,
    currentCommitteeId: null,
    realtimeDirectives: [],
    realtimeUpdates: [],
    realtimeNotes: [],
    unreadNoteCount: 0,

    setCurrentConference: (id) => set({ currentConferenceId: id }),
    setCurrentCommittee: (id) => set({ currentCommitteeId: id }),

    addDirective: (directive) =>
        set((state) => ({
            realtimeDirectives: [directive, ...state.realtimeDirectives],
        })),

    updateDirective: (directiveId, updates) =>
        set((state) => ({
            realtimeDirectives: state.realtimeDirectives.map((d) =>
                d._id === directiveId ? { ...d, ...updates } : d
            ),
        })),

    addUpdate: (update) =>
        set((state) => ({
            realtimeUpdates: [update, ...state.realtimeUpdates],
        })),

    addNote: (note) =>
        set((state) => ({
            realtimeNotes: [note, ...state.realtimeNotes],
        })),

    setUnreadNoteCount: (count) => set({ unreadNoteCount: count }),
    incrementUnreadNoteCount: () =>
        set((state) => ({ unreadNoteCount: state.unreadNoteCount + 1 })),

    clearRealtime: () =>
        set({
            realtimeDirectives: [],
            realtimeUpdates: [],
            realtimeNotes: [],
        }),
}));
