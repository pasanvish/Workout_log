
import React, { useState } from 'react';
import { Profile } from '../types';

interface ProfileManagerProps {
    profiles: Profile[];
    onAddProfile: (name: string) => void;
    onSelectProfile: (id: string) => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onAddProfile, onSelectProfile }) => {
    const [newProfileName, setNewProfileName] = useState('');

    const handleAddProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProfileName.trim()) {
            onAddProfile(newProfileName.trim());
            setNewProfileName('');
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto bg-background-light p-8 rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-text-primary tracking-wider">Welcome to Gym Logger</h1>
                    <p className="text-text-secondary mt-2">Select a profile or create a new one to get started.</p>
                </div>

                {profiles.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-text-primary mb-3 text-center">Select Profile</h2>
                        <div className="space-y-3">
                            {profiles.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => onSelectProfile(profile.id)}
                                    className="w-full text-left p-4 rounded-lg bg-card-dark hover:bg-gray-600 text-text-primary font-semibold transition-all duration-200 transform hover:scale-105"
                                >
                                    {profile.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-3 text-center">{profiles.length > 0 ? "Or Create a New One" : "Create Your First Profile"}</h2>
                    <form onSubmit={handleAddProfile} className="flex gap-3">
                        <input
                            type="text"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            placeholder="Enter profile name..."
                            className="flex-grow bg-background-dark border-2 border-border-color rounded-md p-3 text-sm focus:ring-brand-primary focus:border-brand-primary transition-colors duration-200"
                            aria-label="New profile name"
                        />
                        <button 
                            type="submit"
                            className="bg-gradient-to-r from-brand-primary to-cyan-500 hover:from-brand-secondary hover:to-cyan-600 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-brand-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!newProfileName.trim()}
                        >
                            Add
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfileManager;
