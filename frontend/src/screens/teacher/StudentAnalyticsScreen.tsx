import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Surface } from 'react-native-paper';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import CompactHeader from '../../components/ui/CompactHeader';

const StudentAnalyticsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { studentId, studentName } = route.params as any;
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const colors = theme.colors;
    const { isDesktop, maxContentWidth, width } = useResponsive();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        xp: 0,
        streak: 0,
        level: 1,
        lessonsCompleted: 0,
        quizHistory: [],
        weakAreas: [],
        performanceTrend: [],
        gamePerformance: [],
        learnerCategory: 'neutral'
    });

    const styles = createStyles(isDark, isDesktop);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get(`/analytics/student/${studentId}`);
            setStats(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getProficiencyColor = (level: string): readonly [string, string] => {
        switch (level) {
            case 'Advanced': return ['#10B981', '#059669'] as const;
            case 'Proficient': return ['#3B82F6', '#2563EB'] as const;
            case 'Developing': return ['#F59E0B', '#D97706'] as const;
            default: return ['#94A3B8', '#64748B'] as const;
        }
    };

    const getProficiencyProgress = (level: string) => {
        switch (level) {
            case 'Advanced': return 1.0;
            case 'Proficient': return 0.75;
            case 'Developing': return 0.5;
            default: return 0.25;
        }
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>

                {/* Header */}
                <CompactHeader
                    title={studentName}
                    subtitle="Student Analytics"
                    onBack={() => navigation.goBack()}
                />


                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.contentContainer, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4F46E5" />
                            </View>
                        ) : (
                            <>
                                {/* Stats Overview */}
                                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.statsGrid}>
                                    <View style={styles.statCardWrapper}>
                                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statCard}>
                                            <MaterialCommunityIcons name="trophy" size={32} color="#fff" />
                                            <Text style={styles.statValue}>{stats.xp || 0}</Text>
                                            <Text style={styles.statLabel}>Total XP</Text>
                                        </LinearGradient>
                                    </View>

                                    <View style={styles.statCardWrapper}>
                                        <LinearGradient colors={['#F43F5E', '#E11D48']} style={styles.statCard}>
                                            <MaterialCommunityIcons name="fire" size={32} color="#fff" />
                                            <Text style={styles.statValue}>{stats.streak || 0}</Text>
                                            <Text style={styles.statLabel}>Current Streak</Text>
                                        </LinearGradient>
                                    </View>

                                    <View style={styles.statCardWrapper}>
                                        <LinearGradient colors={['#10B981', '#059669']} style={styles.statCard}>
                                            <MaterialCommunityIcons name="check-circle" size={32} color="#fff" />
                                            <Text style={styles.statValue}>{stats.lessonsCompleted || 0}</Text>
                                            <Text style={styles.statLabel}>Lessons Done</Text>
                                        </LinearGradient>
                                    </View>
                                </Animated.View>

                                {/* Learner Profile Section */}
                                {stats.learnerCategory && stats.learnerCategory !== 'neutral' && (
                                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
                                        <LinearGradient
                                            colors={stats.learnerCategory === 'fast' ? ['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.2)'] : ['rgba(245, 158, 11, 0.1)', 'rgba(217, 119, 6, 0.2)']}
                                            style={styles.learnerProfileCard}
                                        >
                                            <View style={styles.learnerIconContainer}>
                                                <MaterialCommunityIcons
                                                    name={stats.learnerCategory === 'fast' ? 'lightning-bolt' : 'clock-alert-outline'}
                                                    size={40}
                                                    color={stats.learnerCategory === 'fast' ? '#10B981' : '#F59E0B'}
                                                />
                                            </View>
                                            <View style={styles.learnerInfo}>
                                                <Text style={[
                                                    styles.learnerTitle,
                                                    { color: stats.learnerCategory === 'fast' ? '#10B981' : '#F59E0B' }
                                                ]}>
                                                    {stats.learnerCategory === 'fast' ? 'Fast Learner' : 'Needs Attention'}
                                                </Text>
                                                <Text style={[styles.learnerDescription, { color: isDark ? '#CBD5E1' : '#475569' }]}>
                                                    {stats.learnerCategory === 'fast'
                                                        ? 'This student grasps concepts quickly and demonstrates high accuracy in tasks.'
                                                        : 'This student may need additional support or more time to understand complex topics.'}
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </Animated.View>
                                )}

                                {/* Performance Trend Chart */}
                                {stats.gamePerformance && stats.gamePerformance.length > 0 && (
                                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <MaterialCommunityIcons name="chart-line" size={24} color="#6366F1" />
                                            <Text style={styles.sectionTitle}>Performance Trend</Text>
                                        </View>
                                        <Surface style={styles.chartCard} elevation={2}>
                                            <LineChart
                                                data={{
                                                    labels: stats.gamePerformance.slice(0, 5).reverse().map((game: any, idx: number) => `G${idx + 1}`),
                                                    datasets: [{
                                                        data: stats.gamePerformance.slice(0, 5).reverse().map((game: any) => {
                                                            const score = typeof game.delta === 'number' ? game.delta : game.bestScore || 0;
                                                            return Math.min(Math.max(score, 0), 100);
                                                        }),
                                                        color: () => stats.learnerCategory === 'fast' ? '#10B981' : stats.learnerCategory === 'slow' ? '#F43F5E' : '#6366F1',
                                                        strokeWidth: 3
                                                    }]
                                                }}
                                                width={isDesktop ? Math.min(width - 64, maxContentWidth - 64) : width - 64}
                                                height={220}
                                                chartConfig={{
                                                    backgroundColor: isDark ? '#1E293B' : '#ffffff',
                                                    backgroundGradientFrom: isDark ? '#1E293B' : '#ffffff',
                                                    backgroundGradientTo: isDark ? '#1E293B' : '#f8f8f8',
                                                    decimalPlaces: 0,
                                                    color: (opacity = 1) => stats.learnerCategory === 'fast'
                                                        ? `rgba(16, 185, 129, ${opacity})`
                                                        : stats.learnerCategory === 'slow'
                                                            ? `rgba(244, 63, 94, ${opacity})`
                                                            : `rgba(99, 102, 241, ${opacity})`,
                                                    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.7})` : `rgba(0, 0, 0, ${opacity * 0.7})`,
                                                    style: { borderRadius: 16 },
                                                    propsForDots: {
                                                        r: '6',
                                                        strokeWidth: '2',
                                                        stroke: stats.learnerCategory === 'fast' ? '#10B981' : stats.learnerCategory === 'slow' ? '#F43F5E' : '#6366F1'
                                                    }
                                                }}
                                                bezier
                                                style={styles.chart}
                                            />
                                            <Text style={styles.chartCaption}>
                                                Score progression across last {Math.min(stats.gamePerformance.length, 5)} games
                                            </Text>
                                        </Surface>
                                    </Animated.View>
                                )}

                                {/* Game Proficiency Section */}
                                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <MaterialCommunityIcons name="gamepad-variant" size={24} color="#6366F1" />
                                        <Text style={styles.sectionTitle}>Game Performance</Text>
                                    </View>

                                    {stats.gamePerformance && stats.gamePerformance.length > 0 ? (
                                        stats.gamePerformance.map((game: any, index: number) => (
                                            <Surface key={index} style={styles.gameCard} elevation={1}>
                                                <View style={styles.gameHeader}>
                                                    <View style={styles.gameInfo}>
                                                        <Text style={styles.gameName}>{game.title}</Text>
                                                        <Text style={styles.gameAttempts}>{game.attempts} {game.attempts === 1 ? 'play' : 'plays'}</Text>
                                                    </View>

                                                    {game.proficiency && game.proficiency !== 'Not Rated' ? (
                                                        <LinearGradient
                                                            colors={getProficiencyColor(game.proficiency)}
                                                            style={styles.proficiencyBadge}
                                                        >
                                                            <Text style={styles.proficiencyText}>{game.proficiency}</Text>
                                                        </LinearGradient>
                                                    ) : (
                                                        <View style={styles.notRatedBadge}>
                                                            <Text style={styles.notRatedText}>Not Rated</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Progress Bar */}
                                                {game.proficiency && game.proficiency !== 'Not Rated' && (
                                                    <View style={styles.progressContainer}>
                                                        <View style={styles.progressBar}>
                                                            <LinearGradient
                                                                colors={getProficiencyColor(game.proficiency)}
                                                                style={[styles.progressFill, { width: `${getProficiencyProgress(game.proficiency) * 100}%` }]}
                                                            />
                                                        </View>
                                                    </View>
                                                )}

                                                {/* Delta Score */}
                                                <View style={styles.deltaContainer}>
                                                    <View style={styles.deltaItem}>
                                                        <MaterialCommunityIcons name="speedometer" size={16} color={isDark ? "#94A3B8" : "#64748B"} />
                                                        <Text style={styles.deltaLabel}>Delta Score:</Text>
                                                        <Text style={styles.deltaValue}>
                                                            {typeof game.delta === 'number' ? game.delta.toFixed(2) : 'N/A'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.deltaItem}>
                                                        <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                                                        <Text style={styles.deltaLabel}>Best:</Text>
                                                        <Text style={styles.deltaValue}>{game.bestScore}</Text>
                                                    </View>
                                                </View>
                                            </Surface>
                                        ))
                                    ) : (
                                        <Surface style={styles.emptyCard} elevation={1}>
                                            <MaterialCommunityIcons name="gamepad-variant-outline" size={48} color={isDark ? "#475569" : "#CBD5E1"} />
                                            <Text style={styles.emptyText}>No games played yet</Text>
                                        </Surface>
                                    )}
                                </Animated.View>

                                {/* Quiz Performance */}
                                {stats.quizHistory && stats.quizHistory.length > 0 && (
                                    <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <MaterialCommunityIcons name="file-document" size={24} color="#6366F1" />
                                            <Text style={styles.sectionTitle}>Recent Quizzes</Text>
                                        </View>

                                        {stats.quizHistory.slice(0, 5).map((quiz: any, index: number) => (
                                            <Surface key={index} style={styles.quizCard} elevation={1}>
                                                <View style={styles.quizHeader}>
                                                    <Text style={styles.quizTitle}>{quiz.title || 'Quiz ' + (index + 1)}</Text>
                                                    <Text style={styles.quizScore}>{quiz.score}%</Text>
                                                </View>
                                                <Text style={styles.quizDate}>
                                                    {new Date(quiz.date).toLocaleDateString()}
                                                </Text>
                                            </Surface>
                                        ))}
                                    </Animated.View>
                                )}

                                {/* Weak Areas */}
                                {stats.weakAreas && stats.weakAreas.length > 0 && (
                                    <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <MaterialCommunityIcons name="alert-circle" size={24} color="#F43F5E" />
                                            <Text style={styles.sectionTitle}>Areas to Improve</Text>
                                        </View>

                                        {stats.weakAreas.map((area: any, index: number) => (
                                            <Surface key={index} style={styles.weakAreaCard} elevation={1}>
                                                <Text style={styles.weakAreaText}>{area.topic || area}</Text>
                                                <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? "#64748B" : "#94A3B8"} />
                                            </Surface>
                                        ))}
                                    </Animated.View>
                                )}
                            </>
                        )}
                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 10,
    },
    headerContentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    contentContainer: {
        paddingTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 24,
        gap: 12,
    },
    statCardWrapper: {
        flex: 1,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        fontWeight: '600',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginLeft: 8,
    },
    gameCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    gameInfo: {
        flex: 1,
    },
    gameName: {
        fontSize: 16,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    gameAttempts: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 2,
    },
    proficiencyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    proficiencyText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    notRatedBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: isDark ? '#334155' : '#E2E8F0',
    },
    notRatedText: {
        fontSize: 12,
        fontWeight: '600',
        color: isDark ? '#94A3B8' : '#64748B',
    },
    progressContainer: {
        marginTop: 8,
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: isDark ? '#334155' : '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    deltaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#F1F5F9',
    },
    deltaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deltaLabel: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        marginLeft: 4,
    },
    deltaValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginLeft: 4,
    },
    emptyCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 12,
    },
    quizCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    quizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    quizTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    quizScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    quizDate: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    weakAreaCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weakAreaText: {
        fontSize: 14,
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        fontWeight: '500',
    },
    learnerProfileCard: {
        padding: 24,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    learnerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    learnerInfo: {
        flex: 1,
    },
    learnerTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    learnerDescription: {
        fontSize: 14,
        lineHeight: 22,
    },
    chartCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 24,
        padding: 16,
        marginVertical: 8,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    chartCaption: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default StudentAnalyticsScreen;
