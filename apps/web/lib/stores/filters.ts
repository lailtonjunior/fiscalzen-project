import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocType, Situacao } from '../types';

// ============================================
// Filter Store Interface
// ============================================

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface FiltersState {
  // Global filters
  companyId: string | null;

  // Document filters
  dateRange: DateRange;
  docType: DocType | null;
  situacao: Situacao | null;
  searchQuery: string;

  // Pagination
  page: number;
  pageSize: number;

  // Actions
  setCompanyId: (companyId: string | null) => void;
  setDateRange: (range: DateRange) => void;
  setDocType: (docType: DocType | null) => void;
  setSituacao: (situacao: Situacao | null) => void;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
}

// ============================================
// Default State
// ============================================

const defaultState = {
  companyId: null,
  dateRange: {
    start: null,
    end: null,
  },
  docType: null,
  situacao: null,
  searchQuery: '',
  page: 1,
  pageSize: 20,
};

// ============================================
// Store
// ============================================

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...defaultState,

      setCompanyId: (companyId) =>
        set({ companyId, page: 1 }),

      setDateRange: (dateRange) =>
        set({ dateRange, page: 1 }),

      setDocType: (docType) =>
        set({ docType, page: 1 }),

      setSituacao: (situacao) =>
        set({ situacao, page: 1 }),

      setSearchQuery: (searchQuery) =>
        set({ searchQuery, page: 1 }),

      setPage: (page) =>
        set({ page }),

      setPageSize: (pageSize) =>
        set({ pageSize, page: 1 }),

      resetFilters: () =>
        set(defaultState),
    }),
    {
      name: 'fiscalzen-filters',
      partialize: (state) => ({
        companyId: state.companyId,
        pageSize: state.pageSize,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectActiveFiltersCount = (state: FiltersState): number => {
  let count = 0;
  if (state.companyId) count++;
  if (state.dateRange.start || state.dateRange.end) count++;
  if (state.docType) count++;
  if (state.situacao) count++;
  if (state.searchQuery) count++;
  return count;
};
