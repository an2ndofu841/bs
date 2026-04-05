'use client';

import { create } from 'zustand';
import type { SessionParticipant, ParticipantInput } from '@/types/database';

interface SharedState {
  participants: SessionParticipant[];
  inputs: ParticipantInput[];
  currentParticipant: SessionParticipant | null;
  isJoined: boolean;

  setParticipants: (participants: SessionParticipant[]) => void;
  addParticipant: (participant: SessionParticipant) => void;
  removeParticipant: (id: string) => void;
  setInputs: (inputs: ParticipantInput[]) => void;
  addInput: (input: ParticipantInput) => void;
  setCurrentParticipant: (participant: SessionParticipant | null) => void;
  setIsJoined: (val: boolean) => void;
}

export const useSharedStore = create<SharedState>((set) => ({
  participants: [],
  inputs: [],
  currentParticipant: null,
  isJoined: false,

  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((state) => ({ participants: [...state.participants, participant] })),
  removeParticipant: (id) =>
    set((state) => ({ participants: state.participants.filter((p) => p.id !== id) })),
  setInputs: (inputs) => set({ inputs }),
  addInput: (input) => set((state) => ({ inputs: [...state.inputs, input] })),
  setCurrentParticipant: (participant) => set({ currentParticipant: participant }),
  setIsJoined: (val) => set({ isJoined: val }),
}));
