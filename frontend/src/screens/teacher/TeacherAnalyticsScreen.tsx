import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Text, Searchbar, Chip, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../services/api';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

const TeacherAnalyticsScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const colors = theme.colors;
    const { isDesktop, maxContentWidth } = useResponsive();

    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('all');

    const styles = createStyles(isDark, isDesktop);

    useEffect(() => {
        fetchAnalytics();
    }, [classFilter]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            console.log(`Fetching analytics for class: ${classFilter}`);
            const response = await api.get(`/analytics/class/${classFilter}`);
            console.log('Analytics response:', response.data ? 'Data received' : 'No data');

            if (Array.isArray(response.data)) {
                // Sort by XP for proper ranking
                const sorted = response.data.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
                setStudents(sorted);
                setFilteredStudents(sorted);
            } else {
                console.warn('Analytics data is not an array:', response.data);
                setStudents([]);
                setFilteredStudents([]);
            }
        } catch (error: any) {
            console.error('Failed to fetch class analytics:', error);
            if (error.response?.status === 404) {
                // Handle specific case where no data might be found
                setStudents([]);
                setFilteredStudents([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        if (query) {
            const filtered = students.filter(student =>
                student.name.toLowerCase().includes(query.toLowerCase()) ||
                student.email.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents(students);
        }
    };

    const getRankColor = (rank: number): [string, string] => {
        switch (rank) {
            case 1: return ['#FFD700', '#FFA000'];
            case 2: return ['#C0C0C0', '#A0A0A0'];
            case 3: return ['#CD7F32', '#A0522D'];
            default: return ['#6366F1', '#4F46E5'];
        }
    };

    const topThree = filteredStudents.slice(0, 3);
    const restOfClass = filteredStudents.slice(3);

    return (
        <ScreenBackground>
            <View style={styles.container}>
                {/* Compact Header */}
                <CompactHeader
                    title="Class Analytics"
                    subtitle="Student Performance Overview"
                    onBack={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.contentContainer, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>

                        {/* Filter Chips */}
                        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterContent}>
                                <Chip
                                    selected={classFilter === 'all'}
                                    onPress={() => setClassFilter('all')}
                                    style={[styles.chip, classFilter === 'all' && styles.chipActive]}
                                    textStyle={classFilter === 'all' ? styles.chipTextActive : styles.chipText}
                                    showSelectedOverlay
                                >
                                    All Classes
                                </Chip>
                                {['6', '7', '8', '9', '10'].map(c => (
                                    <Chip
                                        key={c}
                                        selected={classFilter === c}
                                        onPress={() => setClassFilter(c)}
                                        style={[styles.chip, classFilter === c && styles.chipActive]}
                                        textStyle={classFilter === c ? styles.chipTextActive : styles.chipText}
                                        showSelectedOverlay
                                    >
                                        Class {c}
                                    </Chip>
                                ))}
                            </ScrollView>
                        </Animated.View>

                        {/* Search */}
                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <Searchbar
                                placeholder="Search students..."
                                onChangeText={onChangeSearch}
                                value={searchQuery}
                                style={styles.searchBar}
                                inputStyle={styles.searchInput}
                                iconColor={colors.onSurfaceVariant}
                                placeholderTextColor={colors.onSurfaceVariant}
                            />
                        </Animated.View>

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4F46E5" />
                            </View>
                        ) : (
                            <View style={styles.mainContent}>
                                {/* Left Column: Stats & Podium */}
                                <View style={styles.leftColumn}>
                                    {/* Stats Grid */}
                                    {students.length > 0 && (
                                        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.statsGrid}>
                                            <Surface style={styles.statCard} elevation={2}>
                                                <MaterialCommunityIcons name="account-group" size={28} color="#4F46E5" />
                                                <Text style={styles.statValue}>{students.length}</Text>
                                                <Text style={styles.statLabel}>Students</Text>
                                            </Surface>

                                            <Surface style={styles.statCard} elevation={2}>
                                                <MaterialCommunityIcons name="chart-line" size={28} color="#10B981" />
                                                <Text style={styles.statValue}>
                                                    {Math.round(students.reduce((sum, s) => sum + (s.xp || 0), 0) / students.length)}
                                                </Text>
                                                <Text style={styles.statLabel}>Avg XP</Text>
                                            </Surface>

                                            <Surface style={styles.statCard} elevation={2}>
                                                <MaterialCommunityIcons name="checkbox-marked-circle" size={28} color="#F43F5E" />
                                                <Text style={styles.statValue}>
                                                    {Math.round(students.reduce((sum, s) => sum + (s.completedTasks || 0), 0) / students.length)}
                                                </Text>
                                                <Text style={styles.statLabel}>Avg Tasks</Text>
                                            </Surface>
                                        </Animated.View>
                                    )}

                                    {/* Top 3 Podium */}
                                    {topThree.length > 0 && (
                                        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.podiumSection}>
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
                                                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].name}</Text>
                                                            <Text style={styles.podiumXP}>{topThree[1].xp || 0} XP</Text>
                                                        </LinearGradient>
                                                        <View style={[styles.podiumBase, { height: 70, backgroundColor: isDark ? '#475569' : '#E2E8F0', opacity: 0.5 }]} />
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
                                                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].name}</Text>
                                                            <Text style={styles.podiumXP}>{topThree[0].xp || 0} XP</Text>
                                                        </LinearGradient>
                                                        <View style={[styles.podiumBase, { height: 100, backgroundColor: '#FFD700', opacity: 0.3 }]} />
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
                                                            <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name}</Text>
                                                            <Text style={styles.podiumXP}>{topThree[2].xp || 0} XP</Text>
                                                        </LinearGradient>
                                                        <View style={[styles.podiumBase, { height: 50, backgroundColor: '#CD7F32', opacity: 0.3 }]} />
                                                    </View>
                                                )}
                                            </View>
                                        </Animated.View>
                                    )}
                                </View>

                                {/* Right Column: Full Student List */}
                                <View style={styles.rightColumn}>
                                    <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.listSection}>
                                        <Text style={styles.sectionTitle}>📊 All Students</Text>

                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((student: any, index: number) => (
                                                <TouchableOpacity
                                                    key={student.id}
                                                    onPress={() => (navigation as any).navigate('StudentAnalytics', {
                                                        studentId: student.id,
                                                        studentName: student.name
                                                    })}
                                                >
                                                    <Surface
                                                        style={[
                                                            styles.studentCard,
                                                            index < 3 && styles.topThreeCard
                                                        ]}
                                                        elevation={1}
                                                    >
                                                        <View style={styles.studentInfo}>
                                                            <LinearGradient
                                                                colors={index < 3 ? getRankColor(index + 1) : isDark ? ['#334155', '#1E293B'] : ['#E2E8F0', '#CBD5E1']}
                                                                style={styles.rankBadge}
                                                            >
                                                                <Text style={styles.rankText}>{index + 1}</Text>
                                                            </LinearGradient>

                                                            <View style={styles.studentDetails}>
                                                                <Text style={styles.studentName}>{student.name}</Text>
                                                                <Text style={styles.studentEmail}>{student.email}</Text>

                                                                <View style={styles.studentStats}>
                                                                    <View style={styles.statItem}>
                                                                        <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
                                                                        <Text style={styles.studentStatText}>{student.xp || 0} XP</Text>
                                                                    </View>
                                                                    <View style={styles.statItem}>
                                                                        <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                                                                        <Text style={styles.studentStatText}>{student.completedTasks || 0} Tasks</Text>
                                                                    </View>
                                                                    <View style={styles.statItem}>
                                                                        <MaterialCommunityIcons name="fire" size={14} color="#F43F5E" />
                                                                        <Text style={styles.studentStatText}>{student.streak || 0} Day Streak</Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        </View>

                                                        <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? "#64748B" : "#94A3B8"} />
                                                    </Surface>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <View style={styles.emptyState}>
                                                <MaterialCommunityIcons name="account-search-outline" size={64} color={isDark ? "#475569" : "#CBD5E1"} />
                                                <Text style={styles.emptyText}>No students found</Text>
                                                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
                                            </View>
                                        )}
                                    </Animated.View>
                                </View>
                            </View>
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
    filterScrollView: {
        marginTop: 16,
        marginBottom: 8,
    },
    filterContent: {
        paddingHorizontal: 16,
    },
    chip: {
        marginRight: 8,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    chipActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    chipText: {
        color: isDark ? '#94A3B8' : '#64748B',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    searchBar: {
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 16,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        elevation: 2,
    },
    searchInput: {
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 4,
        fontWeight: '600',
    },
    podiumSection: {
        marginTop: 32,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 24,
        marginLeft: 4,
    },
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 16,
        marginBottom: 32,
        height: 200,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
    },
    podiumCard: {
        width: '100%',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 4,
        elevation: 4,
    },
    firstPlace: {
        paddingVertical: 20,
    },
    secondPlace: {
        paddingVertical: 16,
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
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    listSection: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    studentCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    topThreeCard: {
        borderWidth: 2,
        borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : '#FFD700',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    studentDetails: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 2,
    },
    studentEmail: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        marginBottom: 8,
    },
    studentStats: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    studentStatText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: isDark ? '#64748B' : '#94A3B8',
        marginTop: 8,
        textAlign: 'center',
    },
    mainContent: {
        flexDirection: isDesktop ? 'row' : 'column',
        gap: isDesktop ? 24 : 0,
        width: '100%',
    },
    leftColumn: {
        flex: isDesktop ? 4 : undefined,
        width: '100%',
    },
    rightColumn: {
        flex: isDesktop ? 6 : undefined,
        width: '100%',
    },
});

export default TeacherAnalyticsScreen;
