import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import HomeCard from '../components/HomeCard';
import CustomButton from '../components/ui/CustomButton';
import { useResponsive } from '../hooks/useResponsive';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { spacing, gradients, colors, borderRadius } from '../theme';
import { getStaggerDelay } from '../utils/animations';
import UserGreetingCard, { AVATAR_OPTIONS } from '../components/UserGreetingCard';
import XPProgressCard from '../components/XPProgressCard';
import ConfettiAnimation from '../components/ConfettiAnimation';
import { useTranslation } from '../i18n';
import { getAllSimulations, Simulation } from '../data/phetMappings';
import SimulationViewer from '../components/learn/SimulationViewer';
import StreakCelebration from '../components/StreakCelebration';
import OnboardingTutorial from '../components/OnboardingTutorial';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MobileHomeHeader from '../components/home/MobileHomeHeader';
import MobileHomeScreen from './MobileHomeScreen';

const HomeScreen = ({ navigation }: any) => {
    const { user, xp, streak } = useAuth();
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { containerStyle, numColumns, isMobile, width } = useResponsive();
    const { t } = useTranslation();
    const [showConfetti, setShowConfetti] = useState(false);
    const [showStreakCelebration, setShowStreakCelebration] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [prevLevel, setPrevLevel] = useState(Math.floor(xp / 100) + 1);
    const [prevStreak, setPrevStreak] = useState(streak);
    const [selectedSim, setSelectedSim] = useState<Simulation | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);

    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    const xpForNextLevel = 100;
    const featuredSimulations = getAllSimulations().slice(0, 6);

    const styles = createStyles(isDark);

    useEffect(() => {
        if (level > prevLevel) {
            setShowConfetti(true);
            setPrevLevel(level);
        }
    }, [level, prevLevel]);

    useEffect(() => {
        if (streak > prevStreak) {
            setShowStreakCelebration(true);
            setPrevStreak(streak);
        }
    }, [streak, prevStreak]);

    useEffect(() => {
        const checkOnboarding = async () => {
            const completed = await AsyncStorage.getItem('onboardingCompleted');
            if (!completed) {
                setShowOnboarding(true);
            }
        };
        checkOnboarding();
    }, []);

    const MENU_ITEMS = [
        {
            id: '1',
            title: t('home.lessons'),
            icon: 'book-open-variant',
            color: '#E8DEF8',
            gradient: ['#4A00E0', '#8E2DE2'], // Deep Purple
            onPress: () => navigation.navigate('Learn', { screen: 'LearnDashboard' }),
        },
        {
            id: '2',
            title: t('home.quiz'),
            icon: 'help-circle-outline',
            color: '#F2B8B5',
            gradient: ['#ec008c', '#fc6767'], // Pink-Red
            onPress: () => navigation.navigate('Learn', { screen: 'Quiz' }),
        },
        {
            id: '3',
            title: t('home.games'),
            icon: 'gamepad-variant',
            color: '#C4E7FF',
            gradient: ['#11998e', '#38ef7d'], // Teal-Green (Fun/Growth)
            onPress: () => navigation.navigate('Games'),
        },
        {
            id: '4',
            title: t('home.rewards'),
            icon: 'trophy-outline',
            color: '#F7D486',
            gradient: ['#f12711', '#f5af19'], // Gold-Orange
            onPress: () => navigation.navigate('Rewards'),
        },
        {
            id: '5',
            title: t('home.science'),
            icon: 'flask-outline',
            color: '#C3EED0',
            gradient: ['#00d2ff', '#3a7bd5'], // Cyan-Blue
            onPress: () => navigation.navigate('Learn', { screen: 'ModelList' }),
        },
        {
            id: '6',
            title: t('home.sync'),
            icon: 'cloud-sync-outline',
            color: '#E0E0E0',
            gradient: ['#4e4376', '#2b5876'], // Deep Blue/Purple (Tech feel)
            onPress: () => navigation.navigate('Sync'),
        },
        {
            id: '7',
            title: 'Leaderboard',
            icon: 'podium-gold',
            color: '#FFD700',
            gradient: ['#FDC830', '#F37335'], // Rich Gold
            onPress: () => navigation.navigate('Leaderboard'),
        },
        {
            id: '8',
            title: 'Classroom',
            icon: 'school-outline',
            color: '#A78BFA',
            gradient: ['#8E2DE2', '#4A00E0'], // Electric Violet
            onPress: () => navigation.navigate('Classroom'),
        },
        {
            id: '9',
            title: 'AI Tutor',
            icon: 'robot-outline',
            color: '#B2EBF2',
            gradient: ['#00ACC1', '#0097A7'], // Cyan/Teal
            onPress: () => navigation.navigate('Chatbot'),
        },
    ];

    const getSimIcon = (subject: string) => {
        const icons: Record<string, any> = {
            'Physics': 'atom',
            'Chemistry': 'flask',
            'Math': 'calculator',
            'Biology': 'dna'
        };
        return icons[subject] || 'school';
    };

    const getSimGradient = (subject: string) => {
        const gradients: Record<string, string[]> = {
            'Physics': ['#2196F3', '#42A5F5'],
            'Chemistry': ['#4CAF50', '#66BB6A'],
            'Math': ['#FF9800', '#FFB74D'],
            'Biology': ['#9C27B0', '#BA68C8']
        };
        return gradients[subject] || ['#607D8B', '#90A4AE'];
    };

    if (isMobile) {
        return <MobileHomeScreen navigation={navigation} />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
                removeClippedSubviews={true}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.headerBackground, { paddingTop: 0 }]}
                >
                    {/* Decorative circles */}
                    <View style={[styles.decorativeCircle, { top: -60, right: -40, width: 180, height: 180 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -50, left: -30, width: 150, height: 150 }]} />

                    <Animated.View entering={FadeInDown.duration(600)} style={styles.headerContent}>
                        {isMobile ? (
                            <MobileHomeHeader
                                user={user}
                                streak={streak}
                                xp={xp}
                                level={level}
                                onProfilePress={() => navigation.navigate('Profile')}
                                onSearchPress={() => navigation.navigate('Learn')}
                            />
                        ) : (
                            <>
                                <View style={styles.greetingRow}>
                                    <UserGreetingCard
                                        userName={user?.name || 'Guest'}
                                        streak={streak}
                                        avatarId={parseInt(user?.avatar || '1')}
                                        variant="light"
                                    />
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <LanguageSwitcher />
                                        <TouchableOpacity
                                            style={styles.searchButton}
                                            onPress={() => navigation.navigate('Learn')}
                                        >
                                            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <XPProgressCard
                                    level={level}
                                    currentXP={xpInLevel}
                                    xpForNextLevel={xpForNextLevel}
                                    totalXP={xp}
                                    variant="light"
                                />
                            </>
                        )}
                    </Animated.View>
                </LinearGradient>

                {/* Daily Goal Card */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.dailyGoalSection}>
                    <Surface style={styles.dailyGoalCard} elevation={3}>
                        <View style={styles.dailyGoalHeader}>
                            <View style={styles.dailyGoalIconContainer}>
                                <MaterialCommunityIcons name="target" size={24} color={colors.primary} />
                            </View>
                            <Text variant="titleMedium" style={styles.dailyGoalTitle}>
                                Daily Goal
                            </Text>
                            <Text variant="titleMedium" style={styles.dailyGoalProgress}>
                                {xpInLevel}/50 XP
                            </Text>
                        </View>

                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarBg}>
                                <LinearGradient
                                    colors={[gradients.primary[0], gradients.primary[1]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${Math.min((xpInLevel / 50) * 100, 100)}%` }]}
                                />
                            </View>
                        </View>

                        <Text variant="bodySmall" style={styles.dailyGoalMessage}>
                            💪 {xpInLevel >= 50 ? "Goal achieved! Great work!" : "Keep it up! You're almost there."}
                        </Text>
                    </Surface>
                </Animated.View>
                {/* My Subjects Section Removed */}

                {/* Recommended Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.recommendedSection}>
                    <View style={styles.sectionHeader}>
                        <LinearGradient
                            colors={['#FF9800', '#FFB74D']}
                            style={styles.sectionIconBg}
                        >
                            <MaterialCommunityIcons name="star" size={20} color="#fff" />
                        </LinearGradient>
                        <Text variant="titleLarge" style={styles.sectionTitle}>
                            Recommended for You
                        </Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.recommendedScroll}
                    >
                        {[1, 2, 3].map((item, index) => (
                            <Animated.View
                                key={item}
                                entering={FadeInRight.delay(index * 100).duration(500)}
                            >
                                <TouchableOpacity style={styles.recommendedCard} activeOpacity={0.8}>
                                    <View style={styles.recommendedIconContainer}>
                                        <MaterialCommunityIcons name="star" size={32} color="#FF9800" />
                                    </View>
                                    <View style={styles.recommendedContent}>
                                        <Text variant="titleSmall" style={styles.recommendedTitle}>
                                            Daily Challenge
                                        </Text>
                                        <Text variant="bodySmall" style={styles.recommendedSubtitle}>
                                            Earn 50 XP
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Featured Simulations */}
                <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.simulationsSection}>
                    <View style={styles.sectionHeader}>
                        <LinearGradient
                            colors={['#2196F3', '#42A5F5']}
                            style={styles.sectionIconBg}
                        >
                            <MaterialCommunityIcons name="flask" size={20} color="#fff" />
                        </LinearGradient>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Featured Simulations</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.simulationsScroll}
                    >
                        {featuredSimulations.map((sim, index) => {
                            const simGradient = getSimGradient(sim.subject);
                            const primaryColor = simGradient[0];

                            return (
                                <Animated.View
                                    key={sim.fileName}
                                    entering={FadeInRight.delay(index * 100).duration(500)}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setSelectedSim(sim);
                                            setViewerVisible(true);
                                        }}
                                    >
                                        <View style={[styles.simCard, { shadowColor: primaryColor }]}>
                                            <LinearGradient
                                                colors={[simGradient[0], simGradient[1]] as const}
                                                style={styles.simIconContainer}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <MaterialCommunityIcons
                                                    name={getSimIcon(sim.subject)}
                                                    size={36}
                                                    color="#fff"
                                                />
                                            </LinearGradient>

                                            <View style={styles.simCardContent}>
                                                <Text variant="titleSmall" style={styles.simTitle} numberOfLines={2}>
                                                    {sim.title}
                                                </Text>
                                                <View style={[styles.simSubjectBadge, { backgroundColor: primaryColor + '15' }]}>
                                                    <Text style={[styles.simSubjectText, { color: primaryColor }]}>
                                                        {sim.subject}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>

                    <CustomButton
                        variant="outlined"
                        icon="flask-outline"
                        onPress={() => navigation.navigate('Learn', {
                            screen: 'SimulationList',
                            params: { showAll: true }
                        })}
                        style={styles.exploreButton}
                    >
                        Explore All Simulations
                    </CustomButton>
                </Animated.View>

                {/* Explore Section Title */}
                <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.exploreSection}>
                    <View style={styles.sectionHeader}>
                        <LinearGradient
                            colors={['#9C27B0', '#BA68C8']}
                            style={styles.sectionIconBg}
                        >
                            <MaterialCommunityIcons name="compass-outline" size={20} color="#fff" />
                        </LinearGradient>
                        <Text variant="titleLarge" style={styles.sectionTitle}>
                            {t('home.explore')}
                        </Text>
                    </View>
                </Animated.View>

                {/* Menu Items Grid */}
                <View style={styles.menuGrid}>
                    {MENU_ITEMS.map((item, index) => {
                        const gap = spacing.md;
                        const padding = spacing.md;
                        const availableWidth = containerStyle.maxWidth === '100%' ? width : (typeof containerStyle.maxWidth === 'number' ? containerStyle.maxWidth : width);
                        // Calculate width: (Total Width - Horizontal Padding - (Gaps)) / Columns
                        const itemWidth = (width - (padding * 2) - (gap * (numColumns - 1))) / numColumns;

                        return (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(getStaggerDelay(index + 6)).duration(500).springify()}
                                style={{ width: itemWidth }}
                            >
                                <HomeCard
                                    title={item.title}
                                    icon={item.icon}
                                    color={item.color}
                                    gradient={item.gradient}
                                    onPress={item.onPress}
                                />
                            </Animated.View>
                        );
                    })}
                </View>
            </ScrollView >

            {selectedSim && (
                <SimulationViewer
                    visible={viewerVisible}
                    title={selectedSim.title}
                    fileName={selectedSim.fileName}
                    onClose={() => setViewerVisible(false)}
                />
            )}

            <StreakCelebration
                visible={showStreakCelebration}
                streak={streak}
                onClose={() => setShowStreakCelebration(false)}
            />

            {
                showOnboarding && (
                    <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
                )
            }

            <ConfettiAnimation
                isVisible={showConfetti}
                onComplete={() => setShowConfetti(false)}
            />
        </View >
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#0F172A' : '#F5F5F5',
    },
    headerBackground: {
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 0,
        paddingBottom: spacing.xs,
        gap: 0,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    searchButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: spacing.sm,
        borderRadius: 14,
        height: 48,
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dailyGoalSection: {
        paddingHorizontal: spacing.lg,
        marginTop: -spacing.xl,
        marginBottom: spacing.md,
    },
    dailyGoalCard: {
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 20,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    dailyGoalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    dailyGoalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dailyGoalTitle: {
        fontWeight: '700',
        flex: 1,
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    dailyGoalProgress: {
        fontWeight: '800',
        color: colors.primary,
    },
    progressBarContainer: {
        marginBottom: spacing.sm,
    },
    progressBarBg: {
        height: 12,
        backgroundColor: isDark ? '#334155' : '#F0F0F0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    dailyGoalMessage: {
        color: isDark ? '#CBD5E1' : '#666',
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 100,
    },
    subjectsSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionMainTitle: {
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    changeClassLink: {
        color: '#6A5AE0',
        fontWeight: '600',
        fontSize: 14,
    },
    subjectsScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    subjectChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: spacing.sm,
    },
    subjectChipActive: {
        backgroundColor: '#6A5AE0',
        borderColor: '#6A5AE0',
    },
    subjectChipText: {
        fontWeight: '600',
        color: '#666',
        fontSize: 14,
    },
    subjectChipTextActive: {
        color: '#fff',
    },
    recommendedSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    sectionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        fontSize: 18,
    },
    recommendedScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    recommendedCard: {
        width: 200,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderRadius: 16,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        marginRight: spacing.sm,
    },
    recommendedIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#FF9800' + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recommendedContent: {
        flex: 1,
    },
    recommendedTitle: {
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        marginBottom: 2,
    },
    recommendedSubtitle: {
        color: isDark ? '#CBD5E1' : '#666',
        fontSize: 12,
    },
    simulationsSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    simulationsScroll: {
        paddingBottom: spacing.md,
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    simCard: {
        width: 170,
        height: 210,
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
        alignItems: 'center',
        padding: spacing.lg,
        justifyContent: 'space-between',
    },
    simIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    simCardContent: {
        alignItems: 'center',
        width: '100%',
        gap: spacing.xs,
    },
    simTitle: {
        fontWeight: '700',
        textAlign: 'center',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        fontSize: 14,
        lineHeight: 19,
    },
    simSubjectBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: 12,
    },
    simSubjectText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    exploreButton: {
        marginTop: spacing.lg,
        marginHorizontal: spacing.lg,
        borderRadius: 16,
        borderColor: '#6A5AE0',
        borderWidth: 2,
    },
    exploreSection: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
    },
});

export default HomeScreen;
