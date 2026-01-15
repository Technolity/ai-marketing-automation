'use client';

import { useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Password Strength Meter Component
 * Shows Weak / Strong / Very Strong based on password complexity
 */
export default function PasswordStrength({ password }) {
    const strength = useMemo(() => {
        if (!password) return { level: 0, label: '', color: '' };

        let score = 0;

        // Length checks
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character type checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // Determine level
        if (score <= 2) {
            return { level: 1, label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500', Icon: ShieldAlert };
        } else if (score <= 4) {
            return { level: 2, label: 'Strong', color: 'text-yellow-500', bgColor: 'bg-yellow-500', Icon: Shield };
        } else {
            return { level: 3, label: 'Very Strong', color: 'text-green-500', bgColor: 'bg-green-500', Icon: ShieldCheck };
        }
    }, [password]);

    if (!password) return null;

    const { level, label, color, bgColor, Icon } = strength;

    return (
        <div className="mt-2 space-y-2">
            {/* Strength bars */}
            <div className="flex gap-1">
                <div className={`h-1.5 flex-1 rounded-full ${level >= 1 ? bgColor : 'bg-gray-700'} transition-all`} />
                <div className={`h-1.5 flex-1 rounded-full ${level >= 2 ? bgColor : 'bg-gray-700'} transition-all`} />
                <div className={`h-1.5 flex-1 rounded-full ${level >= 3 ? bgColor : 'bg-gray-700'} transition-all`} />
            </div>
            {/* Label */}
            <div className={`flex items-center gap-1.5 text-sm ${color}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
        </div>
    );
}
