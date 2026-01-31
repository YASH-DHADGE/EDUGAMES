import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, StatusBar, Pressable, Dimensions, useWindowDimensions } from 'react-native';
import { Text, useTheme, ActivityIndicator, ProgressBar, Surface } from 'react-native-paper';
import { learnService } from '../../services/learnService';
import { progressService } from '../../services/progressService';
import { spacing, breakpoints } from '../../theme';
import Animated, { FadeInDown, FadeIn, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Responsive Web Constraints ---
const MAX_CONTENT_WIDTH = 1000;

const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.98);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

const ChapterListScreen = ({ route, navigation }: any) => {
    const { subjectId, subjectName } = route.params;
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [chapters, setChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isFocused = useIsFocused();
    const isWeb = Platform.OS === 'web';
    const isLargeScreen = width > breakpoints.mobile;

    // Dynamic max-width for web/large screens
    const containerStyle = isLargeScreen ? { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, width: '100%' } : { width: '100%' };

    const styles = createStyles(isDark, isWeb);

    useEffect(() => {
        if (isFocused) {
            loadChapters();
        }
    }, [isFocused]);

    const loadChapters = async () => {
        try {
            const data = await learnService.getChapters(subjectId);
            const chaptersWithSub = await Promise.all(data.map(async (chapter: any) => {
                try {
                    const subchapters = await learnService.getSubchapters(chapter._id);
                    return { ...chapter, subchapters };
                } catch (e) {
                    return { ...chapter, subchapters: [] };
                }
            }));
            setChapters(chaptersWithSub);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const ChapterCard = ({ item, index }: { item: any; index: number }) => {
        const [progress, setProgress] = useState<number>(0);
        const topicCount = item.subchapters?.length || 0;
        const hoverScale = useSharedValue(1);

        // Refresh progress when focused
        useEffect(() => {
            if (isFocused) {
                const loadProgress = async () => {
                    // Check generic chapter progress first
                    const chapterProgress = await progressService.getChapterProgress(item._id);
                    // Also check if any subchapter updates complete the chapter implicitly
                    // (This logic depends on your backend/service, for now we stick to stored progress)
                    setProgress(chapterProgress?.completed ? 1 : 0);
                };
                loadProgress();
            }
        }, [item._id, isFocused]);

        const getMapScreen = (name: string) => {
            if (name === 'Gravitation') return 'GravityMap';
            if (name === 'Current Electricity') return 'ElectricityMap';
            return null;
        };

        const handleRead = () => {
            // Default: Open Lesson Reader with First Subchapter
            if (item.subchapters && item.subchapters.length > 0) {
                navigation.navigate('LessonReader', {
                    subchapterId: item.subchapters[0]._id,
                    title: item.subchapters[0].name,
                    xpReward: 20,
                    chapterId: item._id,
                    subjectId: subjectId,
                    classId: route.params.classId
                });
            } else {
                (async () => {
                    try {
                        const chapterContent = await learnService.getChapterContent(item._id);
                        navigation.navigate('LessonReader', {
                            title: item.name,
                            content: chapterContent.combinedContent,
                            xpReward: 20,
                            chapterId: item._id,
                            subjectId: subjectId,
                            classId: route.params.classId
                        });
                    } catch (e) {
                        console.error("No content found");
                    }
                })();
            }
        };

        const mapScreen = getMapScreen(item.name);

        return (
            <Animated.View
                entering={isWeb ? undefined : FadeInDown.delay(index * 60).duration(400)}
                layout={Layout.springify()}
                style={{ width: '100%' }}
            >
                <Surface style={[styles.chapterCard, isWeb && styles.webCardHover]} elevation={isWeb ? 2 : 4}>
                    {/* Decorative Strip */}
                    <View style={[styles.accentStrip, { backgroundColor: progress === 1 ? '#10B981' : '#6366F1' }]} />

                    <View style={styles.cardContentWrapper}>
                        {/* Left Side: Number & Icon */}
                        <View style={styles.leftColumn}>
                            <LinearGradient
                                colors={progress === 1
                                    ? ['#10B981', '#059669']
                                    : ['#6366F1', '#8B5CF6']}
                                style={styles.numberBadge}
                            >
                                <Text style={styles.chapterNumber}>{index + 1}</Text>
                            </LinearGradient>
                            {progress === 1 && (
                                <View style={styles.completedBadge}>
                                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                                </View>
                            )}
                        </View>

                        {/* Middle: Info */}
                        <View style={styles.chapterInfo}>
                            <View style={styles.titleRow}>
                                <Text variant="titleMedium" style={styles.chapterTitle} numberOfLines={2}>
                                    {item.name}
                                </Text>
                            </View>

                            <View style={styles.metaContainer}>
                                <View style={styles.metaTag}>
                                    <MaterialCommunityIcons name="book-open-page-variant" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                                    <Text style={styles.metaText}>{topicCount} Topics</Text>
                                </View>
                                <View style={styles.metaDivider} />
                                <Text style={[styles.metaText, { color: progress === 1 ? '#10B981' : '#6366F1' }]}>
                                    {Math.round(progress * 100)}% Complete
                                </Text>
                            </View>

                            {/* Progress Bar */}
                            <View style={styles.miniProgressBarContainer}>
                                <View style={[styles.miniProgressBarFill, { width: `${progress * 100}%`, backgroundColor: progress === 1 ? '#10B981' : '#6366F1' }]} />
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionRow}>
                        {/* Read Button */}
                        <TouchableOpacity
                            style={[styles.actionButton, { flex: 1, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}
                            onPress={handleRead}
                        >
                            <MaterialCommunityIcons name="book-open-variant" size={18} color="#6366F1" />
                            <Text style={[styles.actionButtonText, { color: '#6366F1' }]}>Read Lesson</Text>
                        </TouchableOpacity>

                        {/* Map Button (If Available) */}
                        {mapScreen && (
                            <TouchableOpacity
                                style={[styles.actionButton, { flex: 1, backgroundColor: '#FFF7ED', marginLeft: 10 }]}
                                onPress={() => navigation.navigate(mapScreen)}
                            >
                                <MaterialCommunityIcons name="map-marker-path" size={18} color="#EA580C" />
                                <Text style={[styles.actionButtonText, { color: '#EA580C' }]}>Explore Map</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Surface>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <ScreenBackground style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6366F1" />
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground style={styles.container}>
            {/* Header Background Layer - Stretches Full Width */}
            <View style={styles.headerBackgroundWrapper}>
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            {/* Header Content - Constrained Width on Web */}
            <View style={[styles.headerContentWrapper, { paddingTop: insets.top + spacing.md }, isLargeScreen && styles.webHeaderContent]}>
                <View style={[styles.headerRow, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center' as const }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{subjectName}</Text>
                        <View style={styles.subtitleBadge}>
                            <Text style={styles.headerSubtitle}>
                                {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Content List - Constrained Width on Web */}
            <View style={[styles.contentContainer, isLargeScreen && { alignItems: 'center' }]}>
                <View style={[containerStyle, { flex: 1 }] as any}>
                    <FlatList
                        data={chapters}
                        renderItem={({ item, index }) => <ChapterCard item={item} index={index} />}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <Animated.View entering={FadeIn.delay(200)} style={styles.infoCardWrapper}>
                                <Surface style={styles.infoCard} elevation={2}>
                                    <View style={styles.infoIconBox}>
                                        <MaterialCommunityIcons name="trophy-award" size={28} color="#F59E0B" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoTitle}>Track Your Mastery</Text>
                                        <Text style={styles.infoText}>
                                            Complete chapters to build your streak and earn rewards!
                                        </Text>
                                    </View>
                                    {isLargeScreen && (
                                        <MaterialCommunityIcons name="chart-line" size={48} color={isDark ? "#334155" : "#E2E8F0"} style={{ opacity: 0.5 }} />
                                    )}
                                </Surface>
                            </Animated.View>
                        }
                    />
                </View>
            </View>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isWeb: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackgroundWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180, // Fixed height for header bg
        zIndex: 0,
    },
    headerGradient: {
        flex: 1,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#5B4B8A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    headerContentWrapper: {
        zIndex: 10,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
    },
    webHeaderContent: {
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)'
            }
        }) as any
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerSubtitle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    contentContainer: {
        flex: 1,
        marginTop: 20, // Push down slightly
        zIndex: 20, // Above header bottom curve
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
        paddingTop: 10,
    },

    // --- Card Styles ---
    chapterCard: {
        borderRadius: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : 'rgba(226, 232, 240, 0.6)',
    },
    webCardHover: {
        // Need to use state for hover styles on native/web compat, or just rely on wrapper scaling
    },
    accentStrip: {
        height: 4,
        width: '100%',
    },
    cardContentWrapper: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    leftColumn: {
        alignItems: 'center',
        marginRight: 16,
    },
    numberBadge: {
        width: 50,
        height: 50,
        borderRadius: 18, // Squircle
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    chapterNumber: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    completedBadge: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#10B981',
        borderRadius: 8,
        padding: 2,
        borderWidth: 2,
        borderColor: isDark ? '#1E293B' : '#fff',
    },
    chapterInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    chapterTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1E293B',
        lineHeight: 24,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    metaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: isDark ? '#334155' : '#F1F5F9', // Subtle pill
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    metaText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        fontWeight: '600',
    },
    metaDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDark ? '#475569' : '#CBD5E1',
        marginHorizontal: 8,
    },
    miniProgressBarContainer: {
        height: 4,
        backgroundColor: isDark ? '#334155' : '#E2E8F0',
        borderRadius: 2,
        overflow: 'hidden',
        width: '80%', // Not full width to look cleaner
    },
    miniProgressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    actionColumn: {
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    webActionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    mobileReadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF',
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        gap: 8,
    },
    mobileReadText: {
        color: '#6366F1',
        fontWeight: '700',
        fontSize: 13,
    },

    // New Action Button Styles
    actionRow: {
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        gap: spacing.sm,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // --- Info Card ---
    infoCardWrapper: {
        marginBottom: spacing.xl,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        gap: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    infoIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(245, 158, 11, 0.1)', // Light Orange transparent
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: isDark ? '#94A3B8' : '#64748B',
        lineHeight: 18,
    },
});

export default ChapterListScreen;
