# Editable Fields Architecture

## Overview

**The Problem:** Users were seeing JSON structures in the UI and couldn't edit content easily. AI was regenerating entire sections instead of targeted refinements.

**The Solution:** Frontend displays clean, editable text fields. Users can click any field to edit inline, changes auto-save to Supabase, and AI can refine specific fields only.

---

## Architecture Principles

### 1. Clean Separation of Concerns

```
┌─────────────────────────────────────────┐
│  FRONTEND (User-Facing)                 │
│  - EditableField components             │
│  - Clean text display (no JSON)         │
│  - Inline editing with auto-save        │
│  - Per-field AI refinement              │
└────────────┬────────────────────────────┘
             │
             │ /api/os/vault-field-update
             │
┌────────────▼────────────────────────────┐
│  BACKEND (Data Layer)                   │
│  - JSON marshalling                     │
│  - Zod schema validation                │
│  - Supabase storage                     │
│  - API integrations (GHL, OpenAI, etc.) │
└─────────────────────────────────────────┘
```

### 2. Key Benefits

- **For Users:** Edit like Google Docs, no technical knowledge required
- **For AI:** Clear field-level context for targeted refinements
- **For Developers:** Schema validation enforced, clean data flow
- **For Database:** Structured JSON storage maintained

---

## Component: EditableField

### Basic Usage

```jsx
import EditableField from "@/components/EditableField";

<EditableField
  label="Step 1: Opener + Permission"
  value={content.setterCallScript.quickOutline.callFlow.step1_openerPermission}
  fieldPath="setterCallScript.quickOutline.callFlow.step1_openerPermission"
  sectionId="setterScript"
  sessionId={sessionId}
  onSave={(fieldPath, newValue) => console.log('Saved:', fieldPath, newValue)}
  multiline={true}
  maxLength={500}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | string | Yes | Display label for the field |
| `value` | string/array/object | Yes | Current field value |
| `fieldPath` | string | Yes | Dot notation path (e.g., "setterCallScript.quickOutline.callGoal") |
| `sectionId` | string | Yes | Vault section ID for schema validation |
| `sessionId` | string | Yes | Session ID for saving to Supabase |
| `onSave` | function | No | Callback when field is saved: `(fieldPath, newValue) => void` |
| `multiline` | boolean | No | Use textarea for long text (default: false) |
| `maxLength` | number | No | Maximum character count with validation |

### Features

1. **Click to Edit**: Hover shows edit button, click anywhere to activate
2. **Auto-Save**: Saves to Supabase on blur or Enter key
3. **Keyboard Shortcuts**:
   - `Enter`: Save (single-line fields)
   - `Ctrl+Enter`: Save (multiline fields)
   - `Escape`: Cancel editing
4. **AI Refinement**: Sparkles button opens AI refinement modal (coming soon)
5. **Character Count**: Shows live count with red highlighting when over limit
6. **Validation**: Respects Zod schema validation on save

---

## API Endpoint: /api/os/vault-field-update

### Request

```javascript
POST /api/os/vault-field-update

{
  "sessionId": "uuid",
  "sectionId": "setterScript",
  "fieldPath": "setterCallScript.quickOutline.callGoal",
  "newValue": "Build trust, clarify opt-in, uncover goals..."
}
```

### Response

```javascript
{
  "success": true,
  "message": "Field updated successfully",
  "updatedSection": { /* entire section with updated field */ },
  "validationWarning": null  // or error message if schema validation failed
}
```

### Field Path Examples

```javascript
// Simple nested path
"setterCallScript.quickOutline.callGoal"

// Array item
"idealClientSnapshot.topChallenges.0"  // First challenge

// Deep nesting
"closerCallScript.quickOutline.callFlow.part1_openingPermission"
```

---

## Example Implementation: SetterScriptEditor

See [`components/SetterScriptEditor.jsx`](./components/SetterScriptEditor.jsx) for a complete example showing:

- Organized section headers with expand/collapse
- All 10 steps as editable fields
- Call Goal and Setter Mindset fields
- Clean, user-friendly layout
- No JSON visible anywhere

**Use this as a template for ALL vault sections.**

---

## Migration Guide

### Before (Old Approach)

```jsx
// User sees JSON:
<pre className="text-gray-300">
  {JSON.stringify(content.setterCallScript, null, 2)}
</pre>

// AI regenerates entire section
const handleRegenerate = async () => {
  const newContent = await fetch('/api/os/refine-section', {
    body: JSON.stringify({ sectionId: 'setterScript', feedback: 'Make it better' })
  });
};
```

### After (New Approach)

```jsx
// User sees clean editable fields:
<EditableField
  label="Step 1: Opener + Permission"
  value={content.setterCallScript.quickOutline.callFlow.step1_openerPermission}
  fieldPath="setterCallScript.quickOutline.callFlow.step1_openerPermission"
  sectionId="setterScript"
  sessionId={sessionId}
  onSave={handleFieldUpdate}
  multiline={true}
/>

// AI refines ONLY this field:
const handleFieldUpdate = (fieldPath, newValue) => {
  // Automatically saved by EditableField component
  // AI Feedback modal can target this specific field
};
```

---

## AI Feedback Integration (Coming Soon)

### Planned Flow

1. User clicks **AI Refine** button on specific field
2. Modal opens with:
   - Current field content
   - Chat interface (realtime streaming)
   - "Apply to field" button
3. AI sees:
   - Only this field's content
   - Section context (for consistency)
   - User's refinement requests
4. AI generates:
   - Only this field's updated value
   - Respects exact schema for this field
5. User reviews and applies:
   - Preview changes
   - Accept or reject
   - Changes save to just this field

### Example AI Prompt

```
FIELD: Step 1: Opener + Permission
CURRENT VALUE: "Hi there, thanks for taking time..."
SECTION CONTEXT: Setter Script (appointment setting)
USER REQUEST: "Make it more friendly and less salesy"

TASK: Refine ONLY this field based on user's request.
OUTPUT: Just the updated text, no JSON wrapper.
```

---

## Schema Validation

### How It Works

1. User edits field value in UI
2. EditableField sends to `/api/os/vault-field-update`
3. Backend updates field in section JSON
4. Zod schema validates entire section
5. If validation fails:
   - Save still succeeds (user's work preserved)
   - Warning returned to UI
   - Logs error for debugging

### Example Validation

```javascript
// Schema says: callGoal must be 50-500 chars
setterScriptSchema = z.object({
  setterCallScript: z.object({
    quickOutline: z.object({
      callGoal: z.string().min(50).max(500)
    })
  })
});

// User enters 20 chars → validation warning
// User enters 600 chars → validation warning
// User enters 150 chars → validation passes ✓
```

---

## Integration Checklist

To add editable fields to a new vault section:

- [ ] Create section editor component (follow `SetterScriptEditor.jsx`)
- [ ] Add `EditableField` for each schema field
- [ ] Use correct `fieldPath` matching Zod schema structure
- [ ] Set appropriate `maxLength` from schema constraints
- [ ] Use `multiline={true}` for long-form content
- [ ] Test save functionality
- [ ] Test AI refinement (when available)
- [ ] Update vault page to use new editor component
- [ ] Remove old JSON display code

---

## Performance Considerations

### Auto-Save Debouncing

Currently saves immediately on blur/Enter. For very large sections, consider:

```jsx
const [saveTimer, setSaveTimer] = useState(null);

const debouncedSave = (value) => {
  clearTimeout(saveTimer);
  setSaveTimer(setTimeout(() => {
    handleSave(value);
  }, 1000));  // Save 1 second after user stops typing
};
```

### Optimistic Updates

EditableField currently waits for API response. For better UX:

```jsx
const handleSave = async (value) => {
  // Optimistic: Update UI immediately
  setLocalValue(value);

  try {
    await saveToSupabase(value);
  } catch (error) {
    // Rollback on error
    setLocalValue(originalValue);
    toast.error('Failed to save');
  }
};
```

---

## Troubleshooting

### Field Not Saving

1. Check `fieldPath` matches exact schema structure
2. Verify `sessionId` is correct
3. Check browser console for API errors
4. Verify user is authenticated (Clerk)

### Validation Warnings

1. Check Zod schema constraints (min/max length, array counts)
2. Verify field value matches expected type
3. Check for required fields missing in schema
4. Look at `[VaultFieldUpdate]` logs in server console

### AI Refinement Not Working

1. Ensure schema validation passes first
2. Check AI endpoint is receiving correct `fieldPath`
3. Verify AI prompt includes field context
4. Check for schema confusion (setterScript vs salesScripts)

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Inline editing with auto-save
- ✅ Schema validation
- ✅ Character count limits
- ✅ Clean text display (no JSON)

### Phase 2 (Next Sprint)
- [ ] AI refinement per field
- [ ] Real-time collaboration
- [ ] Revision history
- [ ] Undo/redo functionality
- [ ] Field-level comments

### Phase 3 (Future)
- [ ] Voice-to-text for long fields
- [ ] Template library per field
- [ ] A/B testing variants
- [ ] Export to Google Docs/Word

---

## Summary

The new editable fields architecture provides:

1. **Better UX**: Edit like a document, not a database
2. **Cleaner Code**: Separation of UI and data concerns
3. **Safer Edits**: Schema validation preserved
4. **Targeted AI**: Refine specific fields, not entire sections
5. **Auto-Save**: Never lose work

**Next Steps:**
1. Test the SetterScriptEditor example
2. Apply pattern to other vault sections
3. Integrate AI refinement modal
4. Deploy and gather user feedback

---

**Questions?** See [`components/EditableField.jsx`](./components/EditableField.jsx) and [`components/SetterScriptEditor.jsx`](./components/SetterScriptEditor.jsx) for working examples.
