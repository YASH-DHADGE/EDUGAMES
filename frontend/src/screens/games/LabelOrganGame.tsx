import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
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

interface OrganLabel {
    id: string;
    name: string;
    x: number;
    y: number;
}

const ORGANS: OrganLabel[] = [
    { id: '1', name: 'Brain', x: 50, y: 10 },
    { id: '2', name: 'Heart', x: 50, y: 35 },
    { id: '3', name: 'Lungs', x: 50, y: 30 },
    { id: '4', name: 'Liver', x: 50, y: 45 },
    { id: '5', name: 'Stomach', x: 50, y: 50 },
    { id: '6', name: 'Kidneys', x: 50, y: 55 },
    { id: '7', name: 'Intestines', x: 50, y: 60 },
    { id: '8', name: 'Pancreas', x: 50, y: 48 },
];

const ALL_QUESTIONS = [
    { organ: 'Heart', correctId: '2', question: 'Which organ pumps blood throughout the body?' },
    { organ: 'Brain', correctId: '1', question: 'Which organ controls thinking and memory?' },
    { organ: 'Lungs', correctId: '3', question: 'Which organs help you breathe?' },
    { organ: 'Liver', correctId: '4', question: 'Which organ filters toxins from blood?' },
    { organ: 'Stomach', correctId: '5', question: 'Which organ digests food?' },
    { organ: 'Kidneys', correctId: '6', question: 'Which organs filter waste from blood?' },
    { organ: 'Intestines', correctId: '7', question: 'Which organ absorbs nutrients?' },
    { organ: 'Pancreas', correctId: '8', question: 'Which organ produces insulin?' },
    { organ: 'Brain', correctId: '1', question: 'What is the control center of the body?' },
    { organ: 'Heart', correctId: '2', question: 'What organ has four chambers?' },
    { organ: 'Lungs', correctId: '3', question: 'What organs exchange oxygen and carbon dioxide?' },
    { organ: 'Liver', correctId: '4', question: 'What is the largest internal organ?' },
    { organ: 'Kidneys', correctId: '6', question: 'What organs produce urine?' },
    { organ: 'Intestines', correctId: '7', question: 'What is the longest organ in the body?' },
    { organ: 'Pancreas', correctId: '8', question: 'What organ regulates blood sugar?' },
];

// Helper function to get organ image
const getOrganImage = (organName: string) => {
    const imageMap: Record<string, any> = {
        'Brain': require('../../../assets/images/organs/brain.png'),
        'Heart': require('../../../assets/images/organs/heart.png'),
        'Lungs': require('../../../assets/images/organs/lungs.png'),
        'Liver': require('../../../assets/images/organs/liver.png'),
        'Stomach': require('../../../assets/images/organs/stomach.png'),
        'Kidneys': require('../../../assets/images/organs/human_body.png'),
        'Intestines': require('../../../assets/images/organs/human_body.png'),
        'Pancreas': require('../../../assets/images/organs/human_body.png'),
    };
    return imageMap[organName] || require('../../../assets/images/organs/human_body.png');
};

const LabelOrganGame = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const { isDark } = useAppTheme();
    const styles = createStyles(isDark);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [questions, setQuestions] = useState<typeof ALL_QUESTIONS>([]);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    // Initialize with random questions
    useEffect(() => {
        const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, 10));
        startTimer();
        return () => stopTimer();
    }, []);

    const handleAnswer = (organId: string) => {
        setSelectedAnswer(organId);
        const correct = questions[currentQuestion].correctId === organId;

        if (correct) {
            setScore(score + 20);
        }

        setTimeout(() => {
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedAnswer(null);
            } else {
                const finalScore = correct ? score + 20 : score;
                const xpReward = Math.floor(finalScore / 5);
                addXP(xpReward, 'Label the Organ');
                setGameOver(true);
                stopTimer();
                saveGameResult({
                    gameId: 'label_organ',
                    score: finalScore,
                    maxScore: 200,
                    timeTaken: elapsedTime,
                    difficulty: 'medium',
                    completedLevel: 1
                });
            }
        }, 1000);
    };

    const resetGame = () => {
        setScore(0);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setGameOver(false);
        const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, 10));
        resetGameTimer();
        startTimer();
    };

    // ... (rest of the component)

    if (gameOver) {
        return (
            <LinearGradient
                colors={isDark ? ['#4A148C', '#880E4F'] : ['#f093fb', '#f5576c']}
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
                        <Text variant="titleLarge" style={styles.headerTitle}>Label the Organ</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View entering={BounceIn.duration(800)} style={styles.resultContainer}>
                        <Surface style={styles.resultCard} elevation={5}>
                            <Animated.View entering={ZoomIn.delay(200)}>
                                <MaterialCommunityIcons
                                    name={score >= 160 ? "trophy" : score >= 120 ? "heart-pulse" : "human"}
                                    size={80}
                                    color={score >= 160 ? "#FFD700" : score >= 120 ? "#f5576c" : "#f093fb"}
                                />
                            </Animated.View>
                            <Text variant="headlineMedium" style={styles.resultTitle}>Quiz Complete!</Text>
                            <LinearGradient
                                colors={score >= 160 ? ['#FFD700', '#FFA000'] : score >= 120 ? ['#f5576c', '#c62828'] : ['#f093fb', '#f5576c']}
                                style={styles.scoreGradient}
                            >
                                <Text variant="displaySmall" style={styles.scoreText}>{score}/200</Text>
                            </LinearGradient>
                            <Text variant="titleMedium" style={{ marginBottom: 10, color: '#333' }}>Time: {displayTime}</Text>
                            <Text variant="bodyLarge" style={styles.resultMessage}>
                                {score >= 160 ? 'Anatomy Expert! 🏥' : score >= 120 ? 'Well Done! ❤️' : 'Keep Learning! 📚'}
                            </Text>
                            <View style={styles.buttonRow}>
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
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
                                    textColor={isDark ? '#f093fb' : '#f5576c'}
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

    if (questions.length === 0) {
        return null;
    }

    const currentQ = questions[currentQuestion];

    return (
        <LinearGradient
            colors={isDark ? ['#4A148C', '#880E4F'] : ['#f093fb', '#f5576c']}
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
                    <Text variant="titleLarge" style={styles.headerTitle}>Label the Organ</Text>
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
                        <Text variant="bodyMedium" style={styles.questionLabel}>Question {currentQuestion + 1}/{questions.length}</Text>
                    </View>

                </LinearGradient>

                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.gameArea}>
                    <Surface style={styles.questionCard} elevation={4}>
                        <Text variant="titleLarge" style={styles.questionText}>
                            {currentQ.question}
                        </Text>
                    </Surface>

                    <View style={styles.organDisplay}>
                        <Image
                            source={getOrganImage(currentQ.organ)}
                            style={styles.organImage}
                            resizeMode="contain"
                        />
                        <Text variant="bodySmall" style={styles.instructionText}>
                            Select the correct organ below
                        </Text>
                    </View>

                    <View style={styles.optionsContainer}>
                        {ORGANS.slice(0, 4).map((organ, index) => {
                            const isSelected = selectedAnswer === organ.id;
                            const isCorrect = organ.id === currentQ.correctId;

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
                                                size={20}
                                                color="#fff"
                                            />
                                            <Text style={styles.selectedOptionText}>{organ.name}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <Button
                                            mode="outlined"
                                            onPress={() => handleAnswer(organ.id)}
                                            style={styles.optionButton}
                                            contentStyle={styles.optionContent}
                                            disabled={selectedAnswer !== null}
                                            textColor="#fff"
                                            labelStyle={styles.optionLabel}
                                        >
                                            {organ.name}
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
    questionCard: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.95)',
        elevation: 3,
    },
    questionText: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#333',
    },
    organDisplay: {
        height: 300,
        backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        padding: spacing.md,
        elevation: 2,
    },
    organImage: {
        width: '100%',
        height: 250,
        marginBottom: spacing.sm,
    },
    instructionText: {
        color: isDark ? '#CBD5E1' : '#666',
        fontStyle: 'italic',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    optionWrapper: {
        width: '48%',
    },
    optionButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    optionContent: {
        paddingVertical: spacing.sm,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    selectedOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: 12,
        gap: spacing.xs,
    },
    selectedOptionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
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
        borderColor: isDark ? '#f093fb' : '#f5576c',
    },
});

export default LabelOrganGame;
