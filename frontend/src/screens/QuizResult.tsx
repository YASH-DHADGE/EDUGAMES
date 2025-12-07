import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button, useTheme, IconButton, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { submitQuizResult } from '../services/quizzesService';
import { useSync } from '../context/SyncContext';
import { useResponsive } from '../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import { soundManager } from '../utils/soundEffects';
import { spacing, borderRadius } from '../theme';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const QuizResult = ({ route, navigation }: any) => {
    const theme = useTheme();
    const { isOffline } = useSync();
    const { containerStyle, isMobile } = useResponsive();
    const { score, totalQuestions, correctAnswers, quizId, questions, userAnswers, assignmentId } = route.params;
    const [showReview, setShowReview] = React.useState(false);
    const xpGained = correctAnswers * 10;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const [isSaving, setIsSaving] = React.useState(true);

    useEffect(() => {
        const submit = async () => {
            try {
                const result = {
                    quizId,
                    assignmentId,
                    score: correctAnswers,
                    totalQuestions,
                    timestamp: Date.now(),
                };
                console.log('Submitting Result with AssignmentID:', assignmentId);
                await submitQuizResult(result, !isOffline);
                console.log('Result submitted successfully');
            } catch (err) {
                console.error('Error submitting result:', err);
            } finally {
                setIsSaving(false);
            }
        };

        submit();

        // Play success sound if score is good (> 50%)
        if (percentage >= 50) {
            soundManager.playSuccess();
        }
    }, []);

    const ReviewModal = () => (
        <Modal visible={showReview} animationType="slide" onRequestClose={() => setShowReview(false)}>
            <View style={[styles.modalContainer, { backgroundColor: '#F4F7FC' }]}>
                <View style={styles.modalHeader}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#333' }}>Review Mistakes</Text>
                    <IconButton icon="close" onPress={() => setShowReview(false)} />
                </View>
                <ScrollView contentContainerStyle={styles.modalContent}>
                    {questions?.map((q: any, index: number) => {
                        const userAnswer = userAnswers?.[index];
                        const isCorrect = userAnswer === q.correctIndex;

                        if (isCorrect) return null;

                        return (
                            <Surface key={index} style={styles.reviewCard} elevation={2}>
                                <Text variant="titleMedium" style={styles.reviewQuestion}>
                                    {index + 1}. {q.question}
                                </Text>
                                <View style={styles.answerRow}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color="#F44336" />
                                    <Text style={[styles.answerText, { color: '#F44336' }]}>
                                        Your Answer: {userAnswer !== null ? q.options[userAnswer] : 'Skipped'}
                                    </Text>
                                </View>
                                <View style={styles.answerRow}>
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                                    <Text style={[styles.answerText, { color: '#4CAF50' }]}>
                                        Correct Answer: {q.options[q.correctIndex]}
                                    </Text>
                                </View>
                                {q.explanation && (
                                    <View style={styles.explanationBox}>
                                        <Text variant="bodySmall" style={{ fontWeight: 'bold', color: '#555' }}>Explanation:</Text>
                                        <Text variant="bodySmall" style={{ color: '#666' }}>{q.explanation}</Text>
                                    </View>
                                )}
                            </Surface>
                        );
                    })}
                    {correctAnswers === totalQuestions && (
                        <View style={styles.perfectScoreContainer}>
                            <MaterialCommunityIcons name="trophy" size={64} color="#FFD700" />
                            <Text variant="titleLarge" style={{ marginTop: 16, textAlign: 'center' }}>
                                Perfect Score! No mistakes to review.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#6A5AE0', '#5243C2']}
                style={styles.background}
            />
            <ReviewModal />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[containerStyle, { maxWidth: 600, alignSelf: 'center', width: '100%', paddingHorizontal: isMobile ? 20 : 0 }]}>
                    <View style={styles.content}>
                        <Animated.View entering={ZoomIn.duration(600)} style={styles.animationContainer}>
                            <LottieView
                                source={require('../assets/lottie/welcome.json')}
                                autoPlay
                                loop={false}
                                style={{ width: isMobile ? 200 : 250, height: isMobile ? 200 : 250 }}
                            />
                        </Animated.View>

                        <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
                            Quiz Complete!
                        </Animated.Text>

                        <Animated.View entering={FadeInDown.delay(400)} style={{ marginBottom: 20 }}>
                            {isSaving ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text variant="bodyLarge" style={{ color: '#fff' }}>Saving Result...</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                                    <Text variant="bodyLarge" style={{ color: '#fff', fontWeight: 'bold' }}>Result Saved</Text>
                                </View>
                            )}
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500)} style={styles.statsContainer}>
                            <Surface style={styles.statCard} elevation={4}>
                                <Text variant="displayMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                    {correctAnswers}/{totalQuestions}
                                </Text>
                                <Text variant="bodyLarge" style={{ color: '#666' }}>Correct Answers</Text>
                            </Surface>

                            <Surface style={styles.statCard} elevation={4}>
                                <Text variant="displayMedium" style={{ color: '#FF9800', fontWeight: 'bold' }}>
                                    +{xpGained}
                                </Text>
                                <Text variant="bodyLarge" style={{ color: '#666' }}>XP Gained</Text>
                            </Surface>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(700)} style={styles.buttonContainer}>
                            {correctAnswers < totalQuestions && (
                                <Button
                                    mode="contained"
                                    onPress={() => setShowReview(true)}
                                    style={[styles.button, { backgroundColor: '#fff' }]}
                                    textColor={theme.colors.primary}
                                    icon="eye"
                                    contentStyle={{ paddingVertical: 8 }}
                                >
                                    Review Mistakes
                                </Button>
                            )}
                            <Button
                                mode="contained"
                                onPress={() => navigation.replace('Quiz', {
                                    quizData: {
                                        id: quizId,
                                        quizId: quizId,
                                        questions: questions,
                                        title: route.params.title || 'Retry Quiz'
                                    }
                                })}
                                style={[styles.button, { backgroundColor: '#FFD700' }]}
                                textColor="#333"
                                contentStyle={{ paddingVertical: 8 }}
                            >
                                Retry Quiz
                            </Button>
                            <Button
                                mode="text"
                                onPress={() => {
                                    // Check if we are in TeacherNavigator (can check by route params or just try-catch/conditional)
                                    // Better approach: Check if 'TeacherHome' exists in the stack or just go back to root
                                    // For now, let's try to navigate to 'TeacherHome' if 'Tabs' fails, or check user role if available in context
                                    // But simpler: just go back to the beginning of the stack or specific screen

                                    // Since we don't have easy access to user role here without context, 
                                    // we can check if we can go back to 'TeacherClassroom' or 'TeacherHome'
                                    // Or simply use popToTop() if we want to go to the start of the stack

                                    // Let's try to navigate to 'TeacherHome' if we are a teacher (we can guess if 'TeacherClassroom' was in history)
                                    // A safer bet is to check if we can navigate to 'Tabs', if not, try 'TeacherHome'

                                    try {
                                        // Try navigating to MainTabs (Student)
                                        navigation.navigate('MainTabs', { screen: 'HomeTab' });
                                    } catch (e) {
                                        // If that fails, try TeacherHome (Teacher)
                                        navigation.navigate('TeacherHome');
                                    }
                                }}
                                style={styles.button}
                                textColor="#fff"
                                contentStyle={{ paddingVertical: 8 }}
                            >
                                Back to Home
                            </Button>
                        </Animated.View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#6A5AE0',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    animationContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 100,
        padding: 20,
        elevation: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 40,
        textAlign: 'center',
    },
    statsContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 16,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    button: {
        borderRadius: 16,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalContent: {
        padding: 16,
    },
    reviewCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    reviewQuestion: {
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    answerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    answerText: {
        flex: 1,
        fontWeight: '500',
    },
    explanationBox: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
    },
    perfectScoreContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
});

export default QuizResult;
