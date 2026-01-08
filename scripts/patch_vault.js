
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/vault/page.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The new robust logic
const newLogic = `            // Objects - render sections
            if (typeof value === 'object') {
                let keys = Object.keys(value).filter((k) =>
                    k !== '_contentName' && k !== 'id' && k !== 'idealClientProfile'
                );

                // Smart sort helper function
                const smartSort = (a, b) => {
                    // Extract numbers from start of meaningful strings
                    // Supports: "4. Title", "Phase 1", "Part 2", "Step 3", "Tier 1"
                    const getNum = (str) => {
                         // Check for "Part 1", "Step 2" types
                        const match = str.match(/(?:^|part|step|phase|tier)\\s?_?(\\d+)/i);
                        if (match && match[1]) {
                           return parseInt(match[1], 10);
                        }
                        // Check for "4. Title" format (number at start followed by dot/space)
                        const startMatch = str.match(/^(\\d+)[._\\s]/);
                        if (startMatch && startMatch[1]) {
                            return parseInt(startMatch[1], 10);
                        }
                        return null;
                    };

                    const numA = getNum(a);
                    const numB = getNum(b);

                    // Strictly sort by number if both have numbers
                    if (numA !== null && numB !== null) {
                        return numA - numB;
                    }
                    
                    // Put numbered items BEFORE non-numbered items
                    if (numA !== null && numB === null) return -1;
                    if (numA === null && numB !== null) return 1;
                    
                    // Fallback to alphabetical
                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                };

                // SORTING LOGIC:
                // 1. If depth > 0 (nested content), ALWAYS use smartSort for numbered keys
                // 2. If depth === 0 (top level), check SECTION_SORT_ORDER first
                if (depth > 0) {
                    keys = keys.sort(smartSort);
                } else if (sectionId && SECTION_SORT_ORDER[sectionId]) {
                    const order = SECTION_SORT_ORDER[sectionId];
                    const hasOrderedKeys = keys.some(k => order.includes(k));
                    
                    if (hasOrderedKeys) {
                        keys = keys.sort((a, b) => {
                            const indexA = order.indexOf(a);
                            const indexB = order.indexOf(b);
                            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                            if (indexA !== -1) return -1;
                            if (indexB !== -1) return 1;
                            return smartSort(a, b);
                        });
                    } else {
                        keys = keys.sort(smartSort);
                    }
                } else {
                    keys = keys.sort(smartSort);
                }

                const entries = keys.map(k => [k, value[k]]);`;

// Find the start of the block to replace
// Look for "if (typeof value === 'object') {" followed by "let keys ="
const startMarker = "if (typeof value === 'object') {";
const contextMarker = "let keys = Object.keys(value).filter((k) =>";

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
    console.error("Could not find start marker");
    process.exit(1);
}

// Find the end of this block. It ends before "return (" which renders the entries
const endMarker = "const entries = keys.map(k => [k, value[k]]);";
const endIndex = content.indexOf(endMarker, startIndex);

if (endIndex === -1) {
    console.error("Could not find end marker");
    process.exit(1);
}

// Check if we are checking the right block
const checkSnippet = content.substring(startIndex, startIndex + 200);
if (!checkSnippet.includes(contextMarker)) {
    console.error("Context mismatch");
    process.exit(1);
}

// Perform replacement
const newContent = content.substring(0, startIndex) + newLogic + content.substring(endIndex + endMarker.length);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully patched sorting logic");
