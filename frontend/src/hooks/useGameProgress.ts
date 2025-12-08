import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { soundManager } from '../utils/soundEffects';

interface GameProgress {
    highScore: number;
    unlockedLevels: string[];
    stars: Record<string, number>; // levelId -> stars (1-3)
}

const STORAGE_KEY_PREFIX = 'game_progress_';

export const useGameProgress = (gameId: string) => {
    const { addXP } = useAuth();
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [highScore, setHighScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Load progress on mount
    useEffect(() => {
        loadProgress();
    }, [gameId]);

    const loadProgress = async () => {
        try {
            const data = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`);
            if (data) {
                const progress: GameProgress = JSON.parse(data);
                setHighScore(progress.highScore || 0);
            }
        } catch (error) {
            console.error('Failed to load game progress', error);
        }
    };

    const saveProgress = async (newScore: number) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                const progress: GameProgress = {
                    highScore: newScore,
                    unlockedLevels: [], // Todo: implement level unlocking
                    stars: {}
                };
                await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, JSON.stringify(progress));
            }
        } catch (error) {
            console.error('Failed to save game progress', error);
        }
    };

    const addScore = useCallback((points: number) => {
        setScore(prev => prev + points);
    }, []);

    const loseLife = useCallback(() => {
        if (lives > 0) {
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives === 0) {
                    endGame();
                }
                soundManager.playWrong(); // Or 'damage' sound
                return newLives;
            });
        }
    }, [lives]);

    const endGame = useCallback(async (finalScore?: number, timeTaken: number = 0) => {
        setIsGameOver(true);
        const actualScore = finalScore !== undefined ? finalScore : score;

        // Only play wrong sound if it was a loss (simplification, can be refined)
        // soundManager.playWrong(); 

        await saveProgress(actualScore);

        // Award XP
        if (actualScore > 0) {
            const xpEarned = Math.floor(actualScore / 10);
            addXP(xpEarned, `Played ${gameId}`);
        }

        // Save to Database via Service
        // We defer this to specific screens if they have more detailed data, 
        // OR we can try to save a generic result here. 
        // Since useGameProgress doesn't know "maxScore" or "accuracy", 
        // it's better if the screen calls saveGameResult directly?
        // Actually, let's keep this generic hook focused on local state and *provide* a save helper,
        // OR rely on the screen to call the service.
        // BUT for simpler migration, let's try to save what we know.

        /* 
           Ideally, screens should call saveGameResult themselves because they have context 
           (level difficulty, max score, etc.).
           useGameProgress acts as a local state manager.
           I will NOT put saveGameResult here to avoid partial data submission.
           I'll update screens to call saveGameResult.
        */

    }, [score, gameId, highScore, addXP]);

    const resetGame = useCallback(() => {
        setScore(0);
        setLives(3);
        setIsGameOver(false);
        setIsPaused(false);
    }, []);

    return {
        score,
        level,
        lives,
        highScore,
        isGameOver,
        isPaused,
        addScore,
        loseLife,
        endGame,
        resetGame,
        setIsPaused,
        setLevel
    };
};
