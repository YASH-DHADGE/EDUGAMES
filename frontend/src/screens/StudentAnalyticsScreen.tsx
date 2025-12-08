import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { spacing, borderRadius, theme } from '../theme';

const StudentAnalyticsScreen = ({ route }: any) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const studentId = route?.params?.studentId || user?._id;

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!studentId) return;
            try {
                const response = await api.get(`/analytics/student/${studentId}`);
                setAnalytics(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [studentId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!analytics) {
        return (
            <View style={styles.loadingContainer}>
                <Text>No data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#f6d365', '#fda085']}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Analytics</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Surface style={styles.statCard} elevation={2}>
                        <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
                        <Text style={styles.statValue}>{analytics.xp}</Text>
                        <Text style={styles.statLabel}>Total XP</Text>
                    </Surface>
                    <Surface style={styles.statCard} elevation={2}>
                        <MaterialCommunityIcons name="fire" size={24} color="#FF5722" />
                        <Text style={styles.statValue}>{analytics.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </Surface>
                    <Surface style={styles.statCard} elevation={2}>
                        <MaterialCommunityIcons name="book-open-variant" size={24} color="#2196F3" />
                        <Text style={styles.statValue}>{analytics.lessonsCompleted}</Text>
                        <Text style={styles.statLabel}>Lessons</Text>
                    </Surface>
                    <Surface style={styles.statCard} elevation={2}>
                        <MaterialCommunityIcons name="star" size={24} color="#9C27B0" />
                        <Text style={styles.statValue}>{analytics.averageScore}%</Text>
                        <Text style={styles.statLabel}>Avg Score</Text>
                    </Surface>
                </View>

                {/* XP History Chart (Simple Bar Chart) */}
                <Surface style={styles.chartCard} elevation={2}>
                    <Text style={styles.cardTitle}>XP History (Last 7 Days)</Text>
                    <View style={styles.chartContainer}>
                        {analytics.xpHistory.map((item: any, index: number) => (
                            <View key={index} style={styles.barContainer}>
                                <View style={[styles.bar, { height: (Math.min(item.xp, 100) + '%') as any }]} />
                                <Text style={styles.barLabel}>{item.date}</Text>
                            </View>
                        ))}
                    </View>
                </Surface>

                {/* Recent Activity */}
                <Surface style={styles.activityCard} elevation={2}>
                    <Text style={styles.cardTitle}>Recent Activity</Text>
                    {analytics.recentActivity.map((item: any, index: number) => (
                        <View key={index} style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: item.type === 'quiz' ? '#e1bee7' : '#bbdefb' }]}>
                                <MaterialCommunityIcons
                                    name={item.type === 'quiz' ? 'help-circle-outline' : 'book-outline'}
                                    size={20}
                                    color={item.type === 'quiz' ? '#8e24aa' : '#1976d2'}
                                />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>{item.title}</Text>
                                <Text style={styles.activityDate}>
                                    {new Date(item.date).toLocaleDateString()}
                                </Text>
                            </View>
                            {item.score && (
                                <Text style={styles.activityScore}>{item.score}%</Text>
                            )}
                        </View>
                    ))}
                </Surface>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: spacing.lg,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    statCard: {
        width: '47%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    chartCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor: '#fff',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: spacing.lg,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
        paddingBottom: spacing.sm,
    },
    barContainer: {
        alignItems: 'center',
        width: 45,
        height: '100%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: 32,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        marginBottom: 6,
    },
    barLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    activityCard: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor: '#fff',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    activityDate: {
        fontSize: 12,
        color: '#999',
    },
    activityScore: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
});

export default StudentAnalyticsScreen;
