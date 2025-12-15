import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AdminFace {
    id: string
    name: string
    image: string // base64
    createdAt: Date
}

export interface Session {
    id: string
    faceId: string
    faceName: string
    loginImage: string // base64 - ảnh khi login
    confidence: number // 0-100
    message: string // AI message
    ip: string
    location: string // GPS coordinates
    device: string
    loginAt: Date
    logoutAt?: Date
}

interface AuthStore {
    // Auth state
    isAuthenticated: boolean
    currentUser: string | null

    // Admin faces
    adminFaces: AdminFace[]
    addAdminFace: (face: AdminFace) => void
    removeAdminFace: (id: string) => void

    // Sessions
    sessions: Session[]
    addSession: (session: Session) => void
    endSession: (sessionId: string) => void

    // Auth actions
    login: (userName: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            currentUser: null,
            adminFaces: [],
            sessions: [],

            addAdminFace: (face) =>
                set((state) => ({
                    adminFaces: [...state.adminFaces, face],
                })),

            removeAdminFace: (id) =>
                set((state) => ({
                    adminFaces: state.adminFaces.filter((f) => f.id !== id),
                })),

            addSession: (session) =>
                set((state) => ({
                    sessions: [session, ...state.sessions],
                })),

            endSession: (sessionId) =>
                set((state) => ({
                    sessions: state.sessions.map((s) =>
                        s.id === sessionId ? { ...s, logoutAt: new Date() } : s
                    ),
                })),

            login: (userName) =>
                set({
                    isAuthenticated: true,
                    currentUser: userName,
                }),

            logout: () =>
                set({
                    isAuthenticated: false,
                    currentUser: null,
                }),
        }),
        {
            name: 'wise-man-auth',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
