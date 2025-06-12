import { create } from 'zustand'
import { NavigationState, Annotation } from '../types'

interface NavigationStore extends NavigationState {
  // 状态更新方法
  setCurrentPage: (page: number) => void
  setTotalPages: (total: number) => void
  setCurrentView: (view: NavigationState['currentView']) => void
  setFilePath: (path: string) => void
  
  // 导航方法
  nextPage: () => void
  previousPage: () => void
  jumpToPage: (page: number) => void
  
  // 批注管理
  annotations: Annotation[]
  addAnnotation: (annotation: Annotation) => void
  removeAnnotation: (id: string) => void
  
  // 重置状态
  reset: () => void
}

const initialState: NavigationState = {
  currentPage: 1,
  totalPages: 0,
  currentView: 'preview',
  filePath: ''
}

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,
  annotations: [],

  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setCurrentView: (view) => set({ currentView: view }),
  setFilePath: (path) => set({ filePath: path }),

  nextPage: () => {
    const { currentPage, totalPages } = get()
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 })
    }
  },

  previousPage: () => {
    const { currentPage } = get()
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 })
    }
  },

  jumpToPage: (page) => {
    const { totalPages } = get()
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page })
    }
  },

  addAnnotation: (annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation]
    }))
  },

  removeAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter(a => a.id !== id)
    }))
  },

  reset: () => {
    set({
      ...initialState,
      annotations: []
    })
  }
})) 