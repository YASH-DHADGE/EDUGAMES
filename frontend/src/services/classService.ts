import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import NetInfo from '@react-native-community/netinfo';

const CLASS_STORAGE_KEY = 'selected_class';

export type ClassLevel = 'class-6' | 'class-7' | 'class-8' | 'class-9' | 'class-10' | 'class-11' | 'class-12';

export interface ClassSelection {
    classId: ClassLevel;
    selectedAt: string;
    synced: boolean;
}

class ClassService {
    // Get selected class from local storage
    async getSelectedClass(): Promise<ClassLevel | null> {
        try {
            const data = await AsyncStorage.getItem(CLASS_STORAGE_KEY);
            if (data) {
                const selection: ClassSelection = JSON.parse(data);
                return selection.classId;
            }
            return null;
        } catch (error) {
            console.error('[ClassService] Error getting selected class:', error);
            return null;
        }
    }

    // Save class selection locally and sync to backend
    async selectClass(classId: ClassLevel, token?: string): Promise<void> {
        try {
            if (!classId) return;
            console.log('[ClassService] Selecting class:', classId);

            // Save locally
            const selection: ClassSelection = {
                classId,
                selectedAt: new Date().toISOString(),
                synced: false,
            };
            await AsyncStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(selection));
            console.log('[ClassService] Class saved locally');

            // Sync to backend if online and authenticated
            if (token) {
                await this.syncClassToBackend(classId, token);
            } else {
                console.log('[ClassService] No token - guest mode, class saved locally only');
            }
        } catch (error) {
            console.error('[ClassService] Error selecting class:', error);
            throw error;
        }
    }

    // Save class selection locally without syncing (for initial load or migration)
    async saveClassLocally(classId: ClassLevel): Promise<void> {
        try {
            const selection: ClassSelection = {
                classId,
                selectedAt: new Date().toISOString(),
                synced: true, // Assume synced if coming from backend
            };
            await AsyncStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(selection));
            console.log('[ClassService] Class saved locally (no sync)');
        } catch (error) {
            console.error('[ClassService] Error saving class locally:', error);
        }
    }

    // Sync class selection to backend
    private async syncClassToBackend(classId: ClassLevel, token: string): Promise<void> {
        const netInfo = await NetInfo.fetch();
        const isOnline = netInfo.isConnected === true && netInfo.isInternetReachable !== false;

        if (isOnline) {
            try {
                if (!classId) {
                    console.log('[ClassService] Cannot sync: Class ID is missing');
                    return;
                }
                console.log('[ClassService] Syncing class to backend');
                await api.post('/user/select-class',
                    { classId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Mark as synced
                const data = await AsyncStorage.getItem(CLASS_STORAGE_KEY);
                if (data) {
                    const selection: ClassSelection = JSON.parse(data);
                    selection.synced = true;
                    await AsyncStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(selection));
                }

                console.log('[ClassService] Class synced successfully');
            } catch (error) {
                console.log('[ClassService] Sync failed, will retry when online:', error);
                // Keep synced: false so we can retry later
            }
        } else {
            console.log('[ClassService] Offline - class will sync when online');
        }
    }

    // Fetch class from backend (when user logs in)
    async fetchClassFromBackend(token: string): Promise<ClassLevel | null> {
        try {
            console.log('[ClassService] Fetching class from backend');
            const response = await api.get('/user/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const classId = response.data.user?.selectedClass || response.data.user?.class;
            if (classId) {
                // Save to local storage
                const selection: ClassSelection = {
                    classId,
                    selectedAt: new Date().toISOString(),
                    synced: true,
                };
                await AsyncStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(selection));
                console.log('[ClassService] Class fetched and saved:', classId);
                return classId;
            }
            return null;
        } catch (error) {
            console.log('[ClassService] Error fetching class from backend:', error);
            return null;
        }
    }

    // Retry syncing unsynced class selection
    async retrySyncIfNeeded(token: string): Promise<void> {
        try {
            const data = await AsyncStorage.getItem(CLASS_STORAGE_KEY);
            if (data) {
                const selection: ClassSelection = JSON.parse(data);
                if (!selection.classId) {
                    // Clean up bad data
                    await AsyncStorage.removeItem(CLASS_STORAGE_KEY);
                    return;
                }
                if (!selection.synced && token) {
                    console.log('[ClassService] Retrying class sync');
                    await this.syncClassToBackend(selection.classId, token);
                }
            }
        } catch (error) {
            console.error('[ClassService] Error retrying sync:', error);
        }
    }

    // Clear class selection (for logout)
    async clearClass(): Promise<void> {
        try {
            await AsyncStorage.removeItem(CLASS_STORAGE_KEY);
            console.log('[ClassService] Class selection cleared');
        } catch (error) {
            console.error('[ClassService] Error clearing class:', error);
        }
    }

    // Get all available classes
    getAvailableClasses(): { id: ClassLevel; label: string; icon: string }[] {
        return [
            { id: 'class-6', label: 'Class 6', icon: '6️⃣' },
            { id: 'class-7', label: 'Class 7', icon: '7️⃣' },
            { id: 'class-8', label: 'Class 8', icon: '8️⃣' },
            { id: 'class-9', label: 'Class 9', icon: '9️⃣' },
            { id: 'class-10', label: 'Class 10', icon: '🔟' },
            { id: 'class-11', label: 'Class 11', icon: '1️⃣1️⃣' },
            { id: 'class-12', label: 'Class 12', icon: '1️⃣2️⃣' },
        ];
    }
}

export const classService = new ClassService();
export default classService;
