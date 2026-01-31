import { getData, storeData } from '../offline/offlineStorage';
import { addToQueue } from '../offline/syncQueue';
import api from './api';
import NetInfo from '@react-native-community/netinfo';

const PROGRESS_STORAGE_KEY = 'chapter_progress';

export interface ChapterProgress {
    chapterId: string;
    subjectId: string;
    classId: string;
    completed: boolean;
    completedAt?: string;
    lastAccessedAt: string;
}

export interface SubjectProgress {
    subjectId: string;
    classId: string;
    totalChapters: number;
    completedChapters: number;
    progress: number; // 0-100
}

class ProgressService {
    // Get all progress data
    async getAllProgress(): Promise<ChapterProgress[]> {
        const progress = await getData(PROGRESS_STORAGE_KEY);
        return progress || [];
    }

    // Get progress for a specific chapter
    async getChapterProgress(chapterId: string): Promise<ChapterProgress | null> {
        const allProgress = await this.getAllProgress();
        return allProgress.find(p => p.chapterId === chapterId) || null;
    }

    // Mark chapter as completed
    async markChapterComplete(
        chapterId: string,
        subjectId: string,
        classId: string
    ): Promise<void> {
        console.log('[ProgressService] Marking chapter complete:', { chapterId, subjectId, classId });

        const allProgress = await this.getAllProgress();
        const existingIndex = allProgress.findIndex(p => p.chapterId === chapterId);

        const progressItem: ChapterProgress = {
            chapterId,
            subjectId,
            classId,
            completed: true,
            completedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            allProgress[existingIndex] = progressItem;
        } else {
            allProgress.push(progressItem);
        }

        // Save locally
        await storeData(PROGRESS_STORAGE_KEY, allProgress);
        console.log('[ProgressService] Progress saved locally');

        // Sync to backend
        await this.syncProgressToBackend(progressItem);
    }

    // Update last accessed time
    async updateLastAccessed(
        chapterId: string,
        subjectId: string,
        classId: string
    ): Promise<void> {
        const allProgress = await this.getAllProgress();
        const existingIndex = allProgress.findIndex(p => p.chapterId === chapterId);

        if (existingIndex >= 0) {
            allProgress[existingIndex].lastAccessedAt = new Date().toISOString();
            await storeData(PROGRESS_STORAGE_KEY, allProgress);
        } else {
            // Create new progress entry (not completed yet)
            const progressItem: ChapterProgress = {
                chapterId,
                subjectId,
                classId,
                completed: false,
                lastAccessedAt: new Date().toISOString(),
            };
            allProgress.push(progressItem);
            await storeData(PROGRESS_STORAGE_KEY, allProgress);
        }
    }

    // Generic update progress method
    async updateProgress(chapterId: string, data: Partial<ChapterProgress>): Promise<void> {
        const allProgress = await this.getAllProgress();
        const existingIndex = allProgress.findIndex(p => p.chapterId === chapterId);

        if (existingIndex >= 0) {
            allProgress[existingIndex] = { ...allProgress[existingIndex], ...data };
            await storeData(PROGRESS_STORAGE_KEY, allProgress);
        } else {
            // Create if not exists (fallback)
            // This assumes specific creation logic isn't strictly needed if we are just updating status
            console.warn('[ProgressService] Attempting to update non-existent progress, creating new entry stub');
            const progressItem: ChapterProgress = {
                chapterId,
                subjectId: data.subjectId || 'unknown',
                classId: data.classId || 'unknown',
                completed: data.completed || false,
                lastAccessedAt: new Date().toISOString(),
                ...data
            } as ChapterProgress;
            allProgress.push(progressItem);
            await storeData(PROGRESS_STORAGE_KEY, allProgress);
        }
    }

    // Get subject progress (calculate from chapters)
    async getSubjectProgress(
        subjectId: string,
        classId: string,
        totalChapters: number
    ): Promise<SubjectProgress> {
        const allProgress = await this.getAllProgress();
        const subjectChapters = allProgress.filter(
            p => p.subjectId === subjectId && p.classId === classId
        );

        const completedChapters = subjectChapters.filter(p => p.completed).length;
        const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

        return {
            subjectId,
            classId,
            totalChapters,
            completedChapters,
            progress,
        };
    }

    // Sync progress to backend (with offline queue support)
    private async syncProgressToBackend(progressItem: ChapterProgress): Promise<void> {
        const netInfo = await NetInfo.fetch();
        const isOnline = netInfo.isConnected === true && netInfo.isInternetReachable !== false;

        if (isOnline) {
            try {
                console.log('[ProgressService] Syncing progress to backend');
                await api.post('/progress/chapter', {
                    chapterId: progressItem.chapterId,
                    subjectId: progressItem.subjectId,
                    classId: progressItem.classId,
                    completed: progressItem.completed,
                    completedAt: progressItem.completedAt,
                });
                console.log('[ProgressService] Progress synced successfully');
            } catch (error) {
                console.log('[ProgressService] Sync failed, adding to queue:', error);
                await addToQueue('SYNC_CHAPTER_PROGRESS', {
                    chapterId: progressItem.chapterId,
                    subjectId: progressItem.subjectId,
                    classId: progressItem.classId,
                    completed: progressItem.completed,
                    completedAt: progressItem.completedAt,
                });
            }
        } else {
            console.log('[ProgressService] Offline, adding progress to queue');
            await addToQueue('SYNC_CHAPTER_PROGRESS', {
                chapterId: progressItem.chapterId,
                subjectId: progressItem.subjectId,
                classId: progressItem.classId,
                completed: progressItem.completed,
                completedAt: progressItem.completedAt,
            });
        }
    }

    // Get all subjects progress for a class
    async getClassProgress(classId: string): Promise<{
        totalSubjects: number;
        totalChapters: number;
        completedChapters: number;
        overallProgress: number;
    }> {
        const allProgress = await this.getAllProgress();
        const classChapters = allProgress.filter(p => p.classId === classId);
        const completedChapters = classChapters.filter(p => p.completed).length;

        // Get unique subjects
        const subjects = new Set(classChapters.map(p => p.subjectId));

        return {
            totalSubjects: subjects.size,
            totalChapters: classChapters.length,
            completedChapters,
            overallProgress: classChapters.length > 0
                ? Math.round((completedChapters / classChapters.length) * 100)
                : 0,
        };
    }

    // Clear all progress (for testing/reset)
    async clearAllProgress(): Promise<void> {
        await storeData(PROGRESS_STORAGE_KEY, []);
        console.log('[ProgressService] All progress cleared');
    }
}

export const progressService = new ProgressService();
export default progressService;
