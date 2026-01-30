'use client';

import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, Shield, Loader2, RefreshCw } from 'lucide-react';
import styles from './PsnForecastWidget.module.css';

interface PsnForecast {
    countHigh: number;
    countMedium: number;
    countLow: number;
    predictedDemandExpected: number;
    predictedDemandUpper: number;
    predictedDemandLower: number;
    riskBadge: 'GREEN' | 'AMBER' | 'RED';
    generatedAt: string;
}

interface PsnForecastWidgetProps {
    cohortId: string;
}

// Mock data for development
const mockForecast: PsnForecast = {
    countHigh: 12,
    countMedium: 25,
    countLow: 18,
    predictedDemandExpected: 3200,
    predictedDemandUpper: 4160,
    predictedDemandLower: 2240,
    riskBadge: 'AMBER',
    generatedAt: new Date().toISOString(),
};

export default function PsnForecastWidget({ cohortId }: PsnForecastWidgetProps) {
    const [forecast, setForecast] = useState<PsnForecast | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchForecast = async () => {
        try {
            const response = await fetch(`/api/admin/psn/cohorts/${cohortId}/forecast`);
            if (response.ok) {
                const data = await response.json();
                setForecast(data.data);
            } else {
                // Use mock data in development
                setForecast(mockForecast);
            }
        } catch {
            setForecast(mockForecast);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, [cohortId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch(`/api/admin/psn/cohorts/${cohortId}/generate`, { method: 'POST' });
            await fetchForecast();
        } catch {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className={`card ${styles.widget}`}>
                <div className={styles.loading}>
                    <Loader2 size={24} className={styles.spinner} />
                </div>
            </div>
        );
    }

    if (!forecast) {
        return null;
    }

    const total = forecast.countHigh + forecast.countMedium + forecast.countLow;
    const highPercent = total > 0 ? (forecast.countHigh / total) * 100 : 0;
    const mediumPercent = total > 0 ? (forecast.countMedium / total) * 100 : 0;
    const lowPercent = total > 0 ? (forecast.countLow / total) * 100 : 0;

    const riskColors = {
        GREEN: { bg: '#dcfce7', text: '#16a34a' },
        AMBER: { bg: '#fef3c7', text: '#d97706' },
        RED: { bg: '#fee2e2', text: '#dc2626' },
    };

    const riskLabels = {
        GREEN: 'Low Risk',
        AMBER: 'Moderate Risk',
        RED: 'High Risk',
    };

    return (
        <div className={`card ${styles.widget}`}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Shield size={18} />
                    <h3>PSN Forecast</h3>
                </div>
                <button
                    className={styles.refreshBtn}
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Regenerate forecast"
                >
                    <RefreshCw size={16} className={refreshing ? styles.spinner : ''} />
                </button>
            </div>

            {/* Risk Badge */}
            <div
                className={styles.riskBadge}
                style={{
                    background: riskColors[forecast.riskBadge].bg,
                    color: riskColors[forecast.riskBadge].text,
                }}
            >
                {forecast.riskBadge === 'RED' && <AlertTriangle size={16} />}
                {riskLabels[forecast.riskBadge]}
            </div>

            {/* Distribution */}
            <div className={styles.distribution}>
                <div className={styles.distLabel}>PSN Distribution</div>
                <div className={styles.distBar}>
                    <div
                        className={styles.distHigh}
                        style={{ width: `${highPercent}%` }}
                        title={`High: ${forecast.countHigh}`}
                    />
                    <div
                        className={styles.distMedium}
                        style={{ width: `${mediumPercent}%` }}
                        title={`Medium: ${forecast.countMedium}`}
                    />
                    <div
                        className={styles.distLow}
                        style={{ width: `${lowPercent}%` }}
                        title={`Low: ${forecast.countLow}`}
                    />
                </div>
                <div className={styles.distLegend}>
                    <span><span className={styles.dotHigh} /> High ({forecast.countHigh})</span>
                    <span><span className={styles.dotMedium} /> Medium ({forecast.countMedium})</span>
                    <span><span className={styles.dotLow} /> Low ({forecast.countLow})</span>
                </div>
            </div>

            {/* Demand Range */}
            <div className={styles.demandSection}>
                <div className={styles.demandLabel}>
                    <TrendingUp size={14} />
                    Predicted Demand (USD)
                </div>
                <div className={styles.demandValue}>
                    ${forecast.predictedDemandExpected.toLocaleString()}
                </div>
                <div className={styles.demandRange}>
                    Range: ${forecast.predictedDemandLower.toLocaleString()} - ${forecast.predictedDemandUpper.toLocaleString()}
                </div>
            </div>

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
                PSN is a forecast estimate only. Support is still request-based and behavior-gated.
            </div>
        </div>
    );
}
