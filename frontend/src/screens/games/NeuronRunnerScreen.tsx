import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Button } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    Easing,
    useAnimatedReaction
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameLayout from '../../components/games/GameLayout';
import TutorialOverlay from '../../components/games/TutorialOverlay';
import { useGameProgress } from '../../hooks/useGameProgress';
import { soundManager } from '../../utils/soundEffects';

const { width, height } = Dimensions.get('window');
const LANE_WIDTH = width / 3;
const PLAYER_SIZE = 50;
const OBSTACLE_SIZE = 40;
const GAME_SPEED_START = 5; // Pixels per frame approx
const SPEED_INCREMENT = 0.1;

type EntityType = 'obstacle' | 'coin';

interface GameEntity {
    id: string;
    lane: -1 | 0 | 1; // Left, Center, Right
    y: number;
    type: EntityType;
    collected?: boolean;
}

const NeuronRunnerScreen = () => {
    const theme = useTheme();
    const { score, addScore, endGame, lives, loseLife, isGameOver, resetGame } = useGameProgress('neuron_runner');
    const [gameState, setGameState] = useState<'playing' | 'menu' | 'gameover'>('menu');
    const [entities, setEntities] = useState<GameEntity[]>([]);

    // Animation Values
    const playerLane = useSharedValue(0); // -1, 0, 1
    const gameSpeed = useRef(GAME_SPEED_START);
    const requestRef = useRef<number | null>(null);
    const scoreRef = useRef(0);

    // Controls
    const handleSwipeLeft = useCallback(() => {
        if (playerLane.value > -1) {
            playerLane.value = withSpring(playerLane.value - 1);
            soundManager.playClick();
        }
    }, []);

    const handleSwipeRight = useCallback(() => {
        if (playerLane.value < 1) {
            playerLane.value = withSpring(playerLane.value + 1);
            soundManager.playClick();
        }
    }, []);

    const swipeGesture = Gesture.Pan()
        .onEnd((e) => {
            if (e.translationX < -30) {
                runOnJS(handleSwipeLeft)();
            } else if (e.translationX > 30) {
                runOnJS(handleSwipeRight)();
            }
        });

    // Game Loop
    const updateGame = useCallback(() => {
        if (gameState !== 'playing') return;

        setEntities(prev => {
            const next = prev
                .map(e => ({ ...e, y: e.y + gameSpeed.current }))
                .filter(e => e.y < height + 100); // Remove off-screen

            // Collision Detection
            // Player Y is fixed at bottom (e.g., height - 150)
            const playerY = height - 150;
            const hitBox = 40;

            const currentPlayerLane = Math.round(playerLane.value);

            next.forEach(e => {
                if (!e.collected && Math.abs(e.y - playerY) < hitBox && e.lane === currentPlayerLane) {
                    if (e.type === 'coin') {
                        e.collected = true;
                        soundManager.playCorrect();
                        addScore(10);
                    } else if (e.type === 'obstacle') {
                        e.collected = true; // Mark as hit so it doesn't kill twice
                        soundManager.playWrong();
                        loseLife();
                    }
                }
            });

            return next;
        });

        // Spawn logic
        if (Math.random() < 0.05) { // Spawn rate
            const type = Math.random() > 0.3 ? 'coin' : 'obstacle';
            const lane = Math.floor(Math.random() * 3) - 1 as -1 | 0 | 1;
            setEntities(prev => [
                ...prev,
                {
                    id: Math.random().toString(),
                    lane,
                    y: -100,
                    type
                }
            ]);
        }

        // Speed up
        gameSpeed.current += 0.001;

        requestRef.current = requestAnimationFrame(updateGame);
    }, [gameState, playerLane, addScore, loseLife]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(updateGame);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, updateGame]);

    useEffect(() => {
        if (isGameOver) {
            setGameState('gameover');
        }
    }, [isGameOver]);

    const startGame = () => {
        resetGame();
        setEntities([]);
        gameSpeed.current = GAME_SPEED_START;
        playerLane.value = 0;
        setGameState('playing');
    };

    const playerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: playerLane.value * LANE_WIDTH } // center is 0
            ]
        };
    });

    return (
        <GameLayout title="Neuron Runner" score={score} lives={lives}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <GestureDetector gesture={swipeGesture}>
                    <View style={styles.container}>
                        {/* Background */}
                        <LinearGradient
                            colors={['#000000', '#1a237e', '#000000']}
                            style={styles.track}
                        >
                            {/* Lanes */}
                            <View style={styles.laneMarker} />
                            <View style={styles.laneMarker} />
                        </LinearGradient>

                        {/* Game Layer */}
                        <View style={styles.gameLayer}>
                            {/* Player */}
                            <Animated.View style={[styles.playerContainer, playerStyle]}>
                                <View style={styles.player}>
                                    <MaterialCommunityIcons name="flash" size={32} color="#FFD700" />
                                </View>
                                <Surface style={styles.glow} elevation={4}>
                                    <View />
                                </Surface>
                            </Animated.View>

                            {/* Entities */}
                            {entities.map(e => e.collected ? null : (
                                <View
                                    key={e.id}
                                    style={[
                                        styles.entity,
                                        {
                                            left: (width / 2) + (e.lane * LANE_WIDTH) - (OBSTACLE_SIZE / 2),
                                            top: e.y,
                                            backgroundColor: e.type === 'coin' ? '#00E5FF' : '#FF1744'
                                        }
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={e.type === 'coin' ? 'plus-circle' : 'close-octagon'}
                                        size={24}
                                        color="#fff"
                                    />
                                </View>
                            ))}
                        </View>

                        {/* Controls Overlay (Visual cues) */}
                        <View style={styles.controlsOverlay}>
                            <View style={styles.touchArea} onTouchEnd={handleSwipeLeft} />
                            <View style={styles.touchArea} onTouchEnd={handleSwipeRight} />
                        </View>

                    </View>
                </GestureDetector>
            </GestureHandlerRootView>

            <TutorialOverlay
                visible={gameState === 'menu'}
                title="Neuron Runner"
                instructions={[
                    "You are an electrical impulse!",
                    "Swipe Left/Right to switch lanes.",
                    "Collect (+) Ions to charge up.",
                    "Avoid (-) Inhibitors!"
                ]}
                onStart={startGame}
            />

            {gameState === 'gameover' && (
                <View style={styles.gameOverOverlay}>
                    <Surface style={styles.gameOverCard}>
                        <Text variant="headlineMedium" style={styles.gameOverTitle}>Signal Lost!</Text>
                        <Text variant="titleLarge" style={styles.finalScore}>Final Score: {score}</Text>
                        <Button mode="contained" onPress={startGame} style={styles.restartBtn}>Try Again</Button>
                    </Surface>
                </View>
            )}
        </GameLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    track: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    laneMarker: {
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        height: '100%',
    },
    gameLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerContainer: {
        position: 'absolute',
        bottom: 150,
        width: 80, // larger for centering
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    player: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF176',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    glow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 215, 0, 0.4)',
        zIndex: 1,
    },
    entity: {
        position: 'absolute',
        width: OBSTACLE_SIZE,
        height: OBSTACLE_SIZE,
        borderRadius: OBSTACLE_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
    },
    touchArea: {
        flex: 1,
        // backgroundColor: 'rgba(255,0,0,0.1)', // Debug
    },
    gameOverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
    }
});

export default NeuronRunnerScreen;
