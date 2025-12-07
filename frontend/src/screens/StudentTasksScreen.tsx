import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '../components/ui/GradientBackground';
import CustomCard from '../components/ui/CustomCard';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { useAppTheme } from '../context/ThemeContext';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gradients, spacing, borderRadius, shadows } from '../theme';
import { useTranslation } from '../i18n';

const TASKS_CACHE_KEY = 'student_tasks_cache';

const StudentTasksScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { isOffline } = useSync();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            loadTasks();
        }, [isOffline])
    );

    const loadTasks = async () => {
        setLoading(true);
        if (isOffline) {
            await loadFromCache();
        } else {
            await fetchTasks();
        }
        setLoading(false);
    };

    const loadFromCache = async () => {
        try {
            const cached = await AsyncStorage.getItem(TASKS_CACHE_KEY);
            if (cached) {
                setTasks(JSON.parse(cached));
            }
        } catch (error) {
            console.error('Failed to load tasks from cache', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get('/student/tasks');
            setTasks(response.data);
            // Cache the tasks
            await AsyncStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(response.data));
        } catch (error) {
            console.error('Failed to fetch tasks', error);
            // Fallback to cache if fetch fails
            await loadFromCache();
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (!isOffline) {
            await fetchTasks();
        }
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return theme.colors.success;
            case 'pending': return theme.colors.warning;
            default: return theme.colors.textSecondary;
        }
    };

    const renderTaskItem = (task: any, index: number) => {
        // Determine type-specific labels and icons
        let typeIcon = "book";
        let typeLabel = "Chapter";
        let title = task.chapterName;

        if (task.type === 'quiz') {
            typeIcon = "help-circle";
            typeLabel = "Quiz";
            title = task.title;
        } else if (task.type === 'teacherChapter') {
            typeIcon = "school";
            typeLabel = "Lesson";
            title = task.title;
        }

        return (
            <CustomCard key={index} style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.taskHeader}>
                    <View style={[styles.taskIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Ionicons name={typeIcon as any} size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, { color: theme.colors.onSurface }]}>{typeLabel}: {title}</Text>
                        <Text style={[styles.taskDate, { color: theme.colors.textSecondary }]}>Assigned: {new Date(task.assignedAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                            {t(`tasks.${task.status}`).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {task.status === 'pending' && (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            if (task.type === 'quiz') {
                                (navigation as any).navigate('Learn', {
                                    screen: 'Quiz',
                                    params: {
                                        quizData: {
                                            quizId: task.quizId,
                                            title: task.title,
                                            assignmentId: task.id
                                        }
                                    }
                                });
                            } else if (task.type === 'teacherChapter') {
                                (navigation as any).navigate('Learn', {
                                    screen: 'LessonReader',
                                    params: {
                                        chapterId: task.chapterId,
                                        title: task.title,
                                        content: task.content, // Assuming content is passed directly or fetched
                                        subject: task.subject
                                    }
                                });
                            } else {
                                // Default/Chapter navigation
                                const subjectCodeMap: Record<string, string> = {
                                    'Science': 'sci',
                                    'Mathematics': 'math',
                                    'Math': 'math',
                                    'English': 'eng',
                                    'Computer': 'comp'
                                };
                                const code = subjectCodeMap[task.subject] || task.subject.toLowerCase().slice(0, 3);
                                const subjectId = `${code}-${task.classNumber}`;
                                const classId = `class-${task.classNumber}`;

                                (navigation as any).navigate('Learn', {
                                    screen: 'ChapterList',
                                    params: {
                                        subjectId: subjectId,
                                        subjectName: task.subject,
                                        classId: classId
                                    }
                                });
                            }
                        }}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionButton}
                        >
                            <Text style={styles.actionButtonText}>
                                {task.type === 'quiz' ? `${t('tasks.start')} ${t('home.quiz')}` : `${t('tasks.start')} ${t('home.lessons')}`}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )
                }
            </CustomCard >
        );
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('tasks.title')}</Text>
                    {isOffline && (
                        <View style={styles.offlineBadge}>
                            <Ionicons name="cloud-offline" size={16} color="#fff" />
                            <Text style={styles.offlineText}>Offline Mode</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                        }
                    >
                        {tasks.length > 0 ? (
                            tasks.map((task, index) => renderTaskItem(task, index))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="checkmark-circle-outline" size={60} color="rgba(255,255,255,0.5)" />
                                <Text style={styles.emptyText}>{t('tasks.noTasks')}</Text>
                                <Text style={styles.emptySubtext}>Great job staying on top of your work.</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.xl,
        paddingTop: spacing.xxl * 2.5, // Header space
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red for offline
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        gap: spacing.xs,
    },
    offlineText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 100, // Space for tab bar
    },
    taskCard: {
        marginBottom: spacing.lg,
        padding: spacing.lg,
        ...shadows.base,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    taskIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    taskDate: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: spacing.lg,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: spacing.xs,
    },
});

export default StudentTasksScreen;
