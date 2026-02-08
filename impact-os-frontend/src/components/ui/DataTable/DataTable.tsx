'use client';

import { ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    truncate?: boolean;
}

export interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    keyExtractor: (row: T) => string;
}

export function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Pre-built render helper: avatar + name cell */
export function renderParticipant(firstName: string, lastName: string) {
    return (
        <div className={styles.participantCell}>
            <div className={styles.avatar}>{getInitials(firstName, lastName)}</div>
            <span>{firstName} {lastName}</span>
        </div>
    );
}

/** Pre-built render helper: action button */
export function renderActionButton(label: string, icon: ReactNode, onClick: () => void) {
    return (
        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {label} {icon}
        </button>
    );
}

export function DataTable<T>({ columns, data, onRowClick, emptyMessage, keyExtractor }: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className={styles.emptyState}>
                <CheckCircle size={24} />
                <p>{emptyMessage || 'No data available'}</p>
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr
                            key={keyExtractor(row)}
                            className={onRowClick ? styles.clickableRow : undefined}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className={col.truncate ? styles.truncate : undefined}
                                >
                                    {col.render
                                        ? col.render(row)
                                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
