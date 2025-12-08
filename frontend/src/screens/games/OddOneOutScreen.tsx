import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import Animated, { FadeInDown, FadeIn, BounceIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

interface Question {
    question: string;
    options: string[];
    oddOneIndex: number;
    category: string;
    explanation: string;
}

const EDUCATIONAL_QUESTIONS: Question[] = [
    {
        question: 'Which one is NOT a prime number?',
        options: ['2', '3', '9', '5', '7', '11', '13', '17', '19'],
        oddOneIndex: 2,
        category: 'Math',
        explanation: '9 is not prime because it can be divided by 3'
    },
    {
        question: 'Which one is NOT a planet?',
        options: ['Mars', 'Venus', 'Sun', 'Earth', 'Jupiter', 'Saturn', 'Neptune', 'Uranus', 'Mercury'],
        oddOneIndex: 2,
        category: 'Science',
        explanation: 'The Sun is a star, not a planet'
    },
    {
        question: 'Which one is NOT a mammal?',
        options: ['Dog', 'Cat', 'Snake', 'Elephant', 'Whale', 'Bat', 'Human', 'Dolphin', 'Lion'],
        oddOneIndex: 2,
        category: 'Biology',
        explanation: 'Snake is a reptile, not a mammal'
    },
    {
        question: 'Which one is NOT an even number?',
        options: ['2', '4', '7', '6', '8', '10', '12', '14', '16'],
        oddOneIndex: 2,
        category: 'Math',
        explanation: '7 is an odd number'
    },
    {
        question: 'Which one is NOT a state of matter?',
        options: ['Solid', 'Liquid', 'Energy', 'Gas', 'Plasma', 'Solid', 'Liquid', 'Gas', 'Plasma'],
        oddOneIndex: 2,
        category: 'Physics',
        explanation: 'Energy is not a state of matter'
    },
    {
        question: 'Which one is NOT a vowel?',
        options: ['A', 'E', 'B', 'I', 'O', 'U', 'A', 'E', 'I'],
        oddOneIndex: 2,
        category: 'Language',
        explanation: 'B is a consonant, not a vowel'
    },
    {
        question: 'Which one is NOT a metal?',
        options: ['Iron', 'Gold', 'Oxygen', 'Silver', 'Copper', 'Aluminum', 'Zinc', 'Iron', 'Gold'],
        oddOneIndex: 2,
        category: 'Chemistry',
        explanation: 'Oxygen is a gas, not a metal'
    },
    {
        question: 'Which one is NOT a shape with 4 sides?',
        options: ['Square', 'Rectangle', 'Triangle', 'Rhombus', 'Trapezoid', 'Square', 'Rectangle', 'Rhombus', 'Parallelogram'],
        oddOneIndex: 2,
        category: 'Geometry',
        explanation: 'Triangle has 3 sides, not 4'
    },
];

const OddOneOutScreen = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameActive, setGameActive] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    const styles = createStyles(isDark);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameActive && timeLeft > 0) {
            startTimer();
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        endGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            stopTimer();
        }
        return () => {
            clearInterval(interval);
            stopTimer();
        };
    }, [gameActive, timeLeft]);

    const handleAnswer = (index: number) => {
        if (!gameActive || selectedAnswer !== null) return;

        setSelectedAnswer(index);
        const question = EDUCATIONAL_QUESTIONS[currentQuestion];
        const correct = index === question.oddOneIndex;

        if (correct) {
            setScore((prev) => prev + 10);
        }

        setShowExplanation(true);

        setTimeout(() => {
            if (currentQuestion < EDUCATIONAL_QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedAnswer(null);
                setShowExplanation(false);
            } else {
                const finalScore = correct ? score + 10 : score;
                endGame(finalScore);
            }
        }, 2000);
    };

    const endGame = (finalScore?: number) => {
        setGameActive(false);
        setGameOver(true);
        stopTimer();
        const endScore = finalScore !== undefined ? finalScore : score;
        const xpReward = Math.floor(endScore / 2);
        addXP(xpReward, 'Odd One Out');

        saveGameResult({
            gameId: 'odd_one_out',
            score: endScore,
            maxScore: EDUCATIONAL_QUESTIONS.length * 10,
            timeTaken: elapsedTime,
            difficulty: 'easy',
            completedLevel: 1
        });
    };

    const resetGame = () => {
        setCurrentQuestion(0);
        setScore(0);
        setTimeLeft(60);
        setGameActive(true);
        setGameOver(false);
        setSelectedAnswer(null);
        setShowExplanation(false);
        resetGameTimer();
    };

    if (gameOver) {
        return (
            <LinearGradient
                colors={['#30cfd0', '#330867']}
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
                        <Text variant="titleLarge" style={styles.headerTitle}>Odd One Out</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View entering={BounceIn.duration(800)} style={styles.resultContainer}>
                        <Surface style={styles.resultCard} elevation={5}>
                            <Animated.View entering={ZoomIn.delay(200)}>
                                <MaterialCommunityIcons
                                    name={score >= 60 ? "trophy" : score >= 40 ? "star" : "book-open-variant"}
                                    size={80}
                                    color={score >= 60 ? "#FFD700" : score >= 40 ? "#4CAF50" : "#30cfd0"}
                                />
                            </Animated.View>
                            <Text variant="headlineMedium" style={styles.resultTitle}>Game Complete!</Text>
                            <LinearGradient
                                colors={score >= 60 ? ['#FFD700', '#FFA000'] : score >= 40 ? ['#4CAF50', '#2E7D32'] : ['#30cfd0', '#330867']}
                                style={styles.scoreGradient}
                            >
                                <Text variant="displaySmall" style={styles.scoreText}>{score}</Text>
                            </LinearGradient>
                            <Text variant="titleMedium" style={{ marginBottom: 10, color: isDark ? '#F1F5F9' : '#333' }}>Time: {displayTime}</Text>
                            <Text variant="bodyLarge" style={styles.resultMessage}>
                                {score >= 60 ? 'Excellent! 🎉' : score >= 40 ? 'Good Job! 👍' : 'Keep Learning! 📚'}
                            </Text>
                            <View style={styles.buttonRow}>
                                <LinearGradient
                                    colors={['#30cfd0', '#330867']}
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
                                    textColor="#30cfd0"
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

    const question = EDUCATIONAL_QUESTIONS[currentQuestion];

    return (
        <LinearGradient
            colors={['#30cfd0', '#330867']}
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
                    <Text variant="titleLarge" style={styles.headerTitle}>Odd One Out</Text>
                    <View style={{ width: 40 }} />
                </View>

                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                    style={styles.statsCard}
                >
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                        <Text variant="titleMedium" style={styles.statLabel}>Score: {score}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={timeLeft < 20 ? "#f44336" : "#30cfd0"} />
                        <Text variant="titleMedium" style={[styles.statLabel, timeLeft < 20 && { color: '#f44336' }]}>
                            Left: {timeLeft}s (Time: {displayTime})
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="help-circle" size={20} color="#30cfd0" />
                        <Text variant="bodyMedium" style={styles.statLabel}>{currentQuestion + 1}/{EDUCATIONAL_QUESTIONS.length}</Text>
                    </View>
                </LinearGradient>

                <ScrollView style={styles.gameArea} contentContainerStyle={styles.scrollContent}>
                    <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                        <Surface style={styles.questionCard} elevation={4}>
                            <LinearGradient
                                colors={['#30cfd0', '#330867']}
                                style={styles.categoryBadge}
                            >
                                <Text variant="bodySmall" style={styles.categoryText}>{question.category}</Text>
                            </LinearGradient>
                            <Text variant="titleLarge" style={styles.questionText}>
                                {question.question}
                            </Text>
                        </Surface>

                        <View style={styles.optionsGrid}>
                            {question.options.map((option, index) => {
                                const isSelected = selectedAnswer === index;
                                const isCorrect = index === question.oddOneIndex;

                                return (
                                    <Animated.View
                                        key={index}
                                        entering={FadeIn.delay(index * 50)}
                                        style={styles.optionWrapper}
                                    >
                                        {isSelected ? (
                                            <LinearGradient
                                                colors={isCorrect ? ['#4CAF50', '#2E7D32'] : ['#f44336', '#c62828']}
                                                style={styles.selectedOption}
                                            >
                                                <MaterialCommunityIcons
                                                    name={isCorrect ? "check-circle" : "close-circle"}
                                                    size={16}
                                                    color="#fff"
                                                />
                                                <Text style={styles.selectedOptionText}>{option}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <Button
                                                mode="outlined"
                                                onPress={() => handleAnswer(index)}
                                                style={styles.optionButton}
                                                contentStyle={styles.optionContent}
                                                disabled={selectedAnswer !== null}
                                                textColor="#fff"
                                                labelStyle={styles.optionLabel}
                                            >
                                                {option}
                                            </Button>
                                        )}
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {showExplanation && (
                            <Animated.View entering={FadeIn.duration(400)}>
                                <Surface style={styles.explanationCard} elevation={3}>
                                    <Text variant="titleSmall" style={[
                                        styles.explanationTitle,
                                        { color: selectedAnswer === question.oddOneIndex ? '#4CAF50' : '#f44336' }
                                    ]}>
                                        {selectedAnswer === question.oddOneIndex ? '✓ Correct!' : '✗ Incorrect'}
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.explanationText}>
                                        {question.explanation}
                                    </Text>
                                </Surface>
                            </Animated.View>
                        )}
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
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: 16,
        elevation: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    statLabel: {
        fontWeight: 'bold',
        color: '#333',
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
        elevation: 3,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        marginBottom: spacing.sm,
    },
    categoryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    questionText: {
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
        textAlign: 'center',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    optionWrapper: {
        width: '31%',
    },
    optionButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.1)',
        minHeight: 50,
    },
    optionContent: {
        paddingVertical: spacing.xs,
    },
    optionLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    selectedOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        borderRadius: 12,
        gap: spacing.xs,
        minHeight: 50,
    },
    selectedOptionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    explanationCard: {
        padding: spacing.md,
        borderRadius: 16,
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
    },
    explanationTitle: {
        fontWeight: 'bold',
        marginBottom: spacing.xs,
    },
    explanationText: {
        color: isDark ? '#CBD5E1' : '#666',
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
        borderColor: '#30cfd0',
    },
});

export default OddOneOutScreen;
