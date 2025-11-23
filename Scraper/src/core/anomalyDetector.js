/**
 * Anomaly Detection System
 * Monitors data quality, detects degradation, and triggers auto-healing
 * 
 * Features:
 * - Tracks null rates per platform over time
 * - Compares current vs historical quality
 * - Flags platforms with degraded extraction
 * - Auto-triggers config regeneration
 * - Generates alerts and reports
 */

const { connectToDatabase } = require('./database');

class AnomalyDetector {
    constructor() {
        this.thresholds = {
            criticalNullRate: 0.7,      // 70% null values = critical
            warningNullRate: 0.5,        // 50% null values = warning
            degradationPercent: 0.3,     // 30% quality drop = trigger regeneration
            minimumSampleSize: 5         // Need at least 5 listings to analyze
        };

        this.historicalData = new Map();
    }

    /**
     * Analyze data quality for all platforms
     */
    async analyzeAllPlatforms() {
        const db = await connectToDatabase();
        const listings = await db.collection('listings')
            .find({})
            .project({
                _id: 1,
                platform: 1,
                title: 1,
                'price.amount': 1,
                'location.city': 1,
                'location.street': 1,
                'specifications.bedrooms': 1,
                'specifications.bathrooms': 1,
                'specifications.area': 1,
                images: 1,
                features: 1,
                description: 1,
                scrapedAt: 1
            })
            .toArray();

        // Group by platform
        const byPlatform = {};
        listings.forEach(listing => {
            const platform = listing.platform || 'unknown';
            if (!byPlatform[platform]) {
                byPlatform[platform] = [];
            }
            byPlatform[platform].push(listing);
        });

        // Analyze each platform
        const analysis = [];
        for (const [platform, platformListings] of Object.entries(byPlatform)) {
            if (platformListings.length >= this.thresholds.minimumSampleSize) {
                const quality = this.analyzePlatformQuality(platform, platformListings);
                analysis.push(quality);
            }
        }

        return analysis;
    }

    /**
     * Analyze quality for a single platform
     */
    analyzePlatformQuality(platform, listings) {
        const total = listings.length;
        const nullCounts = {
            title: 0,
            price: 0,
            location: 0,
            bedrooms: 0,
            bathrooms: 0,
            area: 0,
            images: 0,
            description: 0
        };

        let completeRecords = 0;

        listings.forEach(listing => {
            // Count nulls
            if (!listing.title || listing.title === 'Unknown Property') nullCounts.title++;
            if (!listing.price?.amount) nullCounts.price++;
            if (!listing.location?.city && !listing.location?.street) nullCounts.location++;
            if (!listing.specifications?.bedrooms) nullCounts.bedrooms++;
            if (!listing.specifications?.bathrooms) nullCounts.bathrooms++;
            if (!listing.specifications?.area) nullCounts.area++;
            if (!listing.images || listing.images.length === 0) nullCounts.images++;
            if (!listing.description || listing.description.length < 50) nullCounts.description++;

            // Check if complete
            const isComplete =
                listing.title && listing.title !== 'Unknown Property' &&
                listing.price?.amount &&
                (listing.location?.city || listing.location?.street) &&
                listing.specifications?.bedrooms &&
                listing.specifications?.area &&
                listing.images && listing.images.length > 0;

            if (isComplete) completeRecords++;
        });

        // Calculate null rates
        const nullRates = {};
        Object.keys(nullCounts).forEach(field => {
            nullRates[field] = nullCounts[field] / total;
        });

        // Calculate overall quality score
        const qualityScore = (completeRecords / total) * 100;

        // Determine severity
        let severity = 'healthy';
        let issues = [];

        if (nullRates.price > this.thresholds.criticalNullRate) {
            severity = 'critical';
            issues.push(`${(nullRates.price * 100).toFixed(0)}% missing price`);
        }
        if (nullRates.bedrooms > this.thresholds.criticalNullRate) {
            severity = severity === 'critical' ? 'critical' : 'warning';
            issues.push(`${(nullRates.bedrooms * 100).toFixed(0)}% missing bedrooms`);
        }
        if (nullRates.area > this.thresholds.criticalNullRate) {
            severity = severity === 'critical' ? 'critical' : 'warning';
            issues.push(`${(nullRates.area * 100).toFixed(0)}% missing area`);
        }
        if (qualityScore < 30) {
            severity = 'critical';
            issues.push('Overall quality < 30%');
        } else if (qualityScore < 50) {
            if (severity !== 'critical') severity = 'warning';
            issues.push('Overall quality < 50%');
        }

        return {
            platform,
            total,
            completeRecords,
            qualityScore: Math.round(qualityScore * 10) / 10,
            nullRates,
            nullCounts,
            severity,
            issues,
            needsRegeneration: severity === 'critical' || qualityScore < 30,
            timestamp: new Date()
        };
    }

    /**
     * Compare current quality with historical baseline
     */
    detectDegradation(currentQuality, historicalQuality) {
        if (!historicalQuality) {
            // No historical data, can't detect degradation
            return { degraded: false, reason: 'No historical baseline' };
        }

        const currentScore = currentQuality.qualityScore;
        const historicalScore = historicalQuality.qualityScore;
        const degradation = historicalScore - currentScore;
        const degradationPercent = degradation / historicalScore;

        if (degradationPercent >= this.thresholds.degradationPercent) {
            return {
                degraded: true,
                reason: `Quality dropped ${Math.round(degradationPercent * 100)}% (${historicalScore}% → ${currentScore}%)`,
                previousScore: historicalScore,
                currentScore: currentScore,
                degradationPercent: Math.round(degradationPercent * 100)
            };
        }

        return { degraded: false };
    }

    /**
     * Load historical quality data
     */
    async loadHistoricalData() {
        const fs = require('fs');
        const path = require('path');
        const historyPath = path.join(__dirname, '..', '..', 'quality-history.json');

        try {
            if (fs.existsSync(historyPath)) {
                const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

                // Convert to Map
                data.forEach(record => {
                    this.historicalData.set(record.platform, record);
                });

                return this.historicalData.size;
            }
        } catch (error) {
            console.warn('Could not load historical data:', error.message);
        }

        return 0;
    }

    /**
     * Save current quality as historical baseline
     */
    async saveHistoricalData(analysis) {
        const fs = require('fs');
        const path = require('path');
        const historyPath = path.join(__dirname, '..', '..', 'quality-history.json');

        try {
            // Update historical data
            analysis.forEach(record => {
                this.historicalData.set(record.platform, {
                    platform: record.platform,
                    qualityScore: record.qualityScore,
                    timestamp: record.timestamp,
                    nullRates: record.nullRates
                });
            });

            // Save to file
            const data = Array.from(this.historicalData.values());
            fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));

            return true;
        } catch (error) {
            console.error('Failed to save historical data:', error.message);
            return false;
        }
    }

    /**
     * Generate alert for critical issues
     */
    generateAlert(quality, degradation) {
        const alert = {
            timestamp: new Date(),
            platform: quality.platform,
            severity: quality.severity,
            qualityScore: quality.qualityScore,
            issues: quality.issues,
            needsRegeneration: quality.needsRegeneration,
            action: null
        };

        if (degradation?.degraded) {
            alert.degradation = degradation;
            alert.action = 'trigger_regeneration';
        } else if (quality.severity === 'critical') {
            alert.action = 'trigger_regeneration';
        } else if (quality.severity === 'warning') {
            alert.action = 'monitor';
        }

        return alert;
    }

    /**
     * Generate comprehensive report
     */
    generateReport(analysis, alerts) {
        const critical = analysis.filter(a => a.severity === 'critical');
        const warning = analysis.filter(a => a.severity === 'warning');
        const healthy = analysis.filter(a => a.severity === 'healthy');
        const needsRegeneration = analysis.filter(a => a.needsRegeneration);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: analysis.length,
                critical: critical.length,
                warning: warning.length,
                healthy: healthy.length,
                needsRegeneration: needsRegeneration.length,
                averageQuality: Math.round(
                    analysis.reduce((sum, a) => sum + a.qualityScore, 0) / analysis.length * 10
                ) / 10
            },
            criticalPlatforms: critical.map(a => ({
                platform: a.platform,
                qualityScore: a.qualityScore,
                issues: a.issues,
                total: a.total
            })),
            warningPlatforms: warning.map(a => ({
                platform: a.platform,
                qualityScore: a.qualityScore,
                issues: a.issues,
                total: a.total
            })),
            regenerationQueue: needsRegeneration.map(a => a.platform),
            alerts: alerts,
            fullAnalysis: analysis
        };

        return report;
    }

    /**
     * Main monitoring function
     */
    async monitor() {
        console.log('🔍 Anomaly Detection - Monitoring Data Quality\n');
        console.log('='.repeat(100));

        try {
            // Load historical data
            const historicalCount = await this.loadHistoricalData();
            console.log(`📊 Loaded historical data for ${historicalCount} platforms\n`);

            // Analyze current quality
            console.log('🔎 Analyzing current data quality...\n');
            const analysis = await this.analyzeAllPlatforms();
            console.log(`✅ Analyzed ${analysis.length} platforms\n`);

            // Detect anomalies and degradation
            const alerts = [];
            analysis.forEach(quality => {
                const historical = this.historicalData.get(quality.platform);
                const degradation = this.detectDegradation(quality, historical);

                if (quality.severity !== 'healthy' || degradation.degraded) {
                    const alert = this.generateAlert(quality, degradation);
                    alerts.push(alert);
                }
            });

            // Generate report
            const report = this.generateReport(analysis, alerts);

            // Display results
            this.displayResults(report);

            // Save current data as new baseline
            await this.saveHistoricalData(analysis);
            console.log('💾 Saved current quality as historical baseline\n');

            // Save report
            const fs = require('fs');
            const path = require('path');
            const reportPath = path.join(__dirname, '..', '..', 'anomaly-detection-report.json');
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`✅ Report saved to: anomaly-detection-report.json\n`);

            return report;

        } catch (error) {
            console.error('❌ Error during monitoring:', error);
            throw error;
        }
    }

    /**
     * Display results in console
     */
    displayResults(report) {
        console.log('='.repeat(100));
        console.log('📊 ANOMALY DETECTION RESULTS');
        console.log('='.repeat(100));

        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Platforms:     ${report.summary.total}`);
        console.log(`   Average Quality:     ${report.summary.averageQuality}%`);
        console.log(`   🚨 Critical:          ${report.summary.critical}`);
        console.log(`   ⚠️  Warning:           ${report.summary.warning}`);
        console.log(`   ✅ Healthy:           ${report.summary.healthy}`);
        console.log(`   🔧 Need Regeneration: ${report.summary.needsRegeneration}`);

        if (report.criticalPlatforms.length > 0) {
            console.log(`\n🚨 CRITICAL PLATFORMS:`);
            report.criticalPlatforms.forEach(p => {
                console.log(`   ❌ ${p.platform.padEnd(25)} Quality: ${p.qualityScore}% | ${p.total} listings`);
                p.issues.forEach(issue => {
                    console.log(`      - ${issue}`);
                });
            });
        }

        if (report.warningPlatforms.length > 0) {
            console.log(`\n⚠️  WARNING PLATFORMS:`);
            report.warningPlatforms.forEach(p => {
                console.log(`   ⚠️  ${p.platform.padEnd(25)} Quality: ${p.qualityScore}% | ${p.total} listings`);
            });
        }

        if (report.alerts.length > 0) {
            console.log(`\n🔔 ALERTS:`);
            report.alerts.forEach((alert, i) => {
                console.log(`\n   Alert ${i + 1}: ${alert.platform}`);
                console.log(`   Severity: ${alert.severity}`);
                console.log(`   Quality:  ${alert.qualityScore}%`);
                if (alert.degradation) {
                    console.log(`   ⚠️  Degradation: ${alert.degradation.reason}`);
                }
                console.log(`   Action:   ${alert.action}`);
            });
        }

        if (report.regenerationQueue.length > 0) {
            console.log(`\n🔧 REGENERATION QUEUE (${report.regenerationQueue.length} platforms):`);
            report.regenerationQueue.forEach((platform, i) => {
                console.log(`   ${i + 1}. ${platform}`);
            });
            console.log(`\n💡 Run: node batch-regenerate-all-configs.js`);
        }

        console.log('\n' + '='.repeat(100) + '\n');
    }
}

// ==================== CLI INTERFACE ====================

async function main() {
    const detector = new AnomalyDetector();
    await detector.monitor();
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { AnomalyDetector };
