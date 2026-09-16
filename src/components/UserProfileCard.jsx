import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';

export default function UserProfileCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.getMe()
      .then(response => {
        setProfile(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading Alcharmy profile...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive bg-destructive/10 rounded-md">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="p-4 text-muted-foreground">Profile not found.</div>;
  }

  return (
    <div className="p-6 bg-card rounded-lg shadow-md border border-border max-w-md mx-auto my-6">
      <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
      <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full font-semibold">
          {profile.organisation}
        </span>
        <span className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-full uppercase font-bold tracking-wider">
          {profile.position}
        </span>
      </div>
    </div>
  );
}
