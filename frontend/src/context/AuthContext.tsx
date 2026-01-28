import React, { createContext, useState, useEffect, useContext } from 'react';
import { getData, storeData, removeData } from '../offline/offlineStorage';
import { addToQueue } from '../offline/syncQueue';
import { STORAGE_KEYS } from '../utils/constants';
import api from '../services/api';
import { ENDPOINTS } from '../services/endpoints';

interface AuthContextType {
    user: any;
    token: string | null;
    isLoading: boolean;
    isGuest: boolean;
    xp: number;
    streak: number;
    level: number;
    showLevelUp: boolean;
    closeLevelUp: () => void;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    loginAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    addXP: (amount: number, source?: string) => Promise<void>;
    updateUser: (data: { name?: string; email?: string; selectedClass?: number | null; avatar?: string | null; themeColor?: string; city?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [xp, setXP] = useState(0);
    const [streak, setStreak] = useState(0);
    const [level, setLevel] = useState(1);
    const [showLevelUp, setShowLevelUp] = useState(false);


    useEffect(() => {
        loadUser();
    }, []);



    const loadUser = async () => {
        try {
            const storedUser = await getData(STORAGE_KEYS.USER_DATA);
            const storedToken = await getData(STORAGE_KEYS.USER_TOKEN);
            const guestStatus = await getData('is_guest');
            const storedXP = await getData('user_xp');
            const storedStreak = await getData('user_streak');
            const lastLoginDate = await getData('last_login_date');
            const storedLevel = await getData('user_level');

            if (storedUser && storedToken) {
                setUser(storedUser);
                setToken(storedToken);
            } else if (guestStatus === 'true') {
                setIsGuest(true);
                setUser({ name: 'Guest' });
            }

            const currentXP = storedXP ? parseInt(storedXP) : 0;
            setXP(currentXP);
            setLevel(storedLevel ? parseInt(storedLevel) : Math.floor(currentXP / 100) + 1);

            // Streak Logic
            const today = new Date().toDateString();
            let currentStreak = storedStreak ? parseInt(storedStreak) : 0;

            if (lastLoginDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastLoginDate === yesterday.toDateString()) {
                    // Logged in consecutive days
                    currentStreak += 1;
                } else {
                    // Missed a day or first login
                    currentStreak = 1;
                }

                await storeData('user_streak', currentStreak.toString());
                await storeData('last_login_date', today);
            }

            setStreak(currentStreak);

            // If logged in user, sync with backend
            if (storedToken) {
                await syncWithBackend(storedToken);

                // Retry syncing class selection if needed
                const { classService } = require('../services/classService');
                await classService.retrySyncIfNeeded(storedToken);
            }
        } catch (e) {
            console.error('Failed to load user', e);
        } finally {
            setIsLoading(false);
        }
    };

    const syncWithBackend = async (authToken: string) => {
        try {
            // Fetch user profile to get latest XP and level from database
            const profileResponse = await api.get('/auth/profile', {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (profileResponse.data) {
                const { xp: serverXp, level: serverLevel, streak: serverStreak } = profileResponse.data;

                // Update local state with server values
                if (serverXp !== undefined) {
                    setXP(serverXp);
                    await storeData('user_xp', serverXp.toString());
                }

                if (serverLevel !== undefined) {
                    setLevel(serverLevel);
                    await storeData('user_level', serverLevel.toString());
                }

                if (serverStreak !== undefined) {
                    setStreak(serverStreak);
                    await storeData('user_streak', serverStreak.toString());
                }
            }

            // Daily streak check-in
            const streakResponse = await api.post('/streak/checkin', {}, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (streakResponse.data && !streakResponse.data.alreadyCheckedIn) {
                setStreak(streakResponse.data.streak);
                await storeData('user_streak', streakResponse.data.streak.toString());
            }
        } catch (error: any) {
            console.log('Backend sync failed (offline mode):', error);
            if (error.status === 401 || error.response?.status === 401) {
                console.log('Token expired or invalid, logging out...');
                await logout();
            }
        }
    };



    const login = async (email: string, password: string) => {
        try {
            // Call the real backend API - role determined by backend from database
            const response = await api.post(ENDPOINTS.LOGIN, { email, password });

            const { _id, name, email: userEmail, role: userRole, status: userStatus, xp: userXp, level: userLevel, streak: userStreak, selectedClass: userClass, avatar: userAvatar, themeColor, token: authToken } = response.data;

            const userData = { _id, name, email: userEmail, role: userRole, status: userStatus, selectedClass: userClass, avatar: userAvatar, themeColor };

            await storeData(STORAGE_KEYS.USER_DATA, userData);
            await storeData(STORAGE_KEYS.USER_TOKEN, authToken);
            await storeData('user_xp', (userXp || 0).toString());
            await storeData('user_level', (userLevel || 1).toString());
            await storeData('user_streak', (userStreak || 0).toString());
            await removeData('is_guest');

            // Sync class selection if needed
            if (userClass) {
                await storeData('selected_class', JSON.stringify({
                    classId: `class-${userClass}`,
                    selectedAt: new Date().toISOString(),
                    synced: true
                }));
            }

            setUser(userData);
            setToken(authToken);
            setIsGuest(false);
            setXP(userXp || 0);
            setLevel(userLevel || 1);
            setStreak(userStreak || 0);
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const register = async (userData: any) => {
        console.log('🔵 AuthContext.register() called with:', {
            name: userData.name,
            email: userData.email,
            language: userData.language
        });

        try {
            console.log('🔵 Sending registration request to:', ENDPOINTS.REGISTER);
            console.log('🔵 Full request data:', userData);

            const response = await api.post(ENDPOINTS.REGISTER, userData);

            console.log('✅ Registration response received:', {
                status: response.status,
                hasData: !!response.data,
                hasToken: !!response.data?.token
            });

            const { _id, name, email, role, status, selectedClass: userClass, token: authToken } = response.data;

            const userDataObj = { _id, name, email, role, status, selectedClass: userClass };

            await storeData(STORAGE_KEYS.USER_DATA, userDataObj);
            await storeData(STORAGE_KEYS.USER_TOKEN, authToken);
            await storeData('user_xp', '0');
            await storeData('user_streak', '0');
            await removeData('is_guest');

            setUser(userDataObj);
            setToken(authToken);
            setIsGuest(false);
            setXP(0);
            setStreak(0);

            console.log('✅ Registration complete, user stored');
        } catch (error: any) {
            console.error('❌ Registration error in AuthContext:', {
                message: error.message,
                isNetworkError: error.isNetworkError,
                status: error.status,
                responseData: error.data,
                fullError: error
            });
            throw error;
        }
    };

    const loginAsGuest = async () => {
        setUser({ name: 'Guest' });
        setIsGuest(true);
        await storeData('is_guest', 'true');
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        setIsGuest(false);
        setXP(0);
        setStreak(0);
        await removeData(STORAGE_KEYS.USER_DATA);
        await removeData(STORAGE_KEYS.USER_TOKEN);
        await removeData('is_guest');
        await removeData('user_xp');
        await removeData('user_streak');
    };

    const addXP = async (amount: number, source: string = 'activity') => {
        const newXP = xp + amount;
        setXP(newXP);
        await storeData('user_xp', newXP.toString());

        // Level Up Check (Simple: Every 100 XP)
        const newLevel = Math.floor(newXP / 100) + 1;
        if (newLevel > level) {
            setLevel(newLevel);
            setShowLevelUp(true);
            await storeData('user_level', newLevel.toString());
        }

        // Sync to backend if online, otherwise queue
        if (token) {
            try {
                await api.post('/xp/add', { amount, source }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.log('XP sync failed, adding to queue');
                await addToQueue('SYNC_XP', { amount, source });
            }
        } else {
            // Offline - add to queue
            await addToQueue('SYNC_XP', { amount, source });
        }
    };

    const updateUser = async (data: { name?: string; email?: string; selectedClass?: number | null; avatar?: string | null; themeColor?: string; city?: string }) => {
        try {
            let updatedUser = { ...user };

            if (token && !isGuest) {
                // Call backend API to update profile if authenticated
                const response = await api.put('/auth/profile', data);
                updatedUser = { ...updatedUser, ...response.data };
            } else {
                // Guest mode: just update local object
                updatedUser = { ...updatedUser, ...data };
            }

            // If avatar was updated, ensure it's in the user object
            if (data.avatar) {
                updatedUser.avatar = data.avatar;
            }

            // If selectedClass was updated, ensure it's in the user object and sync with classService
            if (data.selectedClass) {
                updatedUser.selectedClass = data.selectedClass;

                // Sync with classService
                const { classService } = require('../services/classService');
                await classService.saveClassLocally(`class-${data.selectedClass}`);
            }

            // Immediately update state
            setUser(updatedUser);
            await storeData(STORAGE_KEYS.USER_DATA, updatedUser);
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    };

    const closeLevelUp = () => setShowLevelUp(false);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, isGuest, xp, streak, level, showLevelUp, closeLevelUp, login, register, loginAsGuest, logout, addXP, updateUser }}>
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
