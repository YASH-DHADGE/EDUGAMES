import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, useTheme, IconButton, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import Animated, { FadeInDown, BounceIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

interface ChemicalEquation {
    equation: string;
    reactants: { element: string; coefficient: number }[];
    products: { element: string; coefficient: number }[];
    solution: number[];
}

const EQUATIONS: ChemicalEquation[] = [
    {
        equation: 'H₂ + O₂ → H₂O',
        reactants: [{ element: 'H₂', coefficient: 2 }, { element: 'O₂', coefficient: 1 }],
        products: [{ element: 'H₂O', coefficient: 2 }],
        solution: [2, 1, 2]
    },
    {
        equation: 'N₂ + H₂ → NH₃',
        reactants: [{ element: 'N₂', coefficient: 1 }, { element: 'H₂', coefficient: 3 }],
        products: [{ element: 'NH₃', coefficient: 2 }],
        solution: [1, 3, 2]
    },
    {
        equation: 'CH₄ + O₂ → CO₂ + H₂O',
        reactants: [{ element: 'CH₄', coefficient: 1 }, { element: 'O₂', coefficient: 2 }],
        products: [{ element: 'CO₂', coefficient: 1 }, { element: 'H₂O', coefficient: 2 }],
        solution: [1, 2, 1, 2]
    },
];

const ChemistryBalanceGame = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const { isDark } = useAppTheme();
    const styles = createStyles(isDark);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswer, setUserAnswer] = useState<number[]>([1, 1, 1, 1]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    React.useEffect(() => {
        startTimer();
        return () => stopTimer();
    }, []);

    const checkAnswer = () => {
        const current = EQUATIONS[currentQuestion];
        const correct = JSON.stringify(userAnswer.slice(0, current.solution.length)) === JSON.stringify(current.solution);

        setShowFeedback(true);

        if (correct) {
            setScore(score + 25);
        }

        setTimeout(() => {
            if (currentQuestion < EQUATIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setUserAnswer([1, 1, 1, 1]);
                setShowFeedback(false);
            } else {
                const finalScore = correct ? score + 25 : score;
                const xpReward = Math.floor(finalScore / 3);
                addXP(xpReward, 'Chemistry Balance Game');
                stopTimer();
                setGameOver(true);

                saveGameResult({
                    gameId: 'chemistry_balance',
                    score: finalScore,
                    maxScore: 75,
                    timeTaken: elapsedTime,
                    difficulty: 'hard',
                    completedLevel: 1
                });
            }
        }, 1500);
    };

    const updateCoefficient = (index: number, value: number) => {
        const newAnswer = [...userAnswer];
        newAnswer[index] = Math.max(1, Math.min(value, 9));
        setUserAnswer(newAnswer);
    };

    const resetGame = () => {
        setCurrentQuestion(0);
        setUserAnswer([1, 1, 1, 1]);
        setScore(0);
        setGameOver(false);
        setShowFeedback(false);
        resetGameTimer();
        startTimer();
    };

    // ... (rest of the component)

    if (gameOver) {
        return (
            <LinearGradient
                colors={isDark ? ['#0288D1', '#01579B'] : ['#4facfe', '#00f2fe']}
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
                        <Text variant="titleLarge" style={styles.headerTitle}>Balance Equations</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View entering={BounceIn.duration(800)} style={styles.resultContainer}>
                        <Surface style={styles.resultCard} elevation={5}>
                            <Animated.View entering={ZoomIn.delay(200)}>
                                <MaterialCommunityIcons
                                    name={score >= 60 ? "flask" : score >= 40 ? "atom" : "test-tube"}
                                    size={80}
                                    color={score >= 60 ? "#FFD700" : score >= 40 ? "#4facfe" : "#00f2fe"}
                                />
                            </Animated.View>
                            <Text variant="headlineMedium" style={styles.resultTitle}>Game Complete!</Text>
                            <LinearGradient
                                colors={score >= 60 ? ['#FFD700', '#FFA000'] : score >= 40 ? ['#4facfe', '#00f2fe'] : ['#00f2fe', '#4facfe']}
                                style={styles.scoreGradient}
                            >
                                <Text variant="displaySmall" style={styles.scoreText}>{score}/75</Text>
                            </LinearGradient>
                            <Text variant="titleMedium" style={{ marginBottom: 15, color: isDark ? '#F1F5F9' : '#333' }}>Time: {displayTime}</Text>

                            <Text variant="bodyLarge" style={styles.resultMessage}>
                                {score >= 60 ? 'Chemistry Master! 🧪' : score >= 40 ? 'Good Work! ⚗️' : 'Keep Learning! 📚'}
                            </Text>
                            <View style={styles.buttonRow}>
                                <LinearGradient
                                    colors={['#4facfe', '#00f2fe']}
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
                                    textColor={isDark ? '#4facfe' : '#4facfe'}
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

    const current = EQUATIONS[currentQuestion];
    const isCorrect = showFeedback && JSON.stringify(userAnswer.slice(0, current.solution.length)) === JSON.stringify(current.solution);

    return (
        <LinearGradient
            colors={isDark ? ['#0288D1', '#01579B'] : ['#4facfe', '#00f2fe']}
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
                    <Text variant="titleLarge" style={styles.headerTitle}>Balance Equations</Text>
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
                        <Text variant="bodyMedium" style={styles.questionLabel}>Question {currentQuestion + 1}/{EQUATIONS.length}</Text>
                    </View>

                </LinearGradient>

                <ScrollView style={styles.gameArea} contentContainerStyle={styles.scrollContent}>
                    <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                        <Surface style={styles.questionCard} elevation={4}>
                            <Text variant="titleMedium" style={styles.instructionText}>
                                Balance the chemical equation:
                            </Text>
                            <Text variant="headlineSmall" style={styles.equationText}>
                                {current.equation}
                            </Text>
                        </Surface>

                        <Surface style={styles.workArea} elevation={3}>
                            <Text variant="titleSmall" style={styles.workTitle}>Your Answer:</Text>

                            <View style={styles.coefficientRow}>
                                {current.solution.map((_, index) => (
                                    <View key={index} style={styles.coefficientControl}>
                                        <IconButton
                                            icon="plus"
                                            size={20}
                                            iconColor="#4facfe"
                                            onPress={() => updateCoefficient(index, userAnswer[index] + 1)}
                                            disabled={showFeedback}
                                            style={styles.controlButton}
                                        />
                                        <LinearGradient
                                            colors={['#4facfe', '#00f2fe']}
                                            style={styles.coefficientChip}
                                        >
                                            <Text variant="titleLarge" style={styles.coefficientText}>{userAnswer[index]}</Text>
                                        </LinearGradient>
                                        <IconButton
                                            icon="minus"
                                            size={20}
                                            iconColor="#4facfe"
                                            onPress={() => updateCoefficient(index, userAnswer[index] - 1)}
                                            disabled={showFeedback}
                                            style={styles.controlButton}
                                        />
                                    </View>
                                ))}
                            </View>

                            {showFeedback && (
                                <LinearGradient
                                    colors={isCorrect ? ['#4CAF50', '#2E7D32'] : ['#f44336', '#c62828']}
                                    style={styles.feedbackCard}
                                >
                                    <MaterialCommunityIcons
                                        name={isCorrect ? "check-circle" : "close-circle"}
                                        size={24}
                                        color="#fff"
                                    />
                                    <Text variant="titleMedium" style={styles.feedbackText}>
                                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                                    </Text>
                                </LinearGradient>
                            )}

                            {!showFeedback && (
                                <LinearGradient
                                    colors={['#4facfe', '#00f2fe']}
                                    style={styles.submitButton}
                                >
                                    <Button
                                        mode="text"
                                        onPress={checkAnswer}
                                        textColor="#fff"
                                        labelStyle={{ fontWeight: 'bold' }}
                                    >
                                        Check Answer
                                    </Button>
                                </LinearGradient>
                            )}
                        </Surface>
                    </Animated.View>
                </ScrollView>
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
    },
    scrollContent: {
        padding: spacing.md,
    },
    questionCard: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
    },
    instructionText: {
        marginBottom: spacing.sm,
        color: isDark ? '#CBD5E1' : '#666',
    },
    equationText: {
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
        textAlign: 'center',
    },
    workArea: {
        padding: spacing.lg,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255, 255, 255, 0.9)',
    },
    workTitle: {
        marginBottom: spacing.md,
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
    },
    coefficientRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.lg,
    },
    coefficientControl: {
        alignItems: 'center',
    },
    controlButton: {
        margin: 0,
    },
    coefficientChip: {
        marginVertical: spacing.xs,
        minWidth: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coefficientText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    submitButton: {
        marginTop: spacing.md,
        borderRadius: 12,
        overflow: 'hidden',
    },
    feedbackCard: {
        padding: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: spacing.md,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    feedbackText: {
        color: '#fff',
        fontWeight: 'bold',
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
        borderColor: '#4facfe',
    },
});

export default ChemistryBalanceGame;
