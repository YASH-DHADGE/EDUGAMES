import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Surface, ProgressBar, ActivityIndicator, Button, Card, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { assessCourseOutcome, CourseOutcome } from '../utils/deltaAssessment';
import { formatTime } from '../utils/formatTime';

const CourseProgressScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as { subject: string; classLevel: string; userId: string; } || {};

    // Default params for dev/testing if not passed
    const subject = params.subject || 'Science';
    const classLevel = params.classLevel || '6';
    const userId = params.userId || 'user_123'; // Should come from context in real app

    const [loading, setLoading] = useState(true);
    const [outcome, setOutcome] = useState<CourseOutcome | null>(null);
    const [gameResults, setGameResults] = useState<any[]>([]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await assessCourseOutcome(userId, classLevel, subject);
            setOutcome(data);

            // Fetch game results for chart
            const key = `gameResults_${userId}_${classLevel}_${subject}`;
            const storedResults = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem(key));
            if (storedResults) {
                const results = JSON.parse(storedResults);
                setGameResults(Array.isArray(results) ? results.slice(-10).reverse() : []);
            }
        } catch (error) {
            console.error("Failed to load analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [subject, classLevel]);

    const screenWidth = Dimensions.get('window').width;

    const renderProficiencyChart = () => {
        if (!outcome) return null;

        // Mocking distribution for visualization since assessCourseOutcome currently aggregates
        // In a real implementation, assessCourseOutcome would return this distribution
        // For now, let's assume we have it or calculate roughly from advanced %
        const advancedCount = Math.round(outcome.totalGames * (outcome.advancedPercentage / 100));
        const remaining = outcome.totalGames - advancedCount;
        const proficient = Math.round(remaining * 0.5);
        const developing = Math.round(remaining * 0.3);
        const needsImp = remaining - proficient - developing;

        const data = [
            { name: 'Advanced', population: advancedCount, color: '#4CAF50', legendFontColor: '#666', legendFontSize: 12 },
            { name: 'Proficient', population: proficient, color: '#2196F3', legendFontColor: '#666', legendFontSize: 12 },
            { name: 'Developing', population: developing, color: '#FFC107', legendFontColor: '#666', legendFontSize: 12 },
            { name: 'Needs Imp.', population: needsImp, color: '#FF5252', legendFontColor: '#666', legendFontSize: 12 },
        ].filter(d => d.population > 0);

        if (data.length === 0) return <Text style={{ textAlign: 'center', margin: 20 }}>No game data yet.</Text>;

        return (
            <PieChart
                data={data}
                width={screenWidth - 40}
                height={200}
                chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
            />
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
                <Text style={{ marginTop: 16 }}>Analyzing performance...</Text>
            </View>
        );
    }

    if (!outcome) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Could not load analytics.</Text>
                <Button onPress={fetchAnalytics}>Retry</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#6200EE', '#7C4DFF']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerSubject}>{subject} (Class {classLevel})</Text>
                        <Text style={styles.headerSubtitle}>Course Proficiency Analytics</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                        <Surface style={[styles.badge, { backgroundColor: outcome.achieved ? '#4CAF50' : '#FFC107' }]} elevation={2}>
                            <MaterialCommunityIcons name={outcome.achieved ? "check-decagram" : "progress-clock"} size={20} color="#fff" />
                            <Text style={styles.badgeText}>{outcome.achieved ? "Mastered" : "In Progress"}</Text>
                        </Surface>
                    </View>
                </View>

                <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{outcome.totalGames}</Text>
                        <Text style={styles.metricLabel}>Games</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{outcome.averageDelta}</Text>
                        <Text style={styles.metricLabel}>Avg Delta</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{outcome.averageScore}%</Text>
                        <Text style={styles.metricLabel}>Avg Score</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>{outcome.advancedPercentage}%</Text>
                        <Text style={styles.metricLabel}>Adv. Rate</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAnalytics} />}
            >
                {/* Requirements Progress */}
                <Card style={styles.card}>
                    <Card.Title title="Course Outcome Criteria" left={(props) => <MaterialCommunityIcons {...props} name="target" />} />
                    <Card.Content>
                        <View style={styles.progressRow}>
                            <View style={styles.progressLabel}>
                                <Text variant="bodyMedium">Games Completed</Text>
                                <Text variant="bodySmall" style={{ color: '#666' }}>{outcome.totalGames} / {outcome.requirements.minGames}</Text>
                            </View>
                            <ProgressBar
                                progress={Math.min(1, outcome.totalGames / outcome.requirements.minGames)}
                                color={outcome.totalGames >= outcome.requirements.minGames ? '#4CAF50' : '#2196F3'}
                                style={styles.progressBar}
                            />
                        </View>

                        <View style={styles.progressRow}>
                            <View style={styles.progressLabel}>
                                <Text variant="bodyMedium">Average Delta Score</Text>
                                <Text variant="bodySmall" style={{ color: '#666' }}>{outcome.averageDelta} / {outcome.requirements.minAvgDelta}</Text>
                            </View>
                            <ProgressBar
                                progress={Math.min(1, outcome.averageDelta / outcome.requirements.minAvgDelta)}
                                color={outcome.averageDelta >= outcome.requirements.minAvgDelta ? '#4CAF50' : '#FFC107'}
                                style={styles.progressBar}
                            />
                        </View>

                        <View style={styles.progressRow}>
                            <View style={styles.progressLabel}>
                                <Text variant="bodyMedium">Advanced Rate</Text>
                                <Text variant="bodySmall" style={{ color: '#666' }}>{outcome.advancedPercentage}% / {outcome.requirements.minAdvancedPercent}%</Text>
                            </View>
                            <ProgressBar
                                progress={Math.min(1, outcome.advancedPercentage / outcome.requirements.minAdvancedPercent)}
                                color={outcome.advancedPercentage >= outcome.requirements.minAdvancedPercent ? '#4CAF50' : '#FF5252'}
                                style={styles.progressBar}
                            />
                        </View>
                    </Card.Content>
                </Card>

                {/* Proficiency Distribution */}
                <Card style={styles.card}>
                    <Card.Title title="Proficiency Distribution" left={(props) => <MaterialCommunityIcons {...props} name="chart-pie" />} />
                    <Card.Content style={{ alignItems: 'center' }}>
                        {renderProficiencyChart()}
                    </Card.Content>
                </Card>

                {/* Performance Trend Chart */}
                {gameResults.length > 0 && (
                    <Card style={styles.card}>
                        <Card.Title title="Performance Trend" left={(props) => <MaterialCommunityIcons {...props} name="chart-line" />} />
                        <Card.Content>
                            <LineChart
                                data={{
                                    labels: gameResults.map((_, idx) => `G${idx + 1}`),
                                    datasets: [{
                                        data: gameResults.map(game => {
                                            const score = typeof game.score === 'number' ? game.score : 0;
                                            return Math.min(Math.max(score, 0), 100);
                                        }),
                                        color: () => '#6200EA',
                                        strokeWidth: 3
                                    }]
                                }}
                                width={screenWidth - 64}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#f8f8f8',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(98, 0, 234, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: {
                                        r: '6',
                                        strokeWidth: '2',
                                        stroke: '#6200EA'
                                    }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 }}>
                                Score progression across last {gameResults.length} games
                            </Text>
                        </Card.Content>
                    </Card>
                )}

                {/* Recommendations */}
                <Card style={styles.card}>
                    <Card.Title title="Improvement Plan" left={(props) => <MaterialCommunityIcons {...props} name="lightbulb-on" color="#FF9800" />} />
                    <Card.Content>
                        {!outcome.achieved ? (
                            <View>
                                {outcome.totalGames < outcome.requirements.minGames && (
                                    <View style={styles.recItem}>
                                        <MaterialCommunityIcons name="gamepad-variant" size={20} color="#2196F3" />
                                        <Text style={styles.recText}>Play more games to demonstrate consistent mastery. ({outcome.requirements.minGames - outcome.totalGames} more needed)</Text>
                                    </View>
                                )}
                                {outcome.averageDelta < outcome.requirements.minAvgDelta && (
                                    <View style={styles.recItem}>
                                        <MaterialCommunityIcons name="speedometer" size={20} color="#FFC107" />
                                        <Text style={styles.recText}>Focus on speed. Review core concepts to solve problems faster.</Text>
                                    </View>
                                )}
                                {outcome.advancedPercentage < outcome.requirements.minAdvancedPercent && (
                                    <View style={styles.recItem}>
                                        <MaterialCommunityIcons name="trending-up" size={20} color="#FF5252" />
                                        <Text style={styles.recText}>Aim for "Advanced" (Green) rating in individual games. Try standard difficulty games purely for speed practice.</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.recItem}>
                                <MaterialCommunityIcons name="certificate" size={24} color="#4CAF50" />
                                <Text style={styles.recText}>You have mastered this course level! You are ready to advance to more complex subjects or the next class level.</Text>
                            </View>
                        )}

                        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                            Back to Profile
                        </Button>
                    </Card.Content>
                </Card>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerSubject: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    badgeContainer: {
        marginLeft: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 16,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    metricLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    metricDivider: {
        width: 1,
        height: '80%',
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignSelf: 'center',
    },
    content: {
        flex: 1,
        marginTop: -20,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        elevation: 3,
    },
    progressRow: {
        marginBottom: 16,
    },
    progressLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    recItem: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: 12,
        borderRadius: 8,
    },
    recText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});

export default CourseProgressScreen;
