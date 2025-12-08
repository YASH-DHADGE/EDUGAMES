import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const TeacherGameAnalyticsScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [classStats, setClassStats] = useState<any[]>([]);

    useEffect(() => {
        fetchClassGameStats();
    }, []);

    const fetchClassGameStats = async () => {
        try {
            const response = await api.get('/analytics/class/all');
            // Sort by XP for leaderboard
            const sorted = response.data.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
            setClassStats(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rank: number): [string, string] => {
        switch (rank) {
            case 1: return ['#FFD700', '#FFA000'];
            case 2: return ['#C0C0C0', '#A0A0A0'];
            case 3: return ['#CD7F32', '#A0522D'];
            default: return ['#6200EA', '#7C4DFF'];
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return 'crown';
            case 2: return 'medal';
            case 3: return 'medal-outline';
            default: return 'account';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EA" />
            </View>
        );
    }

    const topThree = classStats.slice(0, 3);
    const restOfClass = classStats.slice(3);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#6200EA', '#7C4DFF']}
                style={styles.header}
            >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" onPress={() => navigation.goBack()} />
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Game Analytics</Text>
                    <Text style={styles.headerSubtitle}>Class Performance Overview</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Overview Card */}
                <View style={styles.overviewCard}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.overviewGradient}
                    >
                        <MaterialCommunityIcons name="gamepad-variant" size={40} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.overviewTitle}>Class Gaming Overview</Text>
                        <Text style={styles.overviewText}>
                            Track how your students are mastering educational games and building skills through play.
                        </Text>
                    </LinearGradient>
                </View>

                {/* Stats Grid */}
                {classStats.length > 0 && (
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="account-group" size={28} color="#6200EA" />
                            <Text style={styles.statValue}>{classStats.length}</Text>
                            <Text style={styles.statLabel}>Total Students</Text>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="chart-line" size={28} color="#4CAF50" />
                            <Text style={styles.statValue}>
                                {Math.round(classStats.reduce((sum, s) => sum + (s.xp || 0), 0) / classStats.length)}
                            </Text>
                            <Text style={styles.statLabel}>Avg XP</Text>
                        </View>

                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="fire" size={28} color="#FF6B6B" />
                            <Text style={styles.statValue}>
                                {Math.round(classStats.reduce((sum, s) => sum + (s.completedTasks || 0), 0) / classStats.length)}
                            </Text>
                            <Text style={styles.statLabel}>Avg Tasks</Text>
                        </View>
                    </View>
                )}

                {/* Top 3 Podium */}
                {topThree.length > 0 && (
                    <View style={styles.podiumSection}>
                        <Text style={styles.sectionTitle}>🏆 Top Performers</Text>

                        <View style={styles.podium}>
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <View style={styles.podiumItem}>
                                    <LinearGradient
                                        colors={getRankColor(2)}
                                        style={[styles.podiumCard, styles.secondPlace]}
                                    >
                                        <MaterialCommunityIcons name="medal" size={32} color="#fff" />
                                        <Text style={styles.podiumName}>{topThree[1].name}</Text>
                                        <Text style={styles.podiumXP}>{topThree[1].xp || 0} XP</Text>
                                    </LinearGradient>
                                    <View style={[styles.podiumBase, { height: 70, backgroundColor: '#E0E0E0' }]} />
                                </View>
                            )}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <View style={styles.podiumItem}>
                                    <LinearGradient
                                        colors={getRankColor(1)}
                                        style={[styles.podiumCard, styles.firstPlace]}
                                    >
                                        <MaterialCommunityIcons name="crown" size={40} color="#fff" />
                                        <Text style={styles.podiumName}>{topThree[0].name}</Text>
                                        <Text style={styles.podiumXP}>{topThree[0].xp || 0} XP</Text>
                                    </LinearGradient>
                                    <View style={[styles.podiumBase, { height: 100, backgroundColor: '#FFD700' }]} />
                                </View>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <View style={styles.podiumItem}>
                                    <LinearGradient
                                        colors={getRankColor(3)}
                                        style={[styles.podiumCard, styles.thirdPlace]}
                                    >
                                        <MaterialCommunityIcons name="medal-outline" size={28} color="#fff" />
                                        <Text style={styles.podiumName}>{topThree[2].name}</Text>
                                        <Text style={styles.podiumXP}>{topThree[2].xp || 0} XP</Text>
                                    </LinearGradient>
                                    <View style={[styles.podiumBase, { height: 50, backgroundColor: '#CD7F32' }]} />
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Full Leaderboard */}
                {classStats.length > 0 && (
                    <View style={styles.leaderboardSection}>
                        <Text style={styles.sectionTitle}>📊 Full Leaderboard</Text>

                        {classStats.map((student: any, index: number) => (
                            <View
                                key={student.id}
                                style={[
                                    styles.studentCard,
                                    index < 3 && styles.topThreeCard
                                ]}
                            >
                                <View style={styles.studentInfo}>
                                    <LinearGradient
                                        colors={index < 3 ? getRankColor(index + 1) : ['#E0E0E0', '#BDBDBD']}
                                        style={styles.rankBadge}
                                    >
                                        <Text style={styles.rankText}>{index + 1}</Text>
                                    </LinearGradient>

                                    <View style={styles.studentDetails}>
                                        <Text style={styles.studentName}>{student.name}</Text>
                                        <View style={styles.studentStats}>
                                            <View style={styles.statItem}>
                                                <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
                                                <Text style={styles.studentStatText}>{student.xp || 0} XP</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                                                <Text style={styles.studentStatText}>{student.completedTasks || 0} Tasks</Text>
                                            </View>

                                            {/* Learner Category Badge */}
                                            {student.learnerCategory && student.learnerCategory !== 'neutral' && (
                                                <View style={[
                                                    styles.learnerBadge,
                                                    { backgroundColor: student.learnerCategory === 'fast' ? '#E8F5E9' : '#FFF3E0' }
                                                ]}>
                                                    <MaterialCommunityIcons
                                                        name={student.learnerCategory === 'fast' ? 'lightning-bolt' : 'clock-alert-outline'}
                                                        size={12}
                                                        color={student.learnerCategory === 'fast' ? '#2E7D32' : '#EF6C00'}
                                                    />
                                                    <Text style={[
                                                        styles.learnerBadgeText,
                                                        { color: student.learnerCategory === 'fast' ? '#2E7D32' : '#EF6C00' }
                                                    ]}>
                                                        {student.learnerCategory === 'fast' ? 'Fast Learner' : 'Slow Learner'}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={24}
                                    color="#999"
                                    onPress={() => (navigation as any).navigate('StudentAnalytics', {
                                        studentId: student.id,
                                        studentName: student.name
                                    })}
                                />
                            </View>
                        ))}
                    </View>
                )}

                {classStats.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-group-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No students found</Text>
                        <Text style={styles.emptySubtext}>Students will appear here once they join your class</Text>
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
    overviewCard: {
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    overviewGradient: {
        padding: 24,
        alignItems: 'center',
    },
    overviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 8,
    },
    overviewText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    podiumSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 20,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
    },
    podiumCard: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 4,
        elevation: 4,
    },
    firstPlace: {
        paddingVertical: 16,
    },
    secondPlace: {
        paddingVertical: 14,
    },
    thirdPlace: {
        paddingVertical: 12,
    },
    podiumName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
        textAlign: 'center',
    },
    podiumXP: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 4,
    },
    podiumBase: {
        width: '100%',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        opacity: 0.7,
    },
    leaderboardSection: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    studentCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    topThreeCard: {
        borderWidth: 2,
        borderColor: '#FFD700',
        elevation: 3,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    studentDetails: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    studentStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    studentStatText: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    learnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    learnerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
});

export default TeacherGameAnalyticsScreen;
