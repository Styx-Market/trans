import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface TranscriptionSegment {
    timestamp: string
    speaker: string // "Nam 1", "Nữ 1", etc.
    text: string
    gender?: 'male' | 'female'
}

export interface Transcription {
    text: string
    segments: TranscriptionSegment[]
    speakerCount: number
    duration: number
}

export interface Recording {
    id: string
    name: string
    uri: string
    blob?: Blob
    duration: number
    date: Date
    transcription?: Transcription
    labels: string[]
}

interface RecordingStore {
    recordings: Recording[]
    addRecording: (recording: Recording) => void
    updateRecording: (id: string, updates: Partial<Recording>) => void
    deleteRecording: (id: string) => void
    deleteRecordings: (ids: string[]) => void
    getRecording: (id: string) => Recording | undefined
    searchRecordings: (query: string) => Recording[]
    getRecordingsByLabel: (label: string) => Recording[]
}

export const useRecordingStore = create<RecordingStore>()(
    persist(
        (set, get) => ({
            recordings: [],

            addRecording: (recording) =>
                set((state) => ({
                    recordings: [recording, ...state.recordings],
                })),

            updateRecording: (id, updates) =>
                set((state) => ({
                    recordings: state.recordings.map((r) =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                })),

            deleteRecording: (id) =>
                set((state) => ({
                    recordings: state.recordings.filter((r) => r.id !== id),
                })),

            deleteRecordings: (ids) =>
                set((state) => ({
                    recordings: state.recordings.filter((r) => !ids.includes(r.id)),
                })),

            getRecording: (id) => get().recordings.find((r) => r.id === id),

            searchRecordings: (query) => {
                const lowerQuery = query.toLowerCase()
                return get().recordings.filter((r) =>
                    r.name.toLowerCase().includes(lowerQuery) ||
                    r.labels.some((label) => label.toLowerCase().includes(lowerQuery)) ||
                    r.transcription?.text.toLowerCase().includes(lowerQuery)
                )
            },

            getRecordingsByLabel: (label) =>
                get().recordings.filter((r) => r.labels.includes(label)),
        }),
        {
            name: 'wise-man-recordings',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                recordings: state.recordings.map(r => ({
                    ...r,
                    // Don't persist blob, only URI
                    blob: undefined
                }))
            }),
        }
    )
)
