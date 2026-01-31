import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { getRandomQuiz, Quiz } from '../services/quizzesService';
import QuizOptionButton from '../components/QuizOptionButton';
import { useResponsive } from '../hooks/useResponsive';
import { spacing } from '../theme';
import Animated, { FadeInRight, SlideInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { soundManager } from '../utils/soundEffects';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

import { useAppTheme } from '../context/ThemeContext';
import ScreenBackground from '../components/ScreenBackground';

const QuizScreen = ({ navigation, route }: any) => {
    const { isDark } = useAppTheme();
    const paperTheme = useTheme();
    const insets = useSafeAreaInsets();
    const { containerStyle, isMobile } = useResponsive();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAnswered, setIsAnswered] = useState(false);
    const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

    const { quizData, previewMode } = (route.params as any) || {};

    useEffect(() => {
        loadQuiz();
        soundManager.initialize();
        return () => {
            soundManager.cleanup();
        };
    }, []);

    const loadQuiz = async () => {
        setLoading(true);
        try {
            if (quizData) {
                let fullQuizData = quizData;

                // If questions are missing, fetch the full quiz
                if (!quizData.questions && quizData.quizId) {
                    try {
                        const response = await api.get(`/student/quiz/${quizData.quizId}`);
                        fullQuizData = response.data;
                    } catch (err) {
                        console.error('Failed to fetch full quiz details', err);
                    }
                }

                if (fullQuizData.questions) {
                    const formattedQuiz: Quiz = {
                        id: fullQuizData._id || fullQuizData.id,
                        title: fullQuizData.title,
                        questions: fullQuizData.questions,
                    };
                    setQuiz(formattedQuiz);
                    setUserAnswers(new Array(formattedQuiz.questions.length).fill(null));
                } else {
                    // Fallback or error handling if still no questions
                    console.error('Quiz data missing questions even after fetch attempt');
                }
            } else {
                const randomQuiz = await getRandomQuiz();
                setQuiz(randomQuiz);
                if (randomQuiz) {
                    setUserAnswers(new Array(randomQuiz.questions.length).fill(null));
                }
            }
        } catch (error) {
            console.error('Failed to load quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = async (index: number) => {
        if (isAnswered) return;

        setSelectedOptionIndex(index);
        setIsAnswered(true);

        // Record user answer
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = index;
        setUserAnswers(newAnswers);

        const currentQuestion = quiz!.questions[currentQuestionIndex];
        const isCorrect = index === currentQuestion.correctIndex;

        if (isCorrect) {
            await soundManager.playCorrect();
            setScore(score + 1);
        } else {
            await soundManager.playWrong();
        }
    };

    const handleNext = () => {
        soundManager.playClick();
        if (!quiz) return;

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOptionIndex(null);
            setIsAnswered(false);
        } else {
            finishQuiz(score);
        }
    };

    const finishQuiz = (finalScore: number) => {
        soundManager.playSuccess();
        navigation.replace('QuizResult', {
            score: finalScore,
            totalQuestions: quiz?.questions.length || 0,
            correctAnswers: finalScore,
            quizId: quiz?.id,
            questions: quiz?.questions,
            userAnswers: userAnswers,
            title: quiz?.title,
            assignmentId: quizData?.assignmentId,
        });
    };

    if (loading) {
        return (
            <ScreenBackground style={styles.centerContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={{ marginTop: 16, color: isDark ? '#ccc' : '#666' }}>Loading Quiz...</Text>
            </ScreenBackground>
        );
    }

    if (!quiz || quiz.questions.length === 0) {
        return (
            <ScreenBackground style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={isDark ? '#ccc' : '#666'} />
                <Text style={{ marginTop: 16, color: isDark ? '#fff' : '#000' }}>No questions available.</Text>
                <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
                    Go Back
                </Button>
            </ScreenBackground>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = (currentQuestionIndex + 1) / quiz.questions.length;
    const isCorrect = selectedOptionIndex === currentQuestion.correctIndex;

    return (
        <ScreenBackground style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.content, containerStyle, { maxWidth: 800, alignSelf: 'center', width: '100%', paddingHorizontal: isMobile ? spacing.md : spacing.xl }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    style={[styles.headerBackground, { paddingTop: insets.top + spacing.md }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text variant="titleMedium" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700' }}>
                                    Question {currentQuestionIndex + 1}
                                </Text>
                                <Text variant="titleMedium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    / {quiz.questions.length}
                                </Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* Question Card */}
                <Animated.View
                    key={currentQuestionIndex}
                    entering={FadeInRight.duration(400)}
                >
                    <Surface style={[styles.questionCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#fff' }]} elevation={2}>
                        <Text variant="headlineSmall" style={[styles.questionText, { color: isDark ? '#fff' : '#333' }]}>
                            {currentQuestion.question}
                        </Text>
                    </Surface>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            let status: 'correct' | 'wrong' | 'none' = 'none';
                            if (isAnswered) {
                                if (index === currentQuestion.correctIndex) {
                                    status = 'correct';
                                } else if (index === selectedOptionIndex) {
                                    status = 'wrong';
                                }
                            }

                            return (
                                <QuizOptionButton
                                    key={index}
                                    text={option}
                                    isSelected={selectedOptionIndex === index}
                                    onPress={() => handleOptionSelect(index)}
                                    index={index}
                                    status={status}
                                    disabled={isAnswered}
                                />
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Feedback & Next Button */}
                {isAnswered && (
                    <Animated.View
                        entering={SlideInDown.springify()}
                        style={styles.feedbackSection}
                    >
                        <Surface style={[
                            styles.feedbackCard,
                            { borderLeftColor: isCorrect ? '#4CAF50' : '#F44336', backgroundColor: isDark ? '#1E293B' : '#fff' }
                        ]} elevation={4}>
                            <View style={styles.feedbackContent}>
                                <View style={styles.feedbackHeader}>
                                    <MaterialCommunityIcons
                                        name={isCorrect ? "check-circle" : "close-circle"}
                                        size={24}
                                        color={isCorrect ? "#4CAF50" : "#F44336"}
                                    />
                                    <Text variant="titleMedium" style={{
                                        color: isCorrect ? "#4CAF50" : "#F44336",
                                        fontWeight: 'bold',
                                        marginLeft: 8
                                    }}>
                                        {isCorrect ? "Correct!" : "Incorrect"}
                                    </Text>
                                </View>
                                {!isCorrect && (
                                    <Text variant="bodyMedium" style={{ marginTop: 4, color: isDark ? '#ccc' : '#666' }}>
                                        The correct answer is: <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#000' }}>{currentQuestion.options[currentQuestion.correctIndex]}</Text>
                                    </Text>
                                )}
                            </View>
                            <Button
                                mode="contained"
                                onPress={handleNext}
                                style={[styles.nextButton, { backgroundColor: isCorrect ? '#4CAF50' : paperTheme.colors.primary }]}
                                contentStyle={{ height: 48 }}
                                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                            >
                                {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        </Surface>
                    </Animated.View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBackground: {
        paddingBottom: spacing.xxl + 20,
        paddingTop: spacing.md,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        marginRight: spacing.md,
    },
    progressContainer: {
        flex: 1,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    questionCard: {
        padding: spacing.xl,
        borderRadius: 24,
        marginBottom: spacing.xl,
        minHeight: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    questionText: {
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        lineHeight: 32,
    },
    optionsContainer: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    feedbackSection: {
        marginTop: spacing.lg,
    },
    feedbackCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 6,
    },
    feedbackContent: {
        flex: 1,
        marginRight: 16,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextButton: {
        borderRadius: 12,
        minWidth: 100,
    },
});

export default QuizScreen;
