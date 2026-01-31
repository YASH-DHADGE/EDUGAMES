import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Text, Surface, useTheme, ActivityIndicator, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

interface StudentWellbeing {
    _id: string;
    name: string;
    avatar: string | null;
    todayMinutes: number;
    weeklyMinutes: number;
    averageDaily: number;
    lastActive: string | null;
    streak: number;
}

interface WellbeingStats {
    students: StudentWellbeing[];
    classAverage: number;
    totalStudents: number;
    activeToday: number;
    mostActiveTime?: string;
}

const TeacherWellbeingScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const colors = theme.colors;
    const { isDesktop, maxContentWidth } = useResponsive();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<WellbeingStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'today' | 'weekly'>('today');
    const [sortAsc, setSortAsc] = useState(false);

    const styles = createStyles(isDark, isDesktop);

    const loadData = useCallback(async () => {
        try {
            console.log('Fetching wellbeing data...');
            const response = await api.get('/wellbeing/students');
            if (response.data && response.data.students) {
                setStats(response.data);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('Failed to load wellbeing data, using mock data:', error);
            // Internal Mock Data Fallback
            setStats({
                students: [
                    { _id: '1', name: 'Rahul Sharma', avatar: null, todayMinutes: 45, weeklyMinutes: 280, averageDaily: 40, lastActive: new Date().toISOString(), streak: 5 },
                    { _id: '2', name: 'Priya Patel', avatar: null, todayMinutes: 30, weeklyMinutes: 210, averageDaily: 30, lastActive: new Date().toISOString(), streak: 3 },
                    { _id: '3', name: 'Amit Kumar', avatar: null, todayMinutes: 60, weeklyMinutes: 420, averageDaily: 60, lastActive: new Date().toISOString(), streak: 7 },
                    { _id: '4', name: 'Sneha Gupta', avatar: null, todayMinutes: 15, weeklyMinutes: 120, averageDaily: 17, lastActive: new Date().toISOString(), streak: 2 },
                ],
                classAverage: 45,
                totalStudents: 4,
                activeToday: 3,
                mostActiveTime: '10:00 AM'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);


    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const getActivityStatus = (minutes: number): { label: string; color: string } => {
        if (minutes === 0) return { label: 'Inactive', color: '#EF4444' };
        if (minutes < 20) return { label: 'Low', color: '#F97316' };
        if (minutes < 45) return { label: 'Moderate', color: '#F59E0B' };
        return { label: 'Active', color: '#10B981' };
    };

    const getSortedStudents = (): StudentWellbeing[] => {
        if (!stats) return [];

        let filtered = stats.students.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'today':
                    comparison = b.todayMinutes - a.todayMinutes;
                    break;
                case 'weekly':
                    comparison = b.weeklyMinutes - a.weeklyMinutes;
                    break;
            }
            return sortAsc ? -comparison : comparison;
        });

        return filtered;
    };

    const toggleSort = (field: 'name' | 'today' | 'weekly') => {
        if (sortBy === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortBy(field);
            setSortAsc(false);
        }
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Compact Header */}
                <CompactHeader
                    title="Student Wellbeing"
                    subtitle="Monitor student screen time"
                    onBack={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
                    }
                >
                    <View style={[styles.contentContainer, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#8B5CF6" />
                            </View>
                        ) : (
                            <>
                                {/* Quick Stats */}
                                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.statsRow}>
                                    <Surface style={styles.statCard} elevation={2}>
                                        <MaterialCommunityIcons name="account-group" size={28} color="#8B5CF6" />
                                        <Text style={styles.statValue}>{stats?.totalStudents || 0}</Text>
                                        <Text style={styles.statLabel}>Total Students</Text>
                                    </Surface>
                                    <Surface style={styles.statCard} elevation={2}>
                                        <MaterialCommunityIcons name="account-check" size={28} color="#10B981" />
                                        <Text style={styles.statValue}>{stats?.activeToday || 0}</Text>
                                        <Text style={styles.statLabel}>Active Today</Text>
                                    </Surface>
                                    <Surface style={styles.statCard} elevation={2}>
                                        <MaterialCommunityIcons name="clock-outline" size={28} color="#F59E0B" />
                                        <Text style={styles.statValue}>{formatDuration(stats?.classAverage || 0)}</Text>
                                        <Text style={styles.statLabel}>Avg. Daily</Text>
                                    </Surface>
                                </Animated.View>

                                {/* Search Bar */}
                                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                                    <Searchbar
                                        placeholder="Search students..."
                                        onChangeText={setSearchQuery}
                                        value={searchQuery}
                                        style={styles.searchBar}
                                        inputStyle={styles.searchInput}
                                        iconColor={colors.onSurfaceVariant}
                                        placeholderTextColor={colors.onSurfaceVariant}
                                    />
                                </Animated.View>

                                {/* Sort Options */}
                                <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                                    <View style={styles.sortRow}>
                                        <Text style={styles.sortLabel}>Sort by:</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <TouchableOpacity
                                                style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
                                                onPress={() => toggleSort('name')}
                                            >
                                                <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                                                    Name {sortBy === 'name' && (sortAsc ? '↑' : '↓')}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.sortButton, sortBy === 'today' && styles.sortButtonActive]}
                                                onPress={() => toggleSort('today')}
                                            >
                                                <Text style={[styles.sortButtonText, sortBy === 'today' && styles.sortButtonTextActive]}>
                                                    Today {sortBy === 'today' && (sortAsc ? '↑' : '↓')}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.sortButton, sortBy === 'weekly' && styles.sortButtonActive]}
                                                onPress={() => toggleSort('weekly')}
                                            >
                                                <Text style={[styles.sortButtonText, sortBy === 'weekly' && styles.sortButtonTextActive]}>
                                                    Weekly {sortBy === 'weekly' && (sortAsc ? '↑' : '↓')}
                                                </Text>
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </View>
                                </Animated.View>

                                {/* Student List */}
                                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.studentList}>
                                    <Text style={styles.sectionTitle}>Students</Text>
                                    {getSortedStudents().length > 0 ? (
                                        getSortedStudents().map((student, index) => {
                                            const status = getActivityStatus(student.todayMinutes);
                                            return (
                                                <Surface key={student._id} style={styles.studentCard} elevation={2}>
                                                    <View style={styles.studentHeader}>
                                                        <View style={styles.studentInfo}>
                                                            <View style={styles.avatarContainer}>
                                                                {student.avatar ? (
                                                                    <View style={styles.avatar}>
                                                                        <Text style={styles.avatarText}>
                                                                            {student.name.charAt(0).toUpperCase()}
                                                                        </Text>
                                                                    </View>
                                                                ) : (
                                                                    <LinearGradient
                                                                        colors={['#8B5CF6', '#7C3AED']}
                                                                        style={styles.avatar}
                                                                    >
                                                                        <Text style={styles.avatarText}>
                                                                            {student.name.charAt(0).toUpperCase()}
                                                                        </Text>
                                                                    </LinearGradient>
                                                                )}
                                                                {student.streak > 0 && (
                                                                    <View style={styles.streakBadge}>
                                                                        <Text style={styles.streakText}>🔥{student.streak}</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <View style={styles.nameContainer}>
                                                                <Text style={styles.studentName}>{student.name}</Text>
                                                                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                                                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                                                                    <Text style={[styles.statusText, { color: status.color }]}>
                                                                        {status.label}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <View style={styles.studentStats}>
                                                        <View style={styles.studentStatItem}>
                                                            <Text style={styles.studentStatLabel}>Today</Text>
                                                            <Text style={styles.studentStatValue}>
                                                                {formatDuration(student.todayMinutes)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.divider} />
                                                        <View style={styles.studentStatItem}>
                                                            <Text style={styles.studentStatLabel}>This Week</Text>
                                                            <Text style={styles.studentStatValue}>
                                                                {formatDuration(student.weeklyMinutes)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.divider} />
                                                        <View style={styles.studentStatItem}>
                                                            <Text style={styles.studentStatLabel}>Avg/Day</Text>
                                                            <Text style={styles.studentStatValue}>
                                                                {formatDuration(student.averageDaily)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </Surface>
                                            );
                                        })
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <MaterialCommunityIcons name="account-search-outline" size={64} color={isDark ? "#475569" : "#CBD5E1"} />
                                            <Text style={styles.emptyText}>No students found</Text>
                                        </View>
                                    )}
                                </Animated.View>
                            </>
                        )}
                        <View style={{ height: 100 }} />
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
        shadowColor: '#8B5CF6',
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
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
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 4,
        textAlign: 'center',
        fontWeight: '600',
    },
    searchBar: {
        marginHorizontal: 16,
        marginTop: 20,
        borderRadius: 16,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        elevation: 2,
    },
    searchInput: {
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    sortLabel: {
        fontSize: 14,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
    },
    sortButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        marginRight: 8,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    sortButtonActive: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    sortButtonText: {
        fontSize: 13,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '500',
    },
    sortButtonTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    studentList: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    studentCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 24,
        padding: 20,
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    studentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    streakBadge: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        elevation: 2,
    },
    streakText: {
        fontSize: 12,
        fontWeight: '700',
    },
    nameContainer: {
        gap: 6,
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    studentStats: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#F1F5F9',
    },
    studentStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    studentStatLabel: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        marginBottom: 6,
        fontWeight: '500',
    },
    studentStatValue: {
        fontSize: 16,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    divider: {
        width: 1,
        backgroundColor: isDark ? '#334155' : '#F1F5F9',
        height: '60%',
        alignSelf: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: isDark ? '#94A3B8' : '#64748B',
        fontSize: 16,
    }
});

export default TeacherWellbeingScreen;
