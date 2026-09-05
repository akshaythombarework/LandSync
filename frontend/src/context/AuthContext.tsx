import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ReviewPolicyConfig } from '../types';
import { mockUsers } from '../services/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (userOrRole?: UserRole | User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateCitizenProfile: (profile: Partial<User>) => void;
  reviewPolicy: ReviewPolicyConfig;
  updateReviewPolicy: (policy: Partial<ReviewPolicyConfig>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('novaax_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return mockUsers[0];
  });

  const [reviewPolicy, setReviewPolicy] = useState<ReviewPolicyConfig>(() => {
    const saved = localStorage.getItem('novaax_review_policy');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      mode: 'MANDATORY_HUMAN_REVIEW',
      confidenceThreshold: 97,
      criticalIssuesForceReview: true,
      updatedBy: 'System Administrator',
      updatedAt: '2026-09-04 10:00 AM'
    };
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('novaax_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('novaax_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('novaax_review_policy', JSON.stringify(reviewPolicy));
  }, [reviewPolicy]);

  // Attempt to hydrate user details from backend when a valid token is stored.
  // This syncs role/scope from the live database without breaking offline fallback.
  useEffect(() => {
    const token = localStorage.getItem('novaax_token');
    if (!token || !currentUser) return;

    const hydrateFromBackend = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const res = await fetch(`${apiBase}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const u = json.data || json;
        if (!u?.id) return;
        // Merge backend role/scope into current user, keeping frontend display fields
        setCurrentUser(prev => prev ? {
          ...prev,
          id: u.id || prev.id,
          name: u.name || prev.name,
          email: u.email || prev.email,
          role: (u.role ? u.role.toLowerCase() : prev.role) as UserRole,
          scope: u.scope || prev.scope,
        } : prev);
      } catch {
        // Backend unreachable — keep local user, no disruption
      }
    };

    hydrateFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on initial mount

  const login = (userOrRole: UserRole | User = 'verification_officer') => {
    if (typeof userOrRole === 'object') {
      setCurrentUser(userOrRole);
    } else {
      const found = mockUsers.find(u => u.role === userOrRole) || mockUsers[0];
      setCurrentUser(found);
    }
  };

  const logout = () => {
    // Clear all session state including the backend auth token
    localStorage.removeItem('novaax_token');
    localStorage.removeItem('novaax_user');
    setCurrentUser(null);
  };

  const switchRole = (role: UserRole) => {
    const found = mockUsers.find(u => u.role === role) || {
      id: `usr-${Date.now()}`,
      name: `Officer (${role})`,
      email: `${role}@gov.in`,
      role,
      designation: role.replace('_', ' ').toUpperCase(),
      scope: { country: 'India', state: 'Maharashtra', district: 'Pune' }
    };
    setCurrentUser(found);
  };

  const updateCitizenProfile = (profile: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      ...profile,
      onboardingCompleted: true
    };
    setCurrentUser(updated);
  };

  const updateReviewPolicy = (policy: Partial<ReviewPolicyConfig>) => {
    setReviewPolicy(prev => ({
      ...prev,
      ...policy,
      criticalIssuesForceReview: true, // Invariant: validation errors strictly force review
      updatedBy: currentUser?.name || 'Administrator',
      updatedAt: new Date().toLocaleString()
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchRole,
        updateCitizenProfile,
        reviewPolicy,
        updateReviewPolicy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
