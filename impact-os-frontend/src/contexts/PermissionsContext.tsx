'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';

/**
 * Staff Category (mirrors backend)
 */
export type StaffCategory = 'ADMIN' | 'STAFF' | 'OBSERVER';

/**
 * Permissions state from the current user's session
 */
interface PermissionsState {
    isAuthenticated: boolean;
    isStaff: boolean;
    category: StaffCategory | null;
    capabilities: string[];
    isSuperAdmin: boolean;
    cohortIds: string[];
}

interface PermissionsContextValue extends PermissionsState {
    hasCapability: (capability: string) => boolean;
    hasAnyCapability: (...capabilities: string[]) => boolean;
    hasAllCapabilities: (...capabilities: string[]) => boolean;
    hasCohortAccess: (cohortId: string) => boolean;
    isAtLeastCategory: (category: StaffCategory) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Hook to access permissions
 */
export function usePermissions(): PermissionsContextValue {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
}

/**
 * Check if user has at least the given category level
 */
function categoryLevel(cat: StaffCategory | null): number {
    if (!cat) return 0;
    switch (cat) {
        case 'ADMIN': return 3;
        case 'STAFF': return 2;
        case 'OBSERVER': return 1;
        default: return 0;
    }
}

interface PermissionsProviderProps {
    children: ReactNode;
    // In a real app, this would come from auth context/session
    initialState?: Partial<PermissionsState>;
}

/**
 * Provider for permissions state
 * In production, this would fetch from /api/auth/me or similar
 */
export function PermissionsProvider({ children, initialState }: PermissionsProviderProps) {
    // Default state - in production this would be loaded from session
    const state: PermissionsState = {
        isAuthenticated: initialState?.isAuthenticated ?? false,
        isStaff: initialState?.isStaff ?? false,
        category: initialState?.category ?? null,
        capabilities: initialState?.capabilities ?? [],
        isSuperAdmin: initialState?.isSuperAdmin ?? false,
        cohortIds: initialState?.cohortIds ?? [],
    };

    const value: PermissionsContextValue = useMemo(() => ({
        ...state,

        hasCapability: (capability: string) => {
            if (state.isSuperAdmin) return true;
            return state.capabilities.includes(capability);
        },

        hasAnyCapability: (...capabilities: string[]) => {
            if (state.isSuperAdmin) return true;
            return capabilities.some(cap => state.capabilities.includes(cap));
        },

        hasAllCapabilities: (...capabilities: string[]) => {
            if (state.isSuperAdmin) return true;
            return capabilities.every(cap => state.capabilities.includes(cap));
        },

        hasCohortAccess: (cohortId: string) => {
            if (state.isSuperAdmin || state.category === 'ADMIN') return true;
            return state.cohortIds.includes(cohortId);
        },

        isAtLeastCategory: (category: StaffCategory) => {
            return categoryLevel(state.category) >= categoryLevel(category);
        },
    }), [state]);

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}

/**
 * CanAccess component - conditionally renders children based on permissions
 * 
 * Usage:
 * <CanAccess capability="admissions.manage">
 *   <Button>Make Decision</Button>
 * </CanAccess>
 * 
 * <CanAccess capabilities={['income.review', 'income.approve']} requireAll={false}>
 *   <IncomeReviewPanel />
 * </CanAccess>
 */
interface CanAccessProps {
    children: ReactNode;
    /** Single capability to check */
    capability?: string;
    /** Multiple capabilities to check */
    capabilities?: string[];
    /** If true, require all capabilities; if false, require any one */
    requireAll?: boolean;
    /** Minimum category level required */
    category?: StaffCategory;
    /** Fallback to render if access denied */
    fallback?: ReactNode;
}

export function CanAccess({
    children,
    capability,
    capabilities,
    requireAll = false,
    category,
    fallback = null,
}: CanAccessProps) {
    const permissions = usePermissions();

    let hasAccess = true;

    // Check single capability
    if (capability) {
        hasAccess = hasAccess && permissions.hasCapability(capability);
    }

    // Check multiple capabilities
    if (capabilities && capabilities.length > 0) {
        if (requireAll) {
            hasAccess = hasAccess && permissions.hasAllCapabilities(...capabilities);
        } else {
            hasAccess = hasAccess && permissions.hasAnyCapability(...capabilities);
        }
    }

    // Check category level
    if (category) {
        hasAccess = hasAccess && permissions.isAtLeastCategory(category);
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook variant - useful for conditional logic beyond rendering
 */
export function useCanAccess(options: Omit<CanAccessProps, 'children' | 'fallback'>): boolean {
    const permissions = usePermissions();

    let hasAccess = true;

    if (options.capability) {
        hasAccess = hasAccess && permissions.hasCapability(options.capability);
    }

    if (options.capabilities && options.capabilities.length > 0) {
        if (options.requireAll) {
            hasAccess = hasAccess && permissions.hasAllCapabilities(...options.capabilities);
        } else {
            hasAccess = hasAccess && permissions.hasAnyCapability(...options.capabilities);
        }
    }

    if (options.category) {
        hasAccess = hasAccess && permissions.isAtLeastCategory(options.category);
    }

    return hasAccess;
}

export default PermissionsContext;
