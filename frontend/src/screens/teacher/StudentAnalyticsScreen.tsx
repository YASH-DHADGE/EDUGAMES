import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const StudentAnalyticsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { studentId, studentName } = route.params as any;

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

    const getProficiencyColor = (level: string) => {
        switch (level) {
            case 'Advanced': return ['#4CAF50', '#45a049'];
            case 'Proficient': return ['#2196F3', '#1976D2'];
            case 'Developing': return ['#FFC107', '#FFA000'];
            default: return ['#9E9E9E', '#757575'];
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EA" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#6200EA', '#7C4DFF']}
                style={styles.header}
            >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" onPress={() => navigation.goBack()} />
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{studentName}</Text>
                    <Text style={styles.headerSubtitle}>Student Analytics</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Stats Overview */}
                <View style={styles.statsGrid}>
                    <LinearGradient colors={['#FFD700', '#FFA000']} style={styles.statCard}>
                        <MaterialCommunityIcons name="trophy" size={32} color="#fff" />
                        <Text style={styles.statValue}>{stats.xp || 0}</Text>
                        <Text style={styles.statLabel}>Total XP</Text>
                    </LinearGradient>

                    <LinearGradient colors={['#FF6B6B', '#EE5A6F']} style={styles.statCard}>
                        <MaterialCommunityIcons name="fire" size={32} color="#fff" />
                        <Text style={styles.statValue}>{stats.streak || 0}</Text>
                        <Text style={styles.statLabel}>Current Streak</Text>
                    </LinearGradient>

                    <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.statCard}>
                        <MaterialCommunityIcons name="check-circle" size={32} color="#fff" />
                        <Text style={styles.statValue}>{stats.lessonsCompleted || 0}</Text>
                        <Text style={styles.statLabel}>Lessons Done</Text>
                    </LinearGradient>
                </View>

                {/* Learner Profile Section */}
                {stats.learnerCategory && stats.learnerCategory !== 'neutral' && (
                    <View style={styles.section}>
                        <LinearGradient
                            colors={stats.learnerCategory === 'fast' ? ['#E8F5E9', '#C8E6C9'] : ['#FFF3E0', '#FFE0B2']}
                            style={styles.learnerProfileCard}
                        >
                            <View style={styles.learnerIconContainer}>
                                <MaterialCommunityIcons
                                    name={stats.learnerCategory === 'fast' ? 'lightning-bolt' : 'clock-alert-outline'}
                                    size={40}
                                    color={stats.learnerCategory === 'fast' ? '#2E7D32' : '#EF6C00'}
                                />
                            </View>
                            <View style={styles.learnerInfo}>
                                <Text style={[
                                    styles.learnerTitle,
                                    { color: stats.learnerCategory === 'fast' ? '#2E7D32' : '#EF6C00' }
                                ]}>
                                    {stats.learnerCategory === 'fast' ? 'Fast Learner' : 'Needs Attention'}
                                </Text>
                                <Text style={styles.learnerDescription}>
                                    {stats.learnerCategory === 'fast'
                                        ? 'This student grasps concepts quickly and demonstrates high accuracy in tasks.'
                                        : 'This student may need additional support or more time to understand complex topics.'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Game Proficiency Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="gamepad-variant" size={24} color="#6200EA" />
                        <Text style={styles.sectionTitle}>Game Performance</Text>
                    </View>

                    {stats.gamePerformance && stats.gamePerformance.length > 0 ? (
                        stats.gamePerformance.map((game: any, index: number) => (
                            <View key={index} style={styles.gameCard}>
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
                                        <MaterialCommunityIcons name="speedometer" size={16} color="#666" />
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
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <MaterialCommunityIcons name="gamepad-variant-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No games played yet</Text>
                        </View>
                    )}
                </View>

                {/* Quiz Performance */}
                {stats.quizHistory && stats.quizHistory.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="file-document" size={24} color="#6200EA" />
                            <Text style={styles.sectionTitle}>Recent Quizzes</Text>
                        </View>

                        {stats.quizHistory.slice(0, 5).map((quiz: any, index: number) => (
                            <View key={index} style={styles.quizCard}>
                                <View style={styles.quizHeader}>
                                    <Text style={styles.quizTitle}>{quiz.title || 'Quiz ' + (index + 1)}</Text>
                                    <Text style={styles.quizScore}>{quiz.score}%</Text>
                                </View>
                                <Text style={styles.quizDate}>
                                    {new Date(quiz.date).toLocaleDateString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Weak Areas */}
                {stats.weakAreas && stats.weakAreas.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="alert-circle" size={24} color="#FF6B6B" />
                            <Text style={styles.sectionTitle}>Areas to Improve</Text>
                        </View>

                        {stats.weakAreas.map((area: any, index: number) => (
                            <View key={index} style={styles.weakAreaCard}>
                                <Text style={styles.weakAreaText}>{area.topic || area}</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#6200EA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContent: {
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    gameCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
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
        fontWeight: '600',
        color: '#333',
    },
    gameAttempts: {
        fontSize: 12,
        color: '#999',
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
        backgroundColor: '#f0f0f0',
    },
    notRatedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
    },
    progressContainer: {
        marginTop: 8,
        marginBottom: 12,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    deltaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    deltaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deltaLabel: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    deltaValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 4,
    },
    emptyCard: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 12,
    },
    quizCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
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
        color: '#333',
    },
    quizScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6200EA',
    },
    quizDate: {
        fontSize: 12,
        color: '#999',
    },
    weakAreaCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 1,
    },
    weakAreaText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    learnerProfileCard: {
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    learnerIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    learnerInfo: {
        flex: 1,
    },
    learnerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    learnerDescription: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
});

export default StudentAnalyticsScreen;
