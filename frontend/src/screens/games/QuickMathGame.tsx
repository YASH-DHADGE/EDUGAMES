import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import Animated, { FadeInDown, FadeIn, BounceIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { soundManager } from '../../utils/soundEffects';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

interface MathQuestion {
    question: string;
    answer: number;
    options: number[];
}

const generateQuestion = (difficulty: number): MathQuestion => {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    const max = 10 + (difficulty * 5);
    const num1 = Math.floor(Math.random() * max) + 1;
    const num2 = Math.floor(Math.random() * max) + 1;

    let answer: number;
    let question: string;

    switch (operation) {
        case '+':
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
            break;
        case '-':
            answer = Math.max(num1, num2) - Math.min(num1, num2);
            question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
            break;
        case '×':
            const smallNum1 = Math.floor(Math.random() * 12) + 1;
            const smallNum2 = Math.floor(Math.random() * 12) + 1;
            answer = smallNum1 * smallNum2;
            question = `${smallNum1} × ${smallNum2}`;
            break;
        default:
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
    }

    // Generate wrong options
    const options = [answer];
    while (options.length < 4) {
        const wrongAnswer = answer + Math.floor(Math.random() * 20) - 10;
        if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }

    return {
        question,
        answer,
        options: options.sort(() => Math.random() - 0.5)
    };
};

const QuickMathGame = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [difficulty, setDifficulty] = useState(1);
    const [currentQuestion, setCurrentQuestion] = useState<MathQuestion>(generateQuestion(1));
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameOver, setGameOver] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    const styles = createStyles(isDark);

    // Initialize sounds
    useEffect(() => {
        soundManager.initialize();
        return () => {
            soundManager.cleanup();
        };
    }, []);

    useEffect(() => {
        if (timeLeft > 0 && !gameOver) {
            startTimer();
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            stopTimer(); // Stop counting up
            // Award XP based on score
            const xpReward = Math.floor(score / 2); // 5 XP per correct answer at level 1
            addXP(xpReward, 'Quick Math Game');
            soundManager.playSuccess();
            setGameOver(true);

            saveGameResult({
                gameId: 'quick_math',
                score: score,
                maxScore: 1000,
                timeTaken: elapsedTime,
                difficulty: difficulty.toString(),
                completedLevel: 1
            });
        }
    }, [timeLeft, gameOver]);

    const handleAnswer = async (answer: number) => {
        setSelectedAnswer(answer);
        const correct = answer === currentQuestion.answer;

        if (correct) {
            await soundManager.playCorrect();
            setScore(score + (10 * difficulty));
            setQuestionCount(questionCount + 1);

            // Increase difficulty every 5 questions
            if ((questionCount + 1) % 5 === 0) {
                setDifficulty(Math.min(difficulty + 1, 5));
            }
        } else {
            await soundManager.playWrong();
            // Penalty for wrong answer
            setTimeLeft(Math.max(0, timeLeft - 5));
        }

        setTimeout(() => {
            setCurrentQuestion(generateQuestion(difficulty));
            setSelectedAnswer(null);
        }, 500);
    };

    const resetGame = () => {
        soundManager.playClick();
        setScore(0);
        setQuestionCount(0);
        setDifficulty(1);
        setTimeLeft(30);
        setGameOver(false);
        setGameOver(false);
        setCurrentQuestion(generateQuestion(1));
        setSelectedAnswer(null);
        setCurrentQuestion(generateQuestion(1));
        setSelectedAnswer(null);
        resetGameTimer();
    };

    if (gameOver) {
        return (
            <LinearGradient
                colors={['#ffecd2', '#fcb69f']}
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
                        <Text variant="titleLarge" style={styles.headerTitle}>Quick Math</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View entering={BounceIn.duration(800)} style={styles.resultContainer}>
                        <Surface style={styles.resultCard} elevation={5}>
                            <Animated.View entering={ZoomIn.delay(200)}>
                                <MaterialCommunityIcons
                                    name="calculator"
                                    size={80}
                                    color="#FF9800"
                                />
                            </Animated.View>
                            <Text variant="headlineMedium" style={styles.resultTitle}>Time's Up!</Text>
                            <LinearGradient
                                colors={['#FF9800', '#F57C00']}
                                style={styles.scoreGradient}
                            >
                                <Text variant="displaySmall" style={styles.scoreText}>{score}</Text>
                            </LinearGradient>
                            <Text variant="titleMedium" style={{ marginBottom: 10, color: isDark ? '#F1F5F9' : '#333' }}>Time: {displayTime}</Text>
                            <Text variant="bodyLarge" style={styles.resultMessage}>
                                Questions Solved: {questionCount}
                            </Text>
                            <Text variant="bodyMedium" style={styles.difficultyText}>
                                Difficulty Level: {difficulty}
                            </Text>
                            <View style={styles.buttonRow}>
                                <LinearGradient
                                    colors={['#ffecd2', '#fcb69f']}
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
                                    textColor="#FF9800"
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
            colors={['#ffecd2', '#fcb69f']}
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
                    <Text variant="titleLarge" style={styles.headerTitle}>Quick Math</Text>
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
                        <MaterialCommunityIcons name="clock-outline" size={20} color={timeLeft < 10 ? "#f44336" : "#FF9800"} />
                        <Text variant="titleMedium" style={[styles.statLabel, timeLeft < 10 && { color: '#f44336' }]}>
                            {timeLeft}s
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="speedometer" size={20} color="#FF9800" />
                        <Text variant="bodyMedium" style={styles.statLabel}>Level: {difficulty}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.progressContainer}>
                    <LinearGradient
                        colors={timeLeft < 10 ? ['#f44336', '#c62828'] : ['#FF9800', '#F57C00']}
                        style={[styles.progressBar, { width: `${(timeLeft / 30) * 100}%` }]}
                    />
                </View>

                <Animated.View entering={FadeIn.duration(400)} style={styles.gameArea}>
                    <Surface style={styles.questionCard} elevation={4}>
                        <Text variant="displayMedium" style={styles.questionText}>
                            {currentQuestion.question} = ?
                        </Text>
                    </Surface>

                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedAnswer === option;
                            const isCorrect = option === currentQuestion.answer;

                            return (
                                <Animated.View
                                    key={index}
                                    entering={FadeIn.delay(index * 100)}
                                    style={styles.optionWrapper}
                                >
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={isCorrect ? ['#4CAF50', '#2E7D32'] : ['#f44336', '#c62828']}
                                            style={styles.selectedOption}
                                        >
                                            <MaterialCommunityIcons
                                                name={isCorrect ? "check-circle" : "close-circle"}
                                                size={24}
                                                color="#fff"
                                            />
                                            <Text style={styles.selectedOptionText}>{option}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <Button
                                            mode="outlined"
                                            onPress={() => handleAnswer(option)}
                                            style={styles.optionButton}
                                            contentStyle={styles.optionContent}
                                            disabled={selectedAnswer !== null}
                                            textColor="#E65100"
                                            labelStyle={styles.optionLabel}
                                        >
                                            {option}
                                        </Button>
                                    )}
                                </Animated.View>
                            );
                        })}
                    </View>
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
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
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
    progressContainer: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: spacing.md,
        borderRadius: 4,
        marginBottom: spacing.lg,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    gameArea: {
        flex: 1,
        paddingHorizontal: spacing.md,
    },
    questionCard: {
        padding: spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: spacing.xl,
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
    },
    questionText: {
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#E65100',
    },
    optionsContainer: {
        gap: spacing.md,
    },
    optionWrapper: {
        width: '100%',
    },
    optionButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    optionContent: {
        paddingVertical: spacing.md,
    },
    optionLabel: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    selectedOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: 12,
        gap: spacing.sm,
    },
    selectedOptionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 20,
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
        marginBottom: spacing.sm,
        color: isDark ? '#CBD5E1' : '#666',
        fontSize: 16,
    },
    difficultyText: {
        marginBottom: spacing.xl,
        color: isDark ? '#94A3B8' : '#999',
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
        borderColor: '#FF9800',
    },
});

export default QuickMathGame;
