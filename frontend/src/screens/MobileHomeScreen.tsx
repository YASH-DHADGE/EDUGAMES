import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Image, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { spacing, gradients, colors } from '../theme';
import { getAllSimulations, Simulation } from '../data/phetMappings';
import { useTranslation } from '../i18n';
import { AVATAR_OPTIONS } from '../components/UserGreetingCard';
import SimulationViewer from '../components/learn/SimulationViewer';
import OnboardingTutorial from '../components/OnboardingTutorial';
import StreakCelebration from '../components/StreakCelebration';
import ConfettiAnimation from '../components/ConfettiAnimation';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const MobileHomeScreen = ({ navigation }: any) => {
    const { user, xp, streak } = useAuth();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    const bgColor = isDark ? '#121212' : '#F5F7FA';
    const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
    const secondaryTextColor = isDark ? '#B0B0B0' : '#666666';
    const cardBgColor = isDark ? '#1E1E1E' : '#FFFFFF';

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
            title: t('home.lessons') || 'Lessons',
            icon: 'book-open-variant',
            gradient: ['#E040FB', '#EA80FC'],
            onPress: () => navigation.navigate('Learn', { screen: 'LearnDashboard' }),
        },
        {
            id: '2',
            title: t('home.quiz') || 'Quiz',
            icon: 'help-circle-outline',
            gradient: ['#FF4081', '#FF80AB'],
            onPress: () => navigation.navigate('Learn', { screen: 'Quiz' }),
        },
        {
            id: '3',
            title: t('home.games') || 'Games',
            icon: 'gamepad-variant',
            gradient: ['#00B0FF', '#40C4FF'],
            onPress: () => navigation.navigate('Games'),
        },
        {
            id: '4',
            title: 'Rewards',
            icon: 'trophy-outline',
            gradient: ['#FFAB00', '#FFD740'],
            onPress: () => navigation.navigate('Rewards'),
        },
        {
            id: '5',
            title: 'Science',
            icon: 'flask-outline',
            gradient: ['#00E676', '#69F0AE'],
            onPress: () => navigation.navigate('Science'),
        },
        {
            id: '6',
            title: 'Sync',
            icon: 'cloud-sync',
            gradient: ['#78909C', '#B0BEC5'],
            onPress: () => navigation.navigate('Sync'),
        },
        {
            id: '7',
            title: 'Leaderboard',
            icon: 'podium',
            gradient: ['#FFD700', '#FFE57F'],
            onPress: () => navigation.navigate('Leaderboard'),
        },
        {
            id: '8',
            title: t('home.classroom'),
            icon: 'school',
            gradient: ['#26A69A', '#80CBC4'],
            onPress: () => navigation.navigate('Classroom'),
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Compact Header */}
                <LinearGradient
                    colors={gradients.primary as any}
                    style={[styles.header, { paddingTop: insets.top + 8 }]}
                >
                    {/* User Row */}
                    <View style={styles.userRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarButton}>
                            <Image
                                source={(AVATAR_OPTIONS.find(a => a.id === parseInt(user?.avatar || '1')) || AVATAR_OPTIONS[0]).source}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                        <View style={styles.greeting}>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.nameText}>{user?.name || 'Student'}</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <LanguageToggle />
                            <ThemeToggle />
                            <View style={styles.streakBadge}>
                                <MaterialCommunityIcons name="fire" size={16} color="#FFD700" />
                                <Text style={styles.streakText}>{streak}</Text>
                            </View>
                        </View>
                    </View>

                    {/* XP Progress */}
                    <View style={styles.xpCard}>
                        <View style={styles.xpRow}>
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelText}>LVL {level}</Text>
                            </View>
                            <Text style={styles.xpText}>{xpInLevel}/{xpForNextLevel} XP</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <LinearGradient
                                colors={['#00C48C', '#64FFDA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: `${(xpInLevel / xpForNextLevel) * 100}%` }]}
                            />
                        </View>
                    </View>
                </LinearGradient>

                {/* Content */}
                <View style={styles.content}>
                    {/* Daily Goal */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
                        <Surface style={[styles.dailyGoalCard, { backgroundColor: cardBgColor }]} elevation={2}>
                            <View style={styles.dailyGoalHeader}>
                                <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
                                <Text style={[styles.dailyGoalTitle, { color: textColor }]}>Daily Goal</Text>
                                <Text style={[styles.dailyGoalXP, { color: secondaryTextColor }]}>{xpInLevel}/50 XP</Text>
                            </View>
                            <View style={styles.dailyProgressBar}>
                                <LinearGradient
                                    colors={[gradients.primary[0], gradients.primary[1]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.dailyProgressFill, { width: `${Math.min((xpInLevel / 50) * 100, 100)}%` }]}
                                />
                            </View>
                        </Surface>
                    </Animated.View>

                    {/* Explore */}
                    <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('home.explore')}</Text>
                        <View style={styles.grid}>
                            {MENU_ITEMS.map((item, index) => {
                                const isLast = index === MENU_ITEMS.length - 1 && MENU_ITEMS.length % 2 !== 0;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.gridItem, isLast && styles.gridItemFull]}
                                        activeOpacity={0.9}
                                        onPress={item.onPress}
                                    >
                                        <LinearGradient
                                            colors={item.gradient as any}
                                            style={styles.gridGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <MaterialCommunityIcons name={item.icon as any} size={28} color="#fff" />
                                            <Text style={styles.gridText}>{item.title}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* Simulations */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Featured Simulations</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Learn', {
                                    screen: 'SimulationList',
                                    params: { showAll: true }
                                })}
                            >
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.simScroll}>
                            {featuredSimulations.map((sim) => (
                                <TouchableOpacity
                                    key={sim.fileName}
                                    style={[styles.simCard, { backgroundColor: cardBgColor }]}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setSelectedSim(sim);
                                        setViewerVisible(true);
                                    }}
                                >
                                    <View style={styles.simIcon}>
                                        <MaterialCommunityIcons name="flask" size={24} color="#2196F3" />
                                    </View>
                                    <Text style={[styles.simTitle, { color: textColor }]} numberOfLines={2}>{sim.title}</Text>
                                    <Text style={[styles.simSubject, { color: secondaryTextColor }]}>{sim.subject}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>
                </View>
            </ScrollView>

            {/* Modals */}
            <SimulationViewer
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
                fileName={selectedSim?.fileName || ''}
                title={selectedSim?.title || ''}
            />
            {showConfetti && <ConfettiAnimation isVisible={true} onComplete={() => setShowConfetti(false)} />}
            {showStreakCelebration && (
                <StreakCelebration
                    visible={true}
                    streak={streak}
                    onClose={() => setShowStreakCelebration(false)}
                />
            )}
            {showOnboarding && (
                <OnboardingTutorial
                    onComplete={() => setShowOnboarding(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatarButton: {
        marginRight: spacing.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    greeting: {
        flex: 1,
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '600',
    },
    nameText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        gap: 4,
    },
    streakText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 12,
    },
    xpCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    xpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    levelBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    levelText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 9,
    },
    xpText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: spacing.sm,
    },
    seeAll: {
        color: '#2196F3',
        fontWeight: '600',
        fontSize: 13,
    },
    dailyGoalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.md,
    },
    dailyGoalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    dailyGoalTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    dailyGoalXP: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    dailyProgressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    dailyProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    gridItem: {
        width: (width - spacing.lg * 2 - spacing.md) / 2,
        height: 100,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gridItemFull: {
        width: '100%',
    },
    gridGradient: {
        flex: 1,
        padding: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: spacing.sm,
    },
    simScroll: {
        paddingRight: spacing.lg,
        gap: spacing.md,
    },
    simCard: {
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: spacing.md,
        marginRight: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    simIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    simTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    simSubject: {
        fontSize: 12,
        color: '#666',
    },
});

export default MobileHomeScreen;
