'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Mail, UserPlus, Trash2, Clock, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamPage() {
    const { isAdmin } = useAuth();
    const [seats, setSeats] = useState([]);
    const [limits, setLimits] = useState({ max: 1, current: 0, tier: 'starter' });
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const fetchTeam = useCallback(async () => {
        try {
            const response = await fetch('/api/team/invite');
            const data = await response.json();

            if (response.ok) {
                setSeats(data.seats || []);
                setLimits(data.limits || { max: 1, current: 0, tier: 'starter' });
            }
        } catch (error) {
            console.error('Error fetching team:', error);
            toast.error('Failed to load team');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const handleInputChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleAddMember = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setAdding(true);
        try {
            const response = await fetch('/api/team/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add team member');
            }

            toast.success('Team member added successfully!');
            setShowAddModal(false);
            setFormData({ firstName: '', lastName: '', email: '', password: '' });
            fetchTeam();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setAdding(false);
        }
    };

    const handleRevoke = async (seatId) => {
        if (!confirm('Remove this team member? They will no longer be able to access your workspace.')) return;

        try {
            const response = await fetch(`/api/team/invite?id=${seatId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to remove team member');
            }

            toast.success('Team member removed');
            fetchTeam();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const canAddMembers = ['growth', 'scale'].includes(limits.tier) || isAdmin;
    const remainingSeats = limits.max - limits.current;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />;
            case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
            case 'revoked': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return null;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Active';
            case 'pending': return 'Pending';
            case 'revoked': return 'Revoked';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-cyan" />
                            Team Management
                        </h1>
                        <p className="text-gray-400 mt-2">
                            Add team members to collaborate on your marketing workspace
                        </p>
                    </div>
                    {canAddMembers && remainingSeats > 0 && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add Member
                        </button>
                    )}
                </div>

                {/* Subscription Info */}
                <div className="bg-dark-800 rounded-xl border border-white/10 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Your Plan</p>
                            <p className="text-white font-semibold capitalize">{limits.tier}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Team Seats</p>
                            <p className="text-white font-semibold">
                                {limits.current} / {limits.max} used
                            </p>
                        </div>
                    </div>
                    {!canAddMembers && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-sm">
                                Upgrade to Growth or Scale to add team members
                            </p>
                        </div>
                    )}
                </div>

                {/* Team Members List */}
                <div className="bg-dark-800 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="font-semibold text-white">Team Members</h2>
                    </div>

                    {seats.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No team members yet</p>
                            {canAddMembers && (
                                <p className="text-gray-500 text-sm mt-1">
                                    Add your first team member to get started
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {seats.filter(s => s.status !== 'revoked').map((seat) => (
                                <div key={seat.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan/20 to-blue-500/20 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-cyan" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{seat.seat_email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getStatusIcon(seat.status)}
                                                <span className="text-gray-400 text-sm">{getStatusLabel(seat.status)}</span>
                                                <span className="text-gray-600 text-sm">• {seat.role || 'member'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(seat.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Remove member"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-2xl border border-white/10 w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Add Team Member</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Create an account for your team member. They will be able to access your marketing workspace.
                        </p>
                        <form onSubmit={handleAddMember}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="John"
                                        className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Doe"
                                        className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="team.member@example.com"
                                    className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-400 text-sm mb-2">Initial Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Min 8 characters"
                                        className="w-full px-4 py-3 bg-dark border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan focus:outline-none pr-12"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-gray-500 text-xs mt-1">
                                    Share this password with your team member for their first login
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="flex-1 px-4 py-2.5 bg-cyan text-dark font-semibold rounded-lg hover:bg-cyan/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {adding ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Add Member
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
