import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { UserProfile, AnalysisResult } from '@/types';

const PROFILE_KEY = 'yatirimpro_profile';
const HISTORY_KEY = 'yatirimpro_history';
const AUTH_KEY = 'yatirimpro_auth';
const USERS_KEY = 'yatirimpro_users';

export const [UserProvider, useUser] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const authQuery = useQuery({
    queryKey: ['auth-state'],
    queryFn: async () => {
      const authData = await AsyncStorage.getItem(AUTH_KEY);
      return authData ? JSON.parse(authData) as { email: string; loggedIn: boolean } : null;
    },
  });

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      return stored ? (JSON.parse(stored) as UserProfile) : null;
    },
    enabled: isAuthenticated,
  });

  const historyQuery = useQuery({
    queryKey: ['analysis-history'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      return stored ? (JSON.parse(stored) as AnalysisResult[]) : [];
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      const loggedIn = authQuery.data?.loggedIn ?? false;
      setIsAuthenticated(loggedIn);
      setAuthLoading(false);
    } else if (authQuery.isError) {
      setAuthLoading(false);
    }
  }, [authQuery.data, authQuery.isError]);

  useEffect(() => {
    if (profileQuery.data !== undefined) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (historyQuery.data !== undefined) {
      setAnalysisHistory(historyQuery.data);
    }
  }, [historyQuery.data]);

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users: Array<{ email: string; password: string; name: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      
      const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        throw new Error('Bu e-posta adresi zaten kayıtlı.');
      }

      users.push({ email: data.email, password: data.password, name: data.name });
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      const newProfile: UserProfile = {
        name: data.name,
        email: data.email,
        riskTolerance: 'medium',
        investmentGoal: '',
        monthlyIncome: 0,
        investmentBudget: 0,
        occupation: '',
        age: '',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ email: data.email, loggedIn: true }));

      return newProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
      setIsAuthenticated(true);
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users: Array<{ email: string; password: string; name: string }> = usersRaw ? JSON.parse(usersRaw) : [];
      
      const user = users.find(
        u => u.email.toLowerCase() === data.email.toLowerCase() && u.password === data.password
      );

      if (!user) {
        throw new Error('E-posta veya şifre hatalı.');
      }

      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ email: user.email, loggedIn: true }));

      const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      return storedProfile ? (JSON.parse(storedProfile) as UserProfile) : null;
    },
    onSuccess: (data) => {
      if (data) setProfile(data);
      setIsAuthenticated(true);
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const mockEmail = 'user@gmail.com';
      const mockName = 'Google Kullanıcısı';

      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ email: mockEmail, loggedIn: true }));

      let storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (!storedProfile) {
        const newProfile: UserProfile = {
          name: mockName,
          email: mockEmail,
          riskTolerance: 'medium',
          investmentGoal: '',
          monthlyIncome: 0,
          investmentBudget: 0,
          occupation: '',
          age: '',
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
        storedProfile = JSON.stringify(newProfile);
      }

      return JSON.parse(storedProfile) as UserProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
      setIsAuthenticated(true);
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_KEY);
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      setProfile(null);
      setAnalysisHistory([]);
      void queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      return newProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async (analysis: AnalysisResult) => {
      const updated = [analysis, ...analysisHistory].slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setAnalysisHistory(data);
      void queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
      return [];
    },
    onSuccess: () => {
      setAnalysisHistory([]);
      void queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
  });

  const register = useCallback((name: string, email: string, password: string) => {
    registerMutation.mutate({ name, email, password });
  }, [registerMutation]);

  const login = useCallback((email: string, password: string) => {
    loginMutation.mutate({ email, password });
  }, [loginMutation]);

  const googleLogin = useCallback(() => {
    googleLoginMutation.mutate();
  }, [googleLoginMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const saveProfile = useCallback((p: UserProfile) => {
    saveProfileMutation.mutate(p);
  }, [saveProfileMutation]);

  const saveAnalysis = useCallback((a: AnalysisResult) => {
    saveAnalysisMutation.mutate(a);
  }, [saveAnalysisMutation]);

  const clearHistory = useCallback(() => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  return useMemo(() => ({
    profile,
    analysisHistory,
    isAuthenticated,
    authLoading,
    register,
    login,
    googleLogin,
    logout,
    saveProfile,
    saveAnalysis,
    clearHistory,
    registerError: registerMutation.error?.message ?? null,
    loginError: loginMutation.error?.message ?? null,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending || googleLoginMutation.isPending,
    isLoading: profileQuery.isLoading || historyQuery.isLoading,
  }), [
    profile, analysisHistory, isAuthenticated, authLoading,
    register, login, googleLogin, logout, saveProfile, saveAnalysis, clearHistory,
    registerMutation.error, loginMutation.error,
    registerMutation.isPending, loginMutation.isPending, googleLoginMutation.isPending,
    profileQuery.isLoading, historyQuery.isLoading,
  ]);
});
