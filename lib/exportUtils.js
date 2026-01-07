'use client';

import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Format a field value for display - handles all types
 */
const formatFieldValue = (value, indent = 0) => {
    if (value === null || value === undefined) return '';

    const indentStr = '  '.repeat(indent);

    // String value
    if (typeof value === 'string') {
        return value;
    }

    // Array of items (like discovery questions or objections)
    if (Array.isArray(value)) {
        return value.map((item, i) => {
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
            return `${i + 1}. ${item}`;
        }).join('\n\n');
    }

    // Object (like fullGuidedScript)
    if (typeof value === 'object') {
        const lines = [];
        Object.entries(value).forEach(([key, val]) => {
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
                lines.push(val);
            }
        });
        return lines.join('\n');
    }

    return String(value);
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
