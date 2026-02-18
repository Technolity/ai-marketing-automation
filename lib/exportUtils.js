import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { saveAs } from 'file-saver';

const HTML_TAG_REGEX = /<[^>]+>/g;

const safeParseJSON = (value) => {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const stripHtml = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(HTML_TAG_REGEX, '').replace(/\s+\n/g, '\n').trim();
};

/**
 * Format a field value for display - handles all types
 */
const formatFieldValue = (value, indent = 0) => {
    if (value === null || value === undefined) return '';

    const indentStr = '  '.repeat(indent);
    const parsedValue = safeParseJSON(value);

    // String value
    if (typeof parsedValue === 'string') {
        return stripHtml(parsedValue);
    }

    // Array of items (like discovery questions or objections)
    if (Array.isArray(parsedValue)) {
        return parsedValue.map((item, i) => {
            if (typeof item === 'object' && item !== null) {
                // Format each object in the array nicely
                const lines = [];

                // Check if it has common question structure
                if (item.label && item.question) {
                    lines.push(`Question ${i + 1}: ${item.label}`);
                    lines.push(`  Ask: "${item.question}"`);
                    if (item.lookingFor) lines.push(`  Looking for: ${item.lookingFor}`);
                    if (item.ifVague) lines.push(`  If vague, say: "${item.ifVague}"`);
                }
                // Check if it's an objection
                else if (item.objection && item.response) {
                    lines.push(`Objection ${i + 1}: "${item.objection}"`);
                    lines.push(`  Response: ${item.response}`);
                    if (item.followUp) lines.push(`  Follow-up: "${item.followUp}"`);
                    if (item.ifStillHesitate) lines.push(`  If hesitant: "${item.ifStillHesitate}"`);
                }
                // Check if it's a step (offer blueprint)
                else if (item.stepName) {
                    lines.push(`Step ${i + 1}: ${item.stepName}`);
                    if (item.whatItIs) lines.push(`  What it is: ${item.whatItIs}`);
                    if (item.problemSolved) lines.push(`  Problem solved: ${item.problemSolved}`);
                    if (item.outcomeCreated) lines.push(`  Outcome: ${item.outcomeCreated}`);
                }
                // Generic object formatting
                else {
                    Object.entries(item).forEach(([key, val]) => {
                        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                        lines.push(`  ${formattedKey}: ${val}`);
                    });
                }

                return lines.join('\n');
            }
            return `${i + 1}. ${stripHtml(String(item))}`;
        }).join('\n\n');
    }

    // Object (like fullGuidedScript)
    if (typeof parsedValue === 'object') {
        const lines = [];
        Object.entries(parsedValue).forEach(([key, val]) => {
            // Format key nicely
            let formattedKey = key
                .replace(/part(\d+)_/g, 'Part $1: ')
                .replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .replace(/^./, s => s.toUpperCase())
                .trim();

            // Handle part numbering
            if (key.startsWith('part2_q')) {
                const qNum = key.match(/q(\d+)_/)?.[1];
                const type = key.includes('_question') ? 'Question' :
                    key.includes('_prospect') ? 'Prospect says' :
                        key.includes('_response') ? 'Your response' : '';
                formattedKey = `Q${qNum} - ${type}`;
            }

            if (typeof val === 'string' && val.trim()) {
                lines.push(`\n${formattedKey}:`);
                lines.push(stripHtml(val));
            }
        });
        return lines.join('\n');
    }

    return stripHtml(String(parsedValue));
};

const flattenValue = (value, path = '', rows = []) => {
    const parsed = safeParseJSON(value);

    if (parsed === null || parsed === undefined) {
        rows.push({ path, value: '' });
        return rows;
    }

    if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
            rows.push({ path, value: '' });
            return rows;
        }
        parsed.forEach((item, index) => {
            const nextPath = path ? `${path}.${index + 1}` : `${index + 1}`;
            flattenValue(item, nextPath, rows);
        });
        return rows;
    }

    if (typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        if (keys.length === 0) {
            rows.push({ path, value: '' });
            return rows;
        }
        keys.forEach((key) => {
            if (key.startsWith('_')) return;
            const nextPath = path ? `${path}.${key}` : key;
            flattenValue(parsed[key], nextPath, rows);
        });
        return rows;
    }

    rows.push({ path, value: stripHtml(String(parsed)) });
    return rows;
};

export const exportSectionToPDF = (fields, title = 'Script') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 180, 216);
    doc.text(title, margin, yPos);
    yPos += 10;

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 12;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);

    fields.forEach((field) => {
        const label = field.field_label || field.field_id || 'Untitled';
        const value = formatFieldValue(field.field_value);

        if (!value || !value.trim()) return;

        if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 130);
        const labelLines = doc.splitTextToSize(label, maxWidth);
        doc.text(labelLines, margin, yPos);
        yPos += labelLines.length * 6 + 4;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);

        const valueLines = doc.splitTextToSize(value, maxWidth);
        valueLines.forEach((line) => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, margin, yPos);
            yPos += 5;
        });

        yPos += 8;
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportSectionToCSV = (fields, title = 'script') => {
    const header = ['Section', 'Field', 'Subfield', 'Value'];
    const rows = [header];

    fields.forEach((field) => {
        const fieldLabel = field.field_label || field.field_id || 'Untitled';
        const flattened = flattenValue(field.field_value);

        if (flattened.length === 0) {
            rows.push([title, fieldLabel, '', '']);
            return;
        }

        flattened.forEach(({ path, value }) => {
            rows.push([title, fieldLabel, path || '', value || '']);
        });
    });

    const csv = rows
        .map((row) =>
            row
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(',')
        )
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
};

/**
 * Export Closer Script to PDF
 */
export const exportToPDF = (fields, title = 'Closer Script') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 180, 216); // Cyan
    doc.text(title, margin, yPos);
    yPos += 10;

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 12;

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Process each field
    fields.forEach((field) => {
        const label = field.field_label || field.field_id || 'Untitled';
        const value = formatFieldValue(field.field_value);

        if (!value || !value.trim()) return;

        // Check if we need a new page
        if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }

        // Field Label (bold, cyan)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 100, 130);
        const labelLines = doc.splitTextToSize(label, maxWidth);
        doc.text(labelLines, margin, yPos);
        yPos += labelLines.length * 6 + 4;

        // Field Value
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);

        // Split long text into lines
        const valueLines = doc.splitTextToSize(value, maxWidth);

        // Check if value needs new page
        valueLines.forEach((line, i) => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, margin, yPos);
            yPos += 5;
        });

        yPos += 8; // Space between fields
    });

    // Save
    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

/**
 * Export Closer Script to DOCX
 */
export const exportToDOCX = async (fields, title = 'Closer Script') => {
    const children = [];

    // Title
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: title,
                    bold: true,
                    size: 48,
                    color: '00B4D8',
                }),
            ],
            spacing: { after: 200 },
        })
    );

    // Date
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Generated: ${new Date().toLocaleDateString()}`,
                    color: '888888',
                    size: 20,
                }),
            ],
            spacing: { after: 400 },
        })
    );

    // Process each field
    fields.forEach((field) => {
        const label = field.field_label || field.field_id || 'Untitled';
        const value = formatFieldValue(field.field_value);

        if (!value || !value.trim()) return;

        // Field Label (heading)
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: label,
                        bold: true,
                        size: 26,
                        color: '006482',
                    }),
                ],
                spacing: { before: 400, after: 150 },
            })
        );

        // Field Value - split by newlines for proper formatting
        const lines = value.split('\n');
        lines.forEach((line) => {
            if (line.trim()) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line,
                                size: 22,
                            }),
                        ],
                        spacing: { after: 80 },
                    })
                );
            }
        });
    });

    // Create document
    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.docx`);
};
