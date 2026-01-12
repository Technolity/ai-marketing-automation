/**
 * GHL Custom Value Discovery
 * Fetches and validates custom values from GoHighLevel
 */

import { NEW_GHL_SCHEMA } from './newSchema.js';

/**
 * Fetches all custom values from a GHL location
 * @param {string} locationId - GHL location ID
 * @param {string} accessToken - GHL access token
 * @returns {Promise<object>} - Discovery result with values and metadata
 */
export async function discoverGHLCustomValues(locationId, accessToken) {
    console.log('[GHLDiscovery] Fetching custom values for location:', locationId);

    try {
        const url = `https://rest.gohighlevel.com/v1/locations/${locationId}/customValues`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const customValues = data.customValues || [];

        console.log(`[GHLDiscovery] Found ${customValues.length} custom values in GHL`);

        // Map to a cleaner structure
        const values = customValues.map(cv => ({
            name: cv.name,
            key: cv.fieldKey,
            value: cv.value || '',
            id: cv.id
        }));

        return {
            success: true,
            count: values.length,
            values,
            raw: data
        };
    } catch (error) {
        console.error('[GHLDiscovery] Error fetching custom values:', error);
        return {
            success: false,
            error: error.message,
            values: []
        };
    }
}

/**
 * Validates which GHL custom values are mapped in our schema
 * @param {array} ghlValues - Array of GHL custom values { name, key, value }
 * @param {object} ourSchema - Our schema object (default: NEW_GHL_SCHEMA)
 * @returns {object} - Validation result with mapped, unmapped, and missing values
 */
export function validateMappings(ghlValues, ourSchema = NEW_GHL_SCHEMA) {
    const schemaKeys = Object.keys(ourSchema);
    const ghlNames = ghlValues.map(v => v.name);

    // Values in GHL that ARE in our schema (we can push to these)
    const mapped = ghlValues.filter(v => schemaKeys.includes(v.name)).map(v => ({
        ghlName: v.name,
        key: v.key,
        section: ourSchema[v.name]?.section || 'unknown',
        type: ourSchema[v.name]?.type || 'unknown',
        currentValue: v.value?.substring(0, 50) + (v.value?.length > 50 ? '...' : '')
    }));

    // Values in GHL that are NOT in our schema (we can't push to these)
    const unmapped = ghlValues.filter(v => !schemaKeys.includes(v.name)).map(v => ({
        ghlName: v.name,
        key: v.key,
        currentValue: v.value?.substring(0, 50) + (v.value?.length > 50 ? '...' : '')
    }));

    // Values in our schema that are NOT in GHL (need to create these in GHL)
    const missing = schemaKeys.filter(k => !ghlNames.includes(k)).map(k => ({
        schemaName: k,
        section: ourSchema[k]?.section,
        type: ourSchema[k]?.type
    }));

    console.log(`[GHLDiscovery] Mapping validation:`);
    console.log(`  ✓ Mapped (can push): ${mapped.length}`);
    console.log(`  ○ Unmapped (GHL only): ${unmapped.length}`);
    console.log(`  ✗ Missing (need to create): ${missing.length}`);

    return {
        mapped,
        unmapped,
        missing,
        stats: {
            totalInGHL: ghlValues.length,
            totalInSchema: schemaKeys.length,
            canPush: mapped.length,
            notMapped: unmapped.length,
            needsCreation: missing.length
        }
    };
}

/**
 * Groups mapped values by section for organized display
 * @param {array} mappedValues - Array of mapped values from validateMappings
 * @returns {object} - Values grouped by section
 */
export function groupBySection(mappedValues) {
    const grouped = {};

    for (const value of mappedValues) {
        const section = value.section || 'unknown';
        if (!grouped[section]) {
            grouped[section] = [];
        }
        grouped[section].push(value);
    }

    return grouped;
}

/**
 * Generates a mapping report for debugging
 * @param {object} validationResult - Result from validateMappings
 * @returns {string} - Human-readable report
 */
export function generateMappingReport(validationResult) {
    const { mapped, unmapped, missing, stats } = validationResult;

    let report = `\n========== GHL MAPPING REPORT ==========\n`;
    report += `\nSTATISTICS:\n`;
    report += `  Total in GHL: ${stats.totalInGHL}\n`;
    report += `  Total in Schema: ${stats.totalInSchema}\n`;
    report += `  Can Push: ${stats.canPush}\n`;
    report += `  Not Mapped: ${stats.notMapped}\n`;
    report += `  Needs Creation: ${stats.needsCreation}\n`;

    report += `\n--- MAPPED VALUES (${mapped.length}) ---\n`;
    const bySection = groupBySection(mapped);
    for (const [section, values] of Object.entries(bySection)) {
        report += `\n  [${section.toUpperCase()}]\n`;
        for (const v of values) {
            report += `    • ${v.ghlName}\n`;
        }
    }

    if (unmapped.length > 0) {
        report += `\n--- UNMAPPED GHL VALUES (${unmapped.length}) ---\n`;
        for (const v of unmapped) {
            report += `  ○ ${v.ghlName} (${v.key})\n`;
        }
    }

    if (missing.length > 0) {
        report += `\n--- MISSING FROM GHL (${missing.length}) ---\n`;
        for (const v of missing) {
            report += `  ✗ ${v.schemaName} [${v.section}/${v.type}]\n`;
        }
    }

    report += `\n==========================================\n`;

    return report;
}

export default {
    discoverGHLCustomValues,
    validateMappings,
    groupBySection,
    generateMappingReport
};
