import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { Text, Surface, useTheme, Button } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameLayout from '../../components/games/GameLayout';
import TutorialOverlay from '../../components/games/TutorialOverlay';
import { useGameProgress } from '../../hooks/useGameProgress';
import { soundManager } from '../../utils/soundEffects';

const { width, height } = Dimensions.get('window');
const GRAVITY = 0.5;
const JUMP_FORCE = -8;
const OBSTACLE_SPEED = 4;
const OBSTACLE_GAP = 200;
const OBSTACLE_WIDTH = 60;

const RespirationQuestScreen = () => {
    const theme = useTheme();
    const { score, addScore, endGame, lives, loseLife, isGameOver, resetGame } = useGameProgress('respiration_quest');
    const [gameState, setGameState] = useState<'playing' | 'menu' | 'gameover'>('menu');
    const [obstacles, setObstacles] = useState<{ id: string, x: number, y: number, height: number }[]>([]);

    // Physics Values
    const playerY = useRef(height / 2);
    const velocity = useRef(0);
    const requestRef = useRef<number | null>(null);
    const playerYShared = useSharedValue(height / 2);
    const distanceTraveled = useRef(0);

    // Controls
    const handleTap = useCallback(() => {
        velocity.current = JUMP_FORCE;
        soundManager.playClick();
    }, []);

    const tapGesture = Gesture.Tap().onStart(() => {
        runOnJS(handleTap)();
    });

    // Game Loop
    const updateGame = useCallback(() => {
        if (gameState !== 'playing') return;

        // Physics
        velocity.current += GRAVITY;
        playerY.current += velocity.current;
        distanceTraveled.current += OBSTACLE_SPEED / 10;

        // Bounds Check
        if (playerY.current < 0) playerY.current = 0;
        if (playerY.current > height - 100) { // Hit floor
            // loseLife(); // Or game over
            playerY.current = height - 100;
            velocity.current = 0;
        }

        playerYShared.value = playerY.current;

        // Obstacles
        setObstacles(prev => {
            const next = prev
                .map(o => ({ ...o, x: o.x - OBSTACLE_SPEED }))
                .filter(o => o.x > -OBSTACLE_WIDTH);

            // Collision
            // Player is roughly 40x40 circle at (50, playerY)
            const playerRec = { x: 50, y: playerY.current, size: 40 };

            next.forEach(o => {
                // Simplified AABB
                if (
                    playerRec.x < o.x + OBSTACLE_WIDTH &&
                    playerRec.x + playerRec.size > o.x &&
                    playerRec.y < o.y + o.height &&
                    playerRec.y + playerRec.size > o.y
                ) {
                    // Collision detected
                    // For now just bump
                    // soundManager.playWrong();
                }
            });

            return next;
        });

        // Spawning
        if (Math.random() < 0.02) { // Rate
            // Spawn logic for top/bottom pipes
            // Simplified for now: Just random "mucus" blocks
            setObstacles(prev => [
                ...prev,
                {
                    id: Math.random().toString(),
                    x: width,
                    y: Math.random() * (height - 200),
                    height: 100
                }
            ]);
            addScore(1);
        }

        requestRef.current = requestAnimationFrame(updateGame);
    }, [gameState, addScore]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(updateGame);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, updateGame]);

    useEffect(() => {
        if (isGameOver) setGameState('gameover');
    }, [isGameOver]);

    const startGame = () => {
        resetGame();
        setObstacles([]);
        playerY.current = height / 2;
        velocity.current = 0;
        playerYShared.value = height / 2;
        distanceTraveled.current = 0;
        setGameState('playing');
    };

    const playerStyle = useAnimatedStyle(() => {
        return {
            top: playerYShared.value
        };
    });

    return (
        <GameLayout title="Respiration Quest" score={score} lives={lives}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <GestureDetector gesture={tapGesture}>
                    <View style={styles.container}>
                        <LinearGradient
                            colors={['#ef9a9a', '#ffcdd2', '#ffebee']}
                            style={styles.background}
                        >
                            {/* Background Details */}
                            <MaterialCommunityIcons name="lungs" size={200} color="rgba(255,255,255,0.2)" style={styles.bgIcon} />
                        </LinearGradient>

                        {/* Player */}
                        <Animated.View style={[styles.player, playerStyle]}>
                            <Surface style={styles.bubble} elevation={2}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E88E5' }}>O2</Text>
                            </Surface>
                        </Animated.View>

                        {/* Obstacles */}
                        {obstacles.map(o => (
                            <View
                                key={o.id}
                                style={[
                                    styles.obstacle,
                                    {
                                        left: o.x,
                                        top: o.y,
                                        height: o.height,
                                        width: OBSTACLE_WIDTH
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name="bacteria" size={30} color="#66BB6A" />
                            </View>
                        ))}

                        {/* Progress UI */}
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>Distance: {Math.floor(score)}m</Text>
                        </View>

                    </View>
                </GestureDetector>
            </GestureHandlerRootView>

            <TutorialOverlay
                visible={gameState === 'menu'}
                title="Respiration Quest"
                instructions={[
                    "You are an Oxygen Molecule!",
                    "Tap to float up, release to sink.",
                    "Avoid the Mucus and CO2.",
                    "Travel deep into the lungs!"
                ]}
                onStart={startGame}
            />

            {gameState === 'gameover' && (
                <View style={styles.gameOverOverlay}>
                    <Surface style={styles.gameOverCard}>
                        <Text variant="headlineMedium" style={styles.gameOverTitle}>Absorbed!</Text>
                        <Text variant="titleLarge" style={styles.finalScore}>Distance: {score}m</Text>
                        <Button mode="contained" onPress={startGame} style={styles.restartBtn}>Breath Again</Button>
                    </Surface>
                </View>
            )}
        </GameLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffebee',
        overflow: 'hidden'
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgIcon: {
        opacity: 0.5
    },
    player: {
        position: 'absolute',
        left: 50,
        zIndex: 10
    },
    bubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2196F3'
    },
    obstacle: {
        position: 'absolute',
        backgroundColor: '#A5D6A7', // Mucus color
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.8,
        borderWidth: 1,
        borderColor: '#4CAF50'
    },
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    gameOverCard: {
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    gameOverTitle: {
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    finalScore: {
        marginVertical: 10,
    },
    restartBtn: {
        marginTop: 20,
        width: 200,
    },
    progressContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 12
    },
    progressText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});

export default RespirationQuestScreen;
