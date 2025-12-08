import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring, BounceIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

const ForcePlayGame = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const { isDark } = useAppTheme();
    const styles = createStyles(isDark);
    const theme = useTheme();
    const [force, setForce] = useState(5);
    const [mass, setMass] = useState(5);
    const [prediction, setPrediction] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(1);
    const [showResult, setShowResult] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    React.useEffect(() => {
        startTimer();
        return () => stopTimer();
    }, []);

    const objectPosition = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: objectPosition.value }],
    }));

    const calculateAcceleration = () => {
        return force / mass; // F = ma, so a = F/m
    };

    const applyForce = () => {
        const actualAcceleration = calculateAcceleration();
        const distance = actualAcceleration * 30; // Simplified physics
        objectPosition.value = withSpring(distance);
    };

    const submitPrediction = () => {
        if (prediction === null) return;

        const actualAcceleration = calculateAcceleration();
        const error = Math.abs(actualAcceleration - prediction);
        const points = Math.max(0, 20 - Math.floor(error * 2));

        setScore(score + points);
        setShowResult(true);
        applyForce();

        setTimeout(() => {
            if (round < 5) {
                setRound(round + 1);
                setForce(Math.floor(Math.random() * 10) + 1);
                setMass(Math.floor(Math.random() * 10) + 1);
                setPrediction(null);
                setShowResult(false);
                objectPosition.value = 0;
            } else {
                const finalScore = score + points; // Since this runs after setScore(score + points) but in closure
                // Wait, submitPrediction updates score then sets Timeout.
                // The points added in THIS turn need to be accounted for if this is the last round.
                // Actually, submitPrediction logic:
                // setScore(score + points)
                // setTimeout -> checks round < 5.
                // If round == 5, we are done. The score we see here is the OLD score because variables don't update in closure.
                // So we must recalculate finalScore here as well.
                const xpReward = Math.floor(finalScore / 2);
                addXP(xpReward, 'Force Simulator');
                stopTimer();
                setGameOver(true);

                saveGameResult({
                    gameId: 'force_play',
                    score: finalScore,
                    maxScore: 100,
                    timeTaken: elapsedTime,
                    difficulty: 'medium',
                    completedLevel: 1
                });
            }
        }, 2500);
    };

    const resetGame = () => {
        setScore(0);
        setRound(1);
        setForce(5);
        setMass(5);
        setPrediction(null);
        setShowResult(false);
        setGameOver(false);
        objectPosition.value = 0;
        resetGameTimer();
        startTimer();
    };

    // ... (rest of the component)

    if (gameOver) {
        return (
            <LinearGradient
                colors={isDark ? ['#311B92', '#1A237E'] : ['#667eea', '#4facfe']}
                style={styles.container}
            >
                <View style={styles.innerContainer}>
                    <View style={styles.header}>
                        <IconButton
                            icon="arrow-left"
                            iconColor="#fff"
                            size={24}
                            onPress={() => navigation.goBack()}
                        />
                        <Text variant="titleLarge" style={styles.headerTitle}>Force Simulator</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View entering={BounceIn.duration(800)} style={styles.resultContainer}>
                        <Surface style={styles.resultCard} elevation={5}>
                            <Animated.View entering={ZoomIn.delay(200)}>
                                <MaterialCommunityIcons
                                    name={score >= 80 ? "trophy" : score >= 60 ? "lightning-bolt" : "atom"}
                                    size={80}
                                    color={score >= 80 ? "#FFD700" : score >= 60 ? "#667eea" : "#4facfe"}
                                />
                            </Animated.View>
                            <Text variant="headlineMedium" style={styles.resultTitle}>Simulation Complete!</Text>
                            <LinearGradient
                                colors={score >= 80 ? ['#FFD700', '#FFA000'] : score >= 60 ? ['#667eea', '#4facfe'] : ['#4facfe', '#667eea']}
                                style={styles.scoreGradient}
                            >
                                <Text variant="displaySmall" style={styles.scoreText}>{score}/100</Text>
                            </LinearGradient>
                            <Text variant="titleMedium" style={{ marginBottom: 10, color: '#333' }}>Time: {displayTime}</Text>
                            <Text variant="bodyLarge" style={styles.resultMessage}>
                                {score >= 80 ? 'Physics Master! ⚡' : score >= 60 ? 'Great Work! 🔬' : 'Keep Learning! 📚'}
                            </Text>
                            <View style={styles.buttonRow}>
                                <LinearGradient
                                    colors={['#667eea', '#4facfe']}
                                    style={styles.gradientButton}
                                >
                                    <Button
                                        mode="text"
                                        onPress={resetGame}
                                        textColor="#fff"
                                        labelStyle={styles.buttonLabel}
                                    >
                                        Play Again
                                    </Button>
                                </LinearGradient>
                                <Button
                                    mode="outlined"
                                    onPress={() => navigation.goBack()}
                                    style={styles.outlineButton}
                                    textColor={isDark ? '#667eea' : '#667eea'}
                                >
                                    Exit
                                </Button>
                            </View>
                        </Surface>
                    </Animated.View>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={isDark ? ['#311B92', '#1A237E'] : ['#667eea', '#4facfe']}
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <View style={styles.header}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="titleLarge" style={styles.headerTitle}>Force Simulator</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{displayTime}</Text>
                    </View>
                </View>

                <LinearGradient
                    colors={isDark ? ['#1E293B', '#0F172A'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                    style={styles.scoreCard}
                >
                    <View style={styles.scoreItem}>
                        <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                        <Text variant="titleMedium" style={styles.scoreLabel}>Score: {score}</Text>
                    </View>
                    <View style={styles.scoreItem}>
                        <Text variant="bodyMedium" style={styles.questionLabel}>Round {round}/5</Text>
                    </View>

                </LinearGradient>

                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.gameArea}>
                    <Surface style={styles.infoCard} elevation={4}>
                        <LinearGradient
                            colors={['#667eea', '#4facfe']}
                            style={styles.formulaBadge}
                        >
                            <Text variant="titleMedium" style={styles.formulaText}>
                                F = ma
                            </Text>
                        </LinearGradient>
                        <Text variant="bodyMedium" style={styles.instructionText}>
                            Predict the acceleration when force is applied!
                        </Text>
                    </Surface>

                    <Surface style={styles.simulationArea} elevation={3}>
                        <View style={styles.parameterRow}>
                            <LinearGradient
                                colors={['#667eea', '#4facfe']}
                                style={styles.parameterBadge}
                            >
                                <MaterialCommunityIcons name="arrow-right-bold" size={16} color="#fff" />
                                <Text variant="titleSmall" style={styles.parameterText}>Force: {force}N</Text>
                            </LinearGradient>
                            <LinearGradient
                                colors={['#4facfe', '#667eea']}
                                style={styles.parameterBadge}
                            >
                                <MaterialCommunityIcons name="weight-kilogram" size={16} color="#fff" />
                                <Text variant="titleSmall" style={styles.parameterText}>Mass: {mass}kg</Text>
                            </LinearGradient>
                        </View>

                        <View style={styles.track}>
                            <Animated.View style={[styles.object, animatedStyle]}>
                                <Text style={styles.objectEmoji}>📦</Text>
                            </Animated.View>
                        </View>

                        {showResult && (
                            <LinearGradient
                                colors={['#4CAF50', '#2E7D32']}
                                style={styles.resultBanner}
                            >
                                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                <View>
                                    <Text variant="bodyMedium" style={styles.resultText}>
                                        Actual: {calculateAcceleration().toFixed(2)} m/s²
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.resultText}>
                                        Yours: {prediction?.toFixed(2)} m/s²
                                    </Text>
                                </View>
                            </LinearGradient>
                        )}
                    </Surface>

                    {!showResult && (
                        <Surface style={styles.controlCard} elevation={3}>
                            <Text variant="titleSmall" style={styles.controlTitle}>
                                Predict Acceleration (m/s²):
                            </Text>
                            <View style={styles.predictionContainer}>
                                <IconButton
                                    icon="minus"
                                    size={24}
                                    iconColor={isDark ? '#667eea' : '#667eea'}
                                    onPress={() => setPrediction(Math.max(0, (prediction || 0) - 0.5))}
                                    style={styles.controlButton}
                                />
                                <LinearGradient
                                    colors={['#667eea', '#4facfe']}
                                    style={styles.predictionDisplay}
                                >
                                    <Text variant="headlineMedium" style={styles.predictionText}>
                                        {(prediction || 0).toFixed(1)}
                                    </Text>
                                </LinearGradient>
                                <IconButton
                                    icon="plus"
                                    size={24}
                                    iconColor={isDark ? '#667eea' : '#667eea'}
                                    onPress={() => setPrediction(Math.min(20, (prediction || 0) + 0.5))}
                                    style={styles.controlButton}
                                />
                            </View>
                            <LinearGradient
                                colors={['#667eea', '#4facfe']}
                                style={styles.submitButton}
                            >
                                <Button
                                    mode="text"
                                    onPress={submitPrediction}
                                    disabled={prediction === null}
                                    textColor="#fff"
                                    labelStyle={{ fontWeight: 'bold' }}
                                >
                                    Apply Force & Check
                                </Button>
                            </LinearGradient>
                        </Surface>
                    )}
                </Animated.View>
            </View>
        </LinearGradient>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    scoreCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: 16,
        elevation: 4,
    },
    scoreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    scoreLabel: {
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
    },
    questionLabel: {
        color: isDark ? '#CBD5E1' : '#666',
    },
    gameArea: {
        flex: 1,
        padding: spacing.md,
    },
    infoCard: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
    },
    formulaBadge: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
    },
    formulaText: {
        fontWeight: 'bold',
        color: '#fff',
    },
    instructionText: {
        color: isDark ? '#CBD5E1' : '#666',
        textAlign: 'center',
    },
    simulationArea: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255, 255, 255, 0.9)',
        minHeight: 200,
    },
    parameterRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.lg,
    },
    parameterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 12,
    },
    parameterText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    track: {
        height: 80,
        backgroundColor: isDark ? '#334155' : '#E0E0E0',
        borderRadius: 12,
        justifyContent: 'center',
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    object: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    objectEmoji: {
        fontSize: 40,
    },
    resultBanner: {
        padding: spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    resultText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    controlCard: {
        padding: spacing.lg,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.9)',
    },
    controlTitle: {
        marginBottom: spacing.md,
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
        textAlign: 'center',
    },
    predictionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    controlButton: {
        margin: 0,
    },
    predictionDisplay: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    predictionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    submitButton: {
        marginTop: spacing.sm,
        borderRadius: 12,
        overflow: 'hidden',
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    resultCard: {
        padding: spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.98)',
    },
    resultTitle: {
        fontWeight: 'bold',
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        color: isDark ? '#F1F5F9' : '#333',
    },
    scoreGradient: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 16,
        marginBottom: spacing.md,
    },
    scoreText: {
        fontWeight: 'bold',
        color: '#fff',
    },
    resultMessage: {
        marginBottom: spacing.xl,
        color: isDark ? '#CBD5E1' : '#666',
        fontSize: 18,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
        justifyContent: 'center',
    },
    gradientButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    outlineButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: isDark ? '#667eea' : '#667eea',
    },
});

export default ForcePlayGame;
