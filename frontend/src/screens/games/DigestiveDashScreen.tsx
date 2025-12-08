import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, useTheme, Button } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
    withSequence,
    useAnimatedReaction,
    cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameLayout from '../../components/games/GameLayout';
import TutorialOverlay from '../../components/games/TutorialOverlay';
import { useGameProgress } from '../../hooks/useGameProgress';
import { soundManager } from '../../utils/soundEffects';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

const { width, height } = Dimensions.get('window');
const FALL_SPEED_BASE = 6000; // Slower speed (6s to fall)

type NutrientType = 'Carbs' | 'Protein' | 'Fats';

interface FoodItem {
    id: string;
    name: string;
    image: string;
    type: NutrientType;
    color: string;
}

const FOOD_DATABASE: Omit<FoodItem, 'id'>[] = [
    { name: 'Bread', image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400', type: 'Carbs', color: '#FFB74D' },
    { name: 'Rice', image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400', type: 'Carbs', color: '#FFE0B2' },
    { name: 'Pasta', image: 'https://images.unsplash.com/photo-1612966874574-10b2df700c0f?w=400', type: 'Carbs', color: '#FFF3E0' },
    { name: 'Potato', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', type: 'Carbs', color: '#FFECB3' },
    { name: 'Steak', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', type: 'Protein', color: '#E57373' },
    { name: 'Egg', image: 'https://images.unsplash.com/photo-1491524062933-cb0289261700?w=400', type: 'Protein', color: '#FFCC80' },
    { name: 'Chicken', image: 'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=400', type: 'Protein', color: '#FFAB91' },
    { name: 'Fish', image: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=400', type: 'Protein', color: '#FF8A65' },
    { name: 'Butter', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', type: 'Fats', color: '#FFF59D' },
    { name: 'Cheese', image: 'https://images.unsplash.com/photo-1623933010724-4ce858c89ad5?w=400', type: 'Fats', color: '#FFD54F' },
    { name: 'Avocado', image: 'https://images.unsplash.com/photo-1523049673856-386030884ead?w=400', type: 'Fats', color: '#C5E1A5' },
    { name: 'Oil', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd0312?w=400', type: 'Fats', color: '#FFF176' },
    // New Items
    { name: 'Corn', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400', type: 'Carbs', color: '#FFD54F' },
    { name: 'Cereal', image: 'https://images.unsplash.com/photo-1521483450564-18f16f6438e7?w=400', type: 'Carbs', color: '#FFE0B2' },
    { name: 'Bagel', image: 'https://images.unsplash.com/photo-1585478684894-a9d5496f715e?w=400', type: 'Carbs', color: '#FFF9C4' },
    { name: 'Muffin', image: 'https://images.unsplash.com/photo-1558401391-7899b4bd5bbf?w=400', type: 'Carbs', color: '#FFECB3' },
    { name: 'Turkey', image: 'https://images.unsplash.com/photo-1574672174777-b4131477d657?w=400', type: 'Protein', color: '#FFCCBC' },
    { name: 'Tofu', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', type: 'Protein', color: '#FFF59D' },
    { name: 'Shrimp', image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400', type: 'Protein', color: '#FFAB91' },
    { name: 'Beans', image: 'https://images.unsplash.com/photo-1546648714-3d02a0a38217?w=400', type: 'Protein', color: '#A1887F' },
    { name: 'Nuts', image: 'https://images.unsplash.com/photo-1536551800216-19f8013ca6bc?w=400', type: 'Fats', color: '#D7CCC8' },
    { name: 'Olive', image: 'https://images.unsplash.com/photo-1477505982272-eca917578bb2?w=400', type: 'Fats', color: '#C5E1A5' },
    { name: 'Dark Choc', image: 'https://images.unsplash.com/photo-1623341214151-82748370dfd8?w=400', type: 'Fats', color: '#8D6E63' },
    { name: 'Bacon', image: 'https://images.unsplash.com/photo-1481070555726-e2fe834071ea?w=400', type: 'Fats', color: '#EF5350' },
];

const ENZYMES = [
    { name: 'Amylase', target: 'Carbs', color: '#FF9800' },
    { name: 'Protease', target: 'Protein', color: '#F44336' },
    { name: 'Lipase', target: 'Fats', color: '#FFEB3B' },
];

const FallingFood = ({ food, onMiss, active }: { food: FoodItem, onMiss: (id: string) => void, active: boolean }) => {
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(1);

    useEffect(() => {
        translateY.value = withTiming(height - 250, { // Target zone height
            duration: FALL_SPEED_BASE,
            easing: Easing.linear
        }, (finished) => {
            if (finished && active) {
                runOnJS(onMiss)(food.id);
            }
        });
        return () => {
            cancelAnimation(translateY);
        };
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value
    }));

    return (
        <Animated.View style={[styles.fallingItem, style, { backgroundColor: food.color, borderColor: food.color }]}>
            <Image source={{ uri: food.image }} style={styles.foodImage} />
            <View style={styles.labelContainer}>
                <Text style={styles.foodLabel}>{food.name}</Text>
            </View>
        </Animated.View>
    );
};

const FeedbackOverlay = ({ type }: { type: 'correct' | 'wrong' | null }) => {
    if (!type) return null;
    return (
        <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackText, { color: type === 'correct' ? '#4CAF50' : '#F44336' }]}>
                {type === 'correct' ? 'Correct!' : 'Wrong!'}
            </Text>
        </View>
    );
};

const DigestiveDashScreen = () => {
    const theme = useTheme();
    const { score, addScore, endGame, lives, loseLife, isGameOver, resetGame } = useGameProgress('digestive_dash');
    const [gameState, setGameState] = useState<'playing' | 'menu' | 'gameover'>('menu');
    const [activeFood, setActiveFood] = useState<FoodItem | null>(null);
    const [key, setKey] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    // Check for game over from useGameProgress
    useEffect(() => {
        if (isGameOver) {
            setGameState('gameover');
            stopTimer();
            saveGameResult({
                gameId: 'digestive_dash',
                score: score,
                maxScore: 1000, // Theoretical max
                timeTaken: elapsedTime,
                difficulty: 'medium',
                completedLevel: 1
            });
        }
    }, [isGameOver]);

    useEffect(() => {
        if (gameState === 'playing' && !activeFood) {
            spawnFood();
        }
    }, [gameState, activeFood]);

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const spawnFood = () => {
        const randomFood = FOOD_DATABASE[Math.floor(Math.random() * FOOD_DATABASE.length)];
        const newFood = { ...randomFood, id: Math.random().toString() };
        setActiveFood(newFood);
        setKey(prev => prev + 1);
    };

    const handleMiss = useCallback(() => {
        soundManager.playWrong();
        loseLife();
        setFeedback('wrong');
        setActiveFood(null);
    }, [loseLife]);

    const handleEnzymePress = (enzymeTarget: NutrientType) => {
        if (!activeFood) return;

        if (enzymeTarget === activeFood.type) {
            soundManager.playCorrect();
            addScore(20);
            setFeedback('correct');
            setActiveFood(null);
        } else {
            soundManager.playWrong();
            loseLife();
            setFeedback('wrong');
        }
    };

    const startGame = () => {
        resetGame();
        setActiveFood(null);
        setFeedback(null);
        setGameState('playing');
        resetGameTimer();
        startTimer();
    };

    return (
        <GameLayout title="Digestive Dash" score={score} lives={lives} timer={displayTime}>

            <View style={styles.container}>
                <LinearGradient
                    colors={['#f8bbd0', '#f48fb1', '#ec407a']}
                    style={styles.track}
                >
                    <View style={styles.tractBackground}>
                        <View style={styles.tractLine} />
                    </View>

                    {activeFood && gameState === 'playing' && (
                        <FallingFood
                            key={key}
                            food={activeFood}
                            onMiss={handleMiss}
                            active={true}
                        />
                    )}

                    <FeedbackOverlay type={feedback} />

                    <Surface style={styles.controls} elevation={5}>
                        <Text style={styles.controlsTitle}>Select Enzyme</Text>
                        <View style={styles.buttonRow}>
                            {ENZYMES.map(enzyme => (
                                <TouchableOpacity
                                    key={enzyme.name}
                                    style={[styles.enzymeBtn, { backgroundColor: enzyme.color }]}
                                    onPress={() => handleEnzymePress(enzyme.target as NutrientType)}
                                >
                                    <View style={styles.enzymeIcon}>
                                        <MaterialCommunityIcons name="bottle-tonic-plus" size={24} color="#fff" />
                                    </View>
                                    <Text style={styles.enzymeText}>{enzyme.name}</Text>
                                    <Text style={styles.targetText}>({enzyme.target})</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Surface>

                </LinearGradient>
            </View>

            <TutorialOverlay
                visible={gameState === 'menu'}
                title="Digestive Dash"
                instructions={[
                    "Food is entering the stomach!",
                    "Tap the correct Enzyme to digest it.",
                    "Amylase -> Carbs (Bread, Rice, Pasta)",
                    "Protease -> Protein (Steak, Egg, Fish)",
                    "Lipase -> Fats (Butter, Cheese, Oil)"
                ]}
                onStart={startGame}
            />

            {gameState === 'gameover' && (
                <View style={styles.gameOverOverlay}>
                    <Surface style={styles.gameOverCard}>
                        <Text variant="headlineMedium" style={styles.gameOverTitle}>Indigestion!</Text>
                        <Text variant="titleLarge" style={styles.finalScore}>Score: {score}</Text>
                        <Text variant="titleMedium" style={{ marginBottom: 20, color: '#333' }}>Time: {displayTime}</Text>
                        <Button mode="contained" onPress={startGame} style={styles.restartBtn}>Digest Again</Button>
                    </Surface>
                </View>
            )}
        </GameLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    track: {
        flex: 1,
        alignItems: 'center',
    },
    tractBackground: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        opacity: 0.3
    },
    tractLine: {
        width: 120,
        height: '100%',
        backgroundColor: '#ad1457',
        opacity: 0.2
    },
    fallingItem: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        borderWidth: 4,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 10
    },
    foodImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    labelContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 2,
        alignItems: 'center',
    },
    foodLabel: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#fff'
    },
    controlsTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333'
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10
    },
    enzymeBtn: {
        flex: 1,
        height: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        elevation: 2
    },
    enzymeIcon: {
        marginBottom: 8
    },
    enzymeText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 14
    },
    targetText: {
        color: '#555',
        fontSize: 10
    },
    feedbackContainer: {
        position: 'absolute',
        top: '40%',
        zIndex: 20,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        elevation: 10,
    },
    feedbackText: {
        fontSize: 32,
        fontWeight: '900',
        textTransform: 'uppercase',
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
    }
});

export default DigestiveDashScreen;
