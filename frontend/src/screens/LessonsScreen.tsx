import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLessons, Lesson } from '../services/lessonsService';
import { useResponsive } from '../hooks/useResponsive';
import LessonCard from '../components/LessonCard';
import ProgressWidget from '../components/ProgressWidget';
import GradientBackground from '../components/ui/GradientBackground';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { spacing, gradients, colors, borderRadius } from '../theme';
import { getStaggerDelay } from '../utils/animations';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LessonsScreen = () => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { containerStyle, isMobile, getGridColumns } = useResponsive();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'inProgress' | 'completed'>('all');

    const loadLessons = async () => {
        try {
            const data = await getLessons();
            setLessons(data);
        } catch (error) {
            console.error('Failed to load lessons:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadLessons();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadLessons();
    };

    const numColumns = getGridColumns();

    // Filter lessons based on search and filter
    const filteredLessons = lessons.filter(lesson => {
        const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
        // For now, all lessons pass filter (you can add completion status later)
        return matchesSearch;
    });

    const renderLesson = ({ item, index }: { item: Lesson; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(getStaggerDelay(index, 80)).duration(500)}
            style={{ flex: 1 / numColumns, maxWidth: isMobile ? '100%' : `${100 / numColumns}%` }}
        >
            <LessonCard
                lesson={item}
                onPress={() => console.log('Lesson pressed:', item.id)}
                index={index}
            />
        </Animated.View>
    );

    const renderEmptyState = () => (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={64} color="#6A5AE0" />
            </View>
            <Text variant="titleLarge" style={styles.emptyTitle}>No Lessons Found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {searchQuery ? "Try adjusting your search" : "Check back later for new lessons"}
            </Text>
        </Animated.View>
    );

    if (loading) {
        return (
            <GradientBackground colors={gradients.onboarding}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text variant="titleMedium" style={styles.loadingText}>
                        Loading lessons...
                    </Text>
                </View>
            </GradientBackground>
        );
    }

    return (
        <View style={styles.container}>
            {/* Enhanced Header */}
            <LinearGradient
                colors={['#6A5AE0', '#8B7CF6']}
                style={[styles.headerBackground, { paddingTop: insets.top + spacing.md }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Decorative elements */}
                <View style={[styles.decorativeCircle, { top: -30, right: -30, width: 120, height: 120 }]} />
                <View style={[styles.decorativeCircle, { bottom: -20, left: -20, width: 80, height: 80 }]} />

                <View style={styles.headerContent}>
                    <Animated.View entering={FadeInDown.duration(500)}>
                        <View style={styles.headerRow}>
                            <View>
                                <Text variant="headlineMedium" style={styles.headerTitle}>
                                    Lessons
                                </Text>
                                <Text variant="bodyMedium" style={styles.headerSubtitle}>
                                    Choose a topic to start learning 📚
                                </Text>
                            </View>
                            <View style={styles.headerIcon}>
                                <MaterialCommunityIcons name="book-education" size={28} color="#fff" />
                            </View>
                        </View>

                        {/* Progress Widget */}
                        <View style={styles.progressContainer}>
                            <ProgressWidget completed={3} total={lessons.length} />
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search lessons..."
                                placeholderTextColor="#94a3b8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </LinearGradient>

            {/* Filter Chips */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.filterContainer}>
                {[
                    { key: 'all', label: 'All', icon: 'view-grid' },
                    { key: 'inProgress', label: 'In Progress', icon: 'clock-outline' },
                    { key: 'completed', label: 'Completed', icon: 'check-circle-outline' },
                ].map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterChip,
                            activeFilter === filter.key && styles.filterChipActive
                        ]}
                        onPress={() => setActiveFilter(filter.key as any)}
                    >
                        <MaterialCommunityIcons
                            name={filter.icon as any}
                            size={16}
                            color={activeFilter === filter.key ? '#fff' : '#6A5AE0'}
                        />
                        <Text style={[
                            styles.filterChipText,
                            activeFilter === filter.key && styles.filterChipTextActive
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>

            {/* Content */}
            <View style={styles.contentContainer}>
                <FlatList
                    data={filteredLessons}
                    renderItem={renderLesson}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    key={numColumns}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={numColumns > 1 ? { gap: spacing.md } : undefined}
                    ListEmptyComponent={renderEmptyState}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerBackground: {
        paddingBottom: spacing.lg,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    progressContainer: {
        marginBottom: spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        height: 44,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: '#6A5AE0',
        borderColor: '#6A5AE0',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6A5AE0',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    contentContainer: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: spacing.lg,
        color: colors.primary,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: 120,
        gap: spacing.md,
    },
    headerTitle: {
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.85)',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: spacing.xxxl,
        paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: '#666',
        textAlign: 'center',
    },
});

export default LessonsScreen;
