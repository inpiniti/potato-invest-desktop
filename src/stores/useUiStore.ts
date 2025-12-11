import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  // Panel Visibility
  isBottomPanelOpen: boolean
  isRightPanelOpen: boolean

  // Actions
  toggleBottomPanel: () => void
  toggleRightPanel: () => void
  setBottomPanelOpen: (open: boolean) => void
  setRightPanelOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      isBottomPanelOpen: true,
      isRightPanelOpen: true,

      toggleBottomPanel: () => set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen })),
      toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
      setBottomPanelOpen: (open) => set({ isBottomPanelOpen: open }),
      setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
