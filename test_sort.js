
const testKeys = [
    "4. SEARCH AGAIN",
    "5. THE BREAKTHROUGH",
    "3. THE DROP",
    "6. THE OUTCOME",
    "1. THE PIT",
    "PART2_DISCOVERY",
    "part1_opening",
    "step10",
    "step2",
    "step1"
];

function smartSort(a, b) {
    // Extract numbers from start of meaningful strings "1. ", "4.", "Part 1", "Step 1"
    const getNum = (str) => {
        // Match explicit start number (e.g., "1. "), or part/step number
        // Added stricter anchor ^ for the direct number match
        const match = str.match(/^(\d+)[._\s]|part(\d+)|step(\d+)/i);
        if (match) {
            // Use the first capturing group that matched
            return parseInt(match[1] || match[2] || match[3], 10);
        }
        return null;
    };

    const numA = getNum(a);
    const numB = getNum(b);

    console.log(`Comparing "${a}" (${numA}) vs "${b}" (${numB})`);

    // strictly sort by number if both have numbers
    if (numA !== null && numB !== null) {
        return numA - numB;
    }

    // If only one has a number, put it first (optional, depends on preference)
    // or keep alphabetical. Let's stick to localeCompare if mixed.
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

const sorted = testKeys.sort(smartSort);
console.log("Result:", sorted);
