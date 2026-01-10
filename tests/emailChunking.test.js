/**
 * Email Chunking Test Suite
 * Tests for email chunk merging logic and schema compliance
 */

import { describe, it, expect } from 'vitest';
import { mergeEmailChunks, validateMergedEmails } from '@/lib/prompts/emailMerger';
import { emailsSchema } from '@/lib/schemas/vaultSchemas';
import {
  validChunk1,
  validChunk2,
  validChunk3,
  validChunk4,
  incompleteChunk1,
  missingEmailsChunk2,
  invalidSubjectLength,
  tooShortBody
} from './fixtures/emailChunkFixtures';

describe('Email Chunk Merging', () => {
  describe('mergeEmailChunks', () => {
    it('should merge 4 valid chunks into 19 emails', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);

      expect(merged).toHaveProperty('emailSequence');

      const emailKeys = Object.keys(merged.emailSequence);
      expect(emailKeys.length).toBe(19);

      // Verify all expected email keys exist
      const expectedKeys = [
        'email1', 'email2', 'email3', 'email4',
        'email5', 'email6', 'email7', 'email8a', 'email8b', 'email8c',
        'email9', 'email10', 'email11', 'email12',
        'email13', 'email14', 'email15a', 'email15b', 'email15c'
      ];

      expectedKeys.forEach(key => {
        expect(emailKeys).toContain(key);
        expect(merged.emailSequence[key]).toHaveProperty('subject');
        expect(merged.emailSequence[key]).toHaveProperty('preview');
        expect(merged.emailSequence[key]).toHaveProperty('body');
      });
    });

    it('should preserve email content from each chunk', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);

      // Check email1 from chunk1
      expect(merged.emailSequence.email1.subject).toBe(validChunk1.email1.subject);
      expect(merged.emailSequence.email1.preview).toBe(validChunk1.email1.preview);
      expect(merged.emailSequence.email1.body).toBe(validChunk1.email1.body);

      // Check email8a from chunk2
      expect(merged.emailSequence.email8a.subject).toBe(validChunk2.email8a.subject);
      expect(merged.emailSequence.email8a.preview).toBe(validChunk2.email8a.preview);

      // Check email12 from chunk3
      expect(merged.emailSequence.email12.subject).toBe(validChunk3.email12.subject);

      // Check email15c from chunk4
      expect(merged.emailSequence.email15c.subject).toBe(validChunk4.email15c.subject);
    });

    it('should handle null chunks gracefully', () => {
      const merged = mergeEmailChunks(validChunk1, null, validChunk3, validChunk4);

      expect(merged).toHaveProperty('emailSequence');

      // Should have emails from chunks 1, 3, 4 but not 2
      expect(merged.emailSequence).toHaveProperty('email1');
      expect(merged.emailSequence).toHaveProperty('email2');
      expect(merged.emailSequence).toHaveProperty('email3');
      expect(merged.emailSequence).toHaveProperty('email4');

      // Should NOT have chunk 2 emails
      expect(merged.emailSequence).not.toHaveProperty('email5');
      expect(merged.emailSequence).not.toHaveProperty('email6');
      expect(merged.emailSequence).not.toHaveProperty('email7');

      // Should have chunks 3 and 4
      expect(merged.emailSequence).toHaveProperty('email9');
      expect(merged.emailSequence).toHaveProperty('email15c');
    });

    it('should handle empty chunks gracefully', () => {
      const merged = mergeEmailChunks({}, validChunk2, validChunk3, validChunk4);

      expect(merged).toHaveProperty('emailSequence');

      // Should have chunk 2, 3, 4 emails
      expect(merged.emailSequence).toHaveProperty('email5');
      expect(merged.emailSequence).toHaveProperty('email9');
      expect(merged.emailSequence).toHaveProperty('email13');

      // Should NOT have chunk 1 emails
      expect(merged.emailSequence).not.toHaveProperty('email1');
    });

    it('should merge all chunks even if some are partial', () => {
      const partialChunk = {
        email1: validChunk1.email1,
        email2: validChunk1.email2
        // Missing email3 and email4
      };

      const merged = mergeEmailChunks(partialChunk, validChunk2, validChunk3, validChunk4);

      // Should have the partial emails from chunk 1
      expect(merged.emailSequence).toHaveProperty('email1');
      expect(merged.emailSequence).toHaveProperty('email2');

      // Should still have all of chunks 2, 3, 4
      expect(merged.emailSequence).toHaveProperty('email5');
      expect(merged.emailSequence).toHaveProperty('email9');
      expect(merged.emailSequence).toHaveProperty('email13');

      // Total count should be less than 19
      const emailKeys = Object.keys(merged.emailSequence).filter(k => k.startsWith('email'));
      expect(emailKeys.length).toBeLessThan(19);
    });
  });

  describe('validateMergedEmails', () => {
    it('should validate complete merged email sequence', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);
      const validation = validateMergedEmails(merged);

      expect(validation.valid).toBe(true);
      expect(validation.emailCount).toBe(19);
      expect(validation.missing).toBeUndefined();
      expect(validation.incomplete).toBeUndefined();
    });

    it('should detect missing emails', () => {
      const merged = mergeEmailChunks(validChunk1, missingEmailsChunk2, validChunk3, validChunk4);
      const validation = validateMergedEmails(merged);

      expect(validation.valid).toBe(false);
      expect(validation.missing).toBeDefined();
      expect(validation.missing.length).toBeGreaterThan(0);
      expect(validation.missing).toContain('email6');
      expect(validation.missing).toContain('email7');
      expect(validation.missing).toContain('email8a');
    });

    it('should detect incomplete emails (missing required fields)', () => {
      const merged = mergeEmailChunks(incompleteChunk1, validChunk2, validChunk3, validChunk4);
      const validation = validateMergedEmails(merged);

      expect(validation.valid).toBe(false);
      expect(validation.incomplete).toBeDefined();
      expect(validation.incomplete.length).toBeGreaterThan(0);
    });

    it('should fail if emailSequence wrapper is missing', () => {
      const invalidMerged = {
        email1: validChunk1.email1,
        email2: validChunk1.email2
        // Missing emailSequence wrapper
      };

      const validation = validateMergedEmails(invalidMerged);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Missing emailSequence wrapper');
    });

    it('should return correct counts for missing and incomplete emails', () => {
      const partialChunk1 = {
        email1: incompleteChunk1.email1, // Incomplete (missing preview and body)
        email2: validChunk1.email2,
        email3: validChunk1.email3
        // Missing email4
      };

      const merged = mergeEmailChunks(partialChunk1, validChunk2, validChunk3, validChunk4);
      const validation = validateMergedEmails(merged);

      expect(validation.valid).toBe(false);

      // Should detect email1 as incomplete
      if (validation.incomplete) {
        expect(validation.incomplete).toContain('email1');
      }

      // Should detect email4 as missing
      if (validation.missing) {
        expect(validation.missing).toContain('email4');
      }
    });
  });

  describe('Schema Compliance', () => {
    it('should pass Zod schema validation for complete merged output', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);

      // Test against actual Zod schema
      const result = emailsSchema.safeParse(merged);

      if (!result.success) {
        console.error('Schema validation errors:', result.error.errors);
      }

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail schema validation for incomplete output', () => {
      const incomplete = mergeEmailChunks(validChunk1, null, null, null);

      const result = emailsSchema.safeParse(incomplete);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate subject line length constraints', () => {
      const merged = mergeEmailChunks(invalidSubjectLength, validChunk2, validChunk3, validChunk4);
      const result = emailsSchema.safeParse(merged);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Check that error is about subject line length
      const subjectErrors = result.error.errors.filter(
        e => e.path.some(p => p === 'subject')
      );
      expect(subjectErrors.length).toBeGreaterThan(0);
    });

    it('should validate body length constraints (minimum 250 chars)', () => {
      const merged = mergeEmailChunks(tooShortBody, validChunk2, validChunk3, validChunk4);
      const result = emailsSchema.safeParse(merged);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Check that error is about body length
      const bodyErrors = result.error.errors.filter(
        e => e.path.some(p => p === 'body')
      );
      expect(bodyErrors.length).toBeGreaterThan(0);
    });

    it('should validate all required fields are present in each email', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);
      const result = emailsSchema.safeParse(merged);

      expect(result.success).toBe(true);

      // Verify all 19 emails have all required fields
      const expectedKeys = [
        'email1', 'email2', 'email3', 'email4',
        'email5', 'email6', 'email7', 'email8a', 'email8b', 'email8c',
        'email9', 'email10', 'email11', 'email12',
        'email13', 'email14', 'email15a', 'email15b', 'email15c'
      ];

      expectedKeys.forEach(key => {
        const email = merged.emailSequence[key];
        expect(email).toHaveProperty('subject');
        expect(email).toHaveProperty('preview');
        expect(email).toHaveProperty('body');
        expect(typeof email.subject).toBe('string');
        expect(typeof email.preview).toBe('string');
        expect(typeof email.body).toBe('string');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle actual API response structure with nested wrapper', () => {
      // Simulate actual AI response with extra wrapper
      const chunk1Response = { emailSequence: validChunk1 }; // AI might add wrapper
      const chunk2Response = validChunk2; // Or might not

      // Extract actual chunks (simulate what happens in route.js)
      const chunk1 = chunk1Response.emailSequence || chunk1Response;
      const chunk2 = chunk2Response.emailSequence || chunk2Response;

      const merged = mergeEmailChunks(chunk1, chunk2, validChunk3, validChunk4);
      const validation = validateMergedEmails(merged);

      expect(validation.valid).toBe(true);
      expect(validation.emailCount).toBe(19);
    });

    it('should merge successfully and pass both validation and schema checks', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);

      // Step 1: Merge validation
      const validation = validateMergedEmails(merged);
      expect(validation.valid).toBe(true);

      // Step 2: Schema validation
      const schemaResult = emailsSchema.safeParse(merged);
      expect(schemaResult.success).toBe(true);

      // Step 3: Count check
      const emailKeys = Object.keys(merged.emailSequence).filter(k => k.startsWith('email'));
      expect(emailKeys.length).toBe(19);
    });

    it('should correctly map chunk indices to email keys', () => {
      const merged = mergeEmailChunks(validChunk1, validChunk2, validChunk3, validChunk4);

      // Chunk 1 should have emails 1-4
      expect(merged.emailSequence).toHaveProperty('email1');
      expect(merged.emailSequence).toHaveProperty('email2');
      expect(merged.emailSequence).toHaveProperty('email3');
      expect(merged.emailSequence).toHaveProperty('email4');

      // Chunk 2 should have emails 5-8c
      expect(merged.emailSequence).toHaveProperty('email5');
      expect(merged.emailSequence).toHaveProperty('email6');
      expect(merged.emailSequence).toHaveProperty('email7');
      expect(merged.emailSequence).toHaveProperty('email8a');
      expect(merged.emailSequence).toHaveProperty('email8b');
      expect(merged.emailSequence).toHaveProperty('email8c');

      // Chunk 3 should have emails 9-12
      expect(merged.emailSequence).toHaveProperty('email9');
      expect(merged.emailSequence).toHaveProperty('email10');
      expect(merged.emailSequence).toHaveProperty('email11');
      expect(merged.emailSequence).toHaveProperty('email12');

      // Chunk 4 should have emails 13-15c
      expect(merged.emailSequence).toHaveProperty('email13');
      expect(merged.emailSequence).toHaveProperty('email14');
      expect(merged.emailSequence).toHaveProperty('email15a');
      expect(merged.emailSequence).toHaveProperty('email15b');
      expect(merged.emailSequence).toHaveProperty('email15c');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all null chunks', () => {
      const merged = mergeEmailChunks(null, null, null, null);

      expect(merged).toHaveProperty('emailSequence');
      expect(Object.keys(merged.emailSequence).length).toBe(0);
    });

    it('should handle all empty chunks', () => {
      const merged = mergeEmailChunks({}, {}, {}, {});

      expect(merged).toHaveProperty('emailSequence');
      expect(Object.keys(merged.emailSequence).length).toBe(0);
    });

    it('should handle chunks with extra properties', () => {
      const chunkWithExtra = {
        ...validChunk1,
        extraProperty: 'should be ignored',
        anotherExtra: 123
      };

      const merged = mergeEmailChunks(chunkWithExtra, validChunk2, validChunk3, validChunk4);

      // Should still merge correctly
      expect(merged.emailSequence).toHaveProperty('email1');

      // Extra properties should be included (object spread includes all properties)
      expect(merged.emailSequence).toHaveProperty('extraProperty');
    });

    it('should handle missing preview field (optional in some contexts)', () => {
      const chunkWithoutPreview = {
        email1: {
          subject: "Valid subject",
          body: "Valid body text that meets the minimum length requirement of 250 characters. Adding more text to ensure we pass validation with enough content to meet the threshold required by the schema definition."
          // Missing preview
        }
      };

      const merged = mergeEmailChunks(chunkWithoutPreview, validChunk2, validChunk3, validChunk4);

      // Merger should still work
      expect(merged.emailSequence).toHaveProperty('email1');

      // But schema validation should fail
      const result = emailsSchema.safeParse(merged);
      expect(result.success).toBe(false);
    });
  });
});
