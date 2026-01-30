'use client';

import { Search, LayoutGrid, List, Filter } from 'lucide-react';
import { Select } from '@/components/ui/Select/Select';
import styles from './SearchFilterBar.module.css';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    key: string;
    options: FilterOption[];
    placeholder: string;
}

export interface SearchFilterBarProps {
    // Search
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    // Filters - array of filter configs
    filters?: FilterConfig[];
    filterValues?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;

    // View toggle
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
    showViewToggle?: boolean;
}

export function SearchFilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters = [],
    filterValues = {},
    onFilterChange,
    viewMode = 'list',
    onViewModeChange,
    showViewToggle = true,
}: SearchFilterBarProps) {
    return (
        <div className={styles.toolbar}>
            {/* Search Box */}
            <div className={styles.searchBox}>
                <Search size={18} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Desktop Filters - inline */}
            {filters.length > 0 && (
                <div className={styles.filterRow}>
                    {filters.map((filter) => (
                        <div key={filter.key} className={styles.selectWrapper}>
                            <Select
                                options={filter.options}
                                value={filterValues[filter.key] || filter.options[0]?.value || ''}
                                onChange={(value) => onFilterChange?.(filter.key, value)}
                                placeholder={filter.placeholder}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* View Toggle */}
            {showViewToggle && onViewModeChange && (
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => onViewModeChange('grid')}
                        aria-label="Grid view"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => onViewModeChange('list')}
                        aria-label="List view"
                    >
                        <List size={18} />
                    </button>
                </div>
            )}

            {/* Mobile Filter Toggle (collapsible) */}
            {filters.length > 0 && (
                <div className={styles.mobileFiltersContainer}>
                    {filters.map((filter) => (
                        <div key={filter.key} className={styles.mobileFilter}>
                            <label className={styles.mobileFilterLabel}>{filter.placeholder}</label>
                            <Select
                                options={filter.options}
                                value={filterValues[filter.key] || filter.options[0]?.value || ''}
                                onChange={(value) => onFilterChange?.(filter.key, value)}
                                placeholder={filter.placeholder}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchFilterBar;
