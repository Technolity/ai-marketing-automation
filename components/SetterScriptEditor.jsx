"use client";
import { useState } from "react";
import EditableField from "./EditableField";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SetterScriptEditor - Example of using EditableField for structured content
 *
 * This demonstrates the new architecture:
 * - Frontend shows clean, editable text fields
 * - No JSON visible to user
 * - Each field auto-saves to Supabase
 * - AI refinement per-field
 *
 * Use this pattern for ALL vault sections going forward.
 */
export default function SetterScriptEditor({ sessionId, content, onUpdate }) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Handle field save - update parent state
    const handleFieldSave = (fieldPath, newValue) => {
        console.log('Field saved:', fieldPath, newValue);
        // Parent component will refetch or update local state
        onUpdate?.(fieldPath, newValue);
    };

    const quickOutline = content?.setterCallScript?.quickOutline || {};
    const callFlow = quickOutline.callFlow || {};

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan/10 to-blue-500/10 border border-cyan/30 rounded-lg cursor-pointer hover:border-cyan/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-cyan" />
                    <div>
                        <h3 className="text-lg font-bold text-white">Setter Script</h3>
                        <p className="text-sm text-gray-400">Appointment setting call flow (10 steps)</p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </div>

            {/* Editable Fields */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden"
                    >
                        {/* Call Goal */}
                        <div className="bg-[#0e0e0f] rounded-xl p-6 border border-[#2a2a2d]">
                            <h4 className="text-md font-semibold text-cyan mb-4">Call Goal</h4>
                            <EditableField
                                label="What is the goal of this setter call?"
                                value={quickOutline.callGoal}
                                fieldPath="setterCallScript.quickOutline.callGoal"
                                sectionId="setterScript"
                                sessionId={sessionId}
                                onSave={handleFieldSave}
                                multiline={true}
                                maxLength={500}
                            />
                        </div>

                        {/* Call Flow - 10 Steps */}
                        <div className="bg-[#0e0e0f] rounded-xl p-6 border border-[#2a2a2d]">
                            <h4 className="text-md font-semibold text-cyan mb-4">Call Flow (10 Steps)</h4>
                            <div className="space-y-4">
                                <EditableField
                                    label="Step 1: Opener + Permission"
                                    value={callFlow.step1_openerPermission}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step1_openerPermission"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 2: Reference Opt-In"
                                    value={callFlow.step2_referenceOptIn}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step2_referenceOptIn"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 3: Low-Pressure Frame"
                                    value={callFlow.step3_lowPressureFrame}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step3_lowPressureFrame"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 4: Current Situation"
                                    value={callFlow.step4_currentSituation}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step4_currentSituation"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 5: Goal + Motivation"
                                    value={callFlow.step5_goalMotivation}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step5_goalMotivation"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 6: Challenge + Stakes"
                                    value={callFlow.step6_challengeStakes}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step6_challengeStakes"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 7: Authority Drop"
                                    value={callFlow.step7_authorityDrop}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step7_authorityDrop"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 8: Qualify Fit + Readiness"
                                    value={callFlow.step8_qualifyFit}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step8_qualifyFit"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 9: Book Consultation"
                                    value={callFlow.step9_bookConsultation}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step9_bookConsultation"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />

                                <EditableField
                                    label="Step 10: Confirm Show-Up + Wrap-Up"
                                    value={callFlow.step10_confirmShowUp}
                                    fieldPath="setterCallScript.quickOutline.callFlow.step10_confirmShowUp"
                                    sectionId="setterScript"
                                    sessionId={sessionId}
                                    onSave={handleFieldSave}
                                    multiline={true}
                                    maxLength={500}
                                />
                            </div>
                        </div>

                        {/* Setter Mindset */}
                        <div className="bg-[#0e0e0f] rounded-xl p-6 border border-[#2a2a2d]">
                            <h4 className="text-md font-semibold text-cyan mb-4">Setter Mindset</h4>
                            <EditableField
                                label="Mindset & Approach"
                                value={quickOutline.setterMindset}
                                fieldPath="setterCallScript.quickOutline.setterMindset"
                                sectionId="setterScript"
                                sessionId={sessionId}
                                onSave={handleFieldSave}
                                multiline={true}
                                maxLength={500}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
