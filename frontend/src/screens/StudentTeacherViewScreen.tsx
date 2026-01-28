import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, DataTable, useTheme, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { getTeacherStats, TeacherStats } from '../services/teacherService';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';

const StudentTeacherViewScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { user } = useAuth();
    const { containerStyle, isMobile } = useResponsive();
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Check if user has teacher role
        if (user?.role !== 'teacher') {
            navigation.replace('Tabs', { screen: 'HomeTab' });
            return;
        }
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getTeacherStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load teacher stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!stats) {
        return (
            <View style={styles.centerContainer}>
                <Text>Failed to load statistics</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[containerStyle, { maxWidth: 1000, paddingHorizontal: isMobile ? 0 : 20 }]}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.headerRow}>
                        <Text variant="headlineMedium" style={styles.title}>
                            Teacher Dashboard
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('TeacherFeedback')}
                            icon="message-reply-text"
                            style={styles.feedbackBtn}
                        >
                            Feedback
                        </Button>
                    </View>

                    {/* Key Metrics */}
                    <View style={[styles.metricsRow, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <Card style={[styles.metricCard, { flex: isMobile ? undefined : 1, width: isMobile ? '100%' : undefined }]}>
                            <Card.Content style={styles.metricContent}>
                                <MaterialCommunityIcons name="clipboard-text" size={32} color={theme.colors.primary} />
                                <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                    {stats.totalAttempts}
                                </Text>
                                <Text variant="bodyMedium">Total Attempts</Text>
                            </Card.Content>
                        </Card>

                        <Card style={[styles.metricCard, { flex: isMobile ? undefined : 1, width: isMobile ? '100%' : undefined }]}>
                            <Card.Content style={styles.metricContent}>
                                <MaterialCommunityIcons name="chart-line" size={32} color="#4CAF50" />
                                <Text variant="displaySmall" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                    {stats.averageScore.toFixed(1)}%
                                </Text>
                                <Text variant="bodyMedium">Average Score</Text>
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Subject Statistics */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Attempts per Subject"
                            left={(props) => <MaterialCommunityIcons name="book-multiple" {...props} color={theme.colors.primary} />}
                        />
                        <Card.Content>
                            {stats.subjectStats.map((subject, index) => (
                                <View key={index} style={styles.subjectRow}>
                                    <View style={styles.subjectInfo}>
                                        <Text variant="titleMedium">{subject.subject}</Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                            {subject.attempts} attempts
                                        </Text>
                                    </View>
                                    <View style={styles.subjectScore}>
                                        <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                                            {subject.averageScore.toFixed(1)}%
                                        </Text>
                                    </View>
                                    <View style={styles.barContainer}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    width: `${(subject.attempts / Math.max(...stats.subjectStats.map((s) => s.attempts))) * 100}%`,
                                                    backgroundColor: theme.colors.primary,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>

                    {/* Weak Topics */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Topics Needing Attention"
                            left={(props) => <MaterialCommunityIcons name="alert-circle" {...props} color="#FF9800" />}
                        />
                        <Card.Content>
                            {stats.weakTopics.map((topic, index) => (
                                <View key={index} style={styles.topicRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text variant="titleMedium">{topic.topic}</Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                            {topic.subject} • {topic.attempts} attempts
                                        </Text>
                                    </View>
                                    <Chip
                                        mode="outlined"
                                        textStyle={{ color: topic.correctRate < 50 ? theme.colors.error : '#FF9800' }}
                                        style={{ borderColor: topic.correctRate < 50 ? theme.colors.error : '#FF9800' }}
                                    >
                                        {topic.correctRate}% correct
                                    </Chip>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>

                    {/* Recent Attempts Table */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Recent Quiz Attempts"
                            left={(props) => <MaterialCommunityIcons name="history" {...props} color={theme.colors.primary} />}
                        />
                        <Card.Content>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title>Student</DataTable.Title>
                                    <DataTable.Title>Subject</DataTable.Title>
                                    <DataTable.Title numeric>Score</DataTable.Title>
                                    <DataTable.Title>Time</DataTable.Title>
                                </DataTable.Header>

                                {stats.recentAttempts.map((attempt) => (
                                    <DataTable.Row key={attempt.id}>
                                        <DataTable.Cell>{attempt.studentName}</DataTable.Cell>
                                        <DataTable.Cell>{attempt.subject}</DataTable.Cell>
                                        <DataTable.Cell numeric>
                                            {attempt.score}/{attempt.totalQuestions}
                                        </DataTable.Cell>
                                        <DataTable.Cell>{formatDate(attempt.timestamp)}</DataTable.Cell>
                                    </DataTable.Row>
                                ))}
                            </DataTable>
                        </Card.Content>
                    </Card>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    feedbackBtn: {
        borderRadius: 8,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    metricCard: {
        backgroundColor: '#fff',
    },
    metricContent: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    subjectRow: {
        marginBottom: 16,
    },
    subjectInfo: {
        marginBottom: 4,
    },
    subjectScore: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    barContainer: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 4,
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
});

export default StudentTeacherViewScreen;
