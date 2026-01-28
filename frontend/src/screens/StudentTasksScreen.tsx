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
import UnifiedHeader from '../components/UnifiedHeader';

const TASKS_CACHE_KEY = 'student_tasks_cache';

const StudentTasksScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const { isDark } = useAppTheme();
    const { isOffline } = useSync();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? '#0F172A' : '#EEF2FF',
        },
        scrollContent: {
            paddingTop: spacing.lg,
            paddingBottom: 100,
        },
        headerBackground: {
            paddingTop: 60,
            paddingBottom: spacing.xl,
        },
        header: {
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: '#fff',
            letterSpacing: -0.5,
        },
        subtitle: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginTop: spacing.xs,
        },
        offlineBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs + 2,
            borderRadius: 12,
            gap: spacing.xs,
            marginTop: spacing.sm,
            alignSelf: 'flex-start',
        },
        offlineText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '700',
        },
        list: {
            paddingHorizontal: spacing.lg,
        },
        taskCard: {
            marginBottom: spacing.md,
            padding: spacing.lg + 2,
            backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.4 : 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#F0F0F0',
        },
        taskHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        taskIcon: {
            width: 52,
            height: 52,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
            backgroundColor: isDark ? '#334155' : '#EEF2FF',
        },
        taskInfo: {
            flex: 1,
        },
        taskTitle: {
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 4,
            color: isDark ? '#F1F5F9' : '#111827',
            letterSpacing: -0.2,
        },
        taskDate: {
            fontSize: 12,
            color: isDark ? '#94A3B8' : '#6B7280',
        },
        statusBadge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
        },
        statusText: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        actionButton: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md + 2,
            borderRadius: 12,
            gap: spacing.sm,
        },
        actionButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 14,
        },
        emptyState: {
            alignItems: 'center',
            marginTop: 60,
            paddingHorizontal: spacing.lg,
        },
        emptyIconContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: isDark ? '#1E293B' : '#EEF2FF',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: isDark ? '#334155' : '#F0F0F0',
        },
        emptyText: {
            color: isDark ? '#F1F5F9' : '#111827',
            fontSize: 20,
            fontWeight: '700',
            marginTop: spacing.md,
        },
        emptySubtext: {
            color: isDark ? '#94A3B8' : '#6B7280',
            fontSize: 14,
            marginTop: spacing.xs,
            textAlign: 'center',
        },
    });

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
            case 'completed': return '#10B981';
            case 'pending': return '#F59E0B';
            default: return '#6B7280';
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

        const iconColorMap: Record<string, string> = {
            'Science': '#10B981',
            'Mathematics': '#F59E0B',
            'English': '#8B5CF6',
            'Computer': '#3B82F6',
        };
        const iconColor = iconColorMap[task.subject] || '#6366F1';

        return (
            <View key={index} style={[styles.taskCard]}>
                <View style={styles.taskHeader}>
                    <View style={[styles.taskIcon]}>
                        <Ionicons name={typeIcon as any} size={26} color={iconColor} />
                    </View>
                    <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle]}>{typeLabel}: {title}</Text>
                        <Text style={[styles.taskDate]}>Assigned: {new Date(task.assignedAt).toLocaleDateString()}</Text>
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
                                        content: task.content,
                                        subject: task.subject
                                    }
                                });
                            } else {
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
                            colors={['#6366F1', '#4F46E5']}
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
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <UnifiedHeader
                title={t('tasks.title')}
                subtitle="Track your assignments"
                icon="checkbox-marked-circle-outline"
            />

            {/* Content with Overlap */}
            <View style={{ flex: 1, marginTop: -40 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={isDark ? '#6366F1' : '#4F46E5'} style={{ marginTop: 40 }} />
                ) : (
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, styles.list, { paddingBottom: 120 }]}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#6366F1' : '#4F46E5'} />
                        }
                    >
                        {isOffline && (
                            <View style={styles.offlineBadge}>
                                <Ionicons name="cloud-offline" size={14} color="#fff" />
                                <Text style={styles.offlineText}>Offline Mode</Text>
                            </View>
                        )}
                        {tasks.length > 0 ? (
                            tasks.map((task, index) => renderTaskItem(task, index))
                        ) : (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="checkmark-circle-outline" size={50} color={isDark ? '#6366F1' : '#4F46E5'} />
                                </View>
                                <Text style={styles.emptyText}>{t('tasks.noTasks')}</Text>
                                <Text style={styles.emptySubtext}>Great job staying on top of your work!</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};


export default StudentTasksScreen;
