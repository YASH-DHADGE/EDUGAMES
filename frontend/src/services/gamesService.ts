import api from './api';
import { addToQueue } from '../offline/syncQueue';
import NetInfo from '@react-native-community/netinfo';

export interface GameResult {
    gameId: string; // Changed from gameType to gameId to match backend
    score: number;
    maxScore?: number;
    timeTaken: number; // in seconds
    accuracy?: number;
    difficulty?: string;
    completedLevel?: number;
    timestamp?: number;
}

/**
 * Save game result - handles online/offline scenarios
 */
export const saveGameResult = async (result: GameResult): Promise<void> => {
    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
        try {
            const response = await api.post('/games/result', result);
            console.log('[GamesService] Saved game result online:', response.data);
        } catch (error) {
            console.error('[GamesService] Failed to save online, queuing...', error);
            // Ensure timestamp is present for offline queue
            const resultWithTimestamp = { ...result, timestamp: Date.now() };
            await addToQueue('SUBMIT_GAME_RESULT', resultWithTimestamp);
        }
    } else {
        console.log('[GamesService] Offline, queuing game result:', result);
        const resultWithTimestamp = { ...result, timestamp: Date.now() };
        await addToQueue('SUBMIT_GAME_RESULT', resultWithTimestamp);
    }
}


// Fetch User Game Stats
export const getUserGameStats = async (): Promise<Record<string, { lastPlayed: string, lastTimeTaken: number, highScore: number, lastScore: number }>> => {
    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
        try {
            // Note: api instance usually has base URL /api, so we just need /games/user-stats
            // Assuming 'api' imported from './api' already handles token if set in interceptors
            // If not, we should check implementation of './api'.
            // For safety, let's look at how other calls do it. saveGameResult uses api.post('/games/result')
            const response = await api.get('/games/user-stats');
            return response.data;
        } catch (error) {
            console.error('[GamesService] Failed to fetch stats:', error);
            return {};
        }
    } else {
        return {};
    }
};
