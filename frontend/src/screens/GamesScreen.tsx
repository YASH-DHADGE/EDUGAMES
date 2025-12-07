import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Card, useTheme, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { spacing, gradients, colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GamesScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { containerStyle, isMobile, getGridColumns } = useResponsive();

    const styles = createStyles(isDark);

    const games = [
        {
            id: 1,
            title: 'Odd One Out',
            description: 'Find the different tile',
            icon: 'shape-plus',
            color: '#E91E63',
            gradient: ['#E91E63', '#F06292'],
            route: 'OddOneOut',
        },
        {
            id: 2,
            title: 'Memory Match',
            description: 'Match pairs of cards',
            icon: 'cards-playing-outline',
            color: '#9C27B0',
            gradient: ['#9C27B0', '#BA68C8'],
            route: 'MemoryMatch',
        },
        {
            id: 3,
            title: 'Label the Organ',
            description: 'Learn human anatomy',
            icon: 'human-male-height',
            color: '#4CAF50',
            gradient: ['#4CAF50', '#66BB6A'],
            route: 'LabelOrganGame',
        },
        {
            id: 4,
            title: 'Quick Math Challenge',
            description: 'Solve math problems fast',
            icon: 'calculator-variant',
            color: '#FF9800',
            gradient: ['#FF9800', '#FFB74D'],
            route: 'QuickMathGame',
        },
        {
            id: 5,
            title: 'Balance Equations',
            description: 'Chemistry equation balancing',
            icon: 'flask-outline',
            color: '#00BCD4',
            gradient: ['#00BCD4', '#4DD0E1'],
            route: 'ChemistryBalanceGame',
        },
        {
            id: 6,
            title: 'Cell Structure Quiz',
            description: 'Learn about cell parts',
            icon: 'microscope',
            color: '#2196F3',
            gradient: ['#2196F3', '#42A5F5'],
            route: 'CellStructureQuiz',
        },
        {
            id: 7,
            title: 'Force Simulator',
            description: 'Physics force simulation',
            icon: 'axis-arrow',
            color: '#673AB7',
            gradient: ['#673AB7', '#9575CD'],
            route: 'ForcePlayGame',
        },
        {
            id: 9,
            title: 'Cell Command',
            description: 'Build a cell part by part',
            icon: 'dna',
            color: '#9C27B0',
            gradient: ['#9C27B0', '#E1BEE7'],
            route: 'CellCommand',
        },
        {
            id: 12,
            title: 'Digestive Dash',
            description: 'Match enzymes to nutrients',
            icon: 'stomach',
            color: '#E91E63',
            gradient: ['#EC407A', '#F8BBD0'],
            route: 'DigestiveDash',
        },
        {
            id: 13,
            title: 'Genetics Lab',
            description: 'Solve the Punnett Square',
            icon: 'flask',
            color: '#4CAF50',
            gradient: ['#66BB6A', '#C8E6C9'],
            route: 'GeneticsLab',
        },
    ];

    const numColumns = getGridColumns();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                {/* Enhanced Header with Gradient */}
                <LinearGradient
                    colors={['#FF6B6B', '#EE5A6F', '#C44569']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerBackground}
                >
                    {/* Decorative circles */}
                    <View style={[styles.decorativeCircle, { top: -70, right: -50, width: 200, height: 200 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -60, left: -40, width: 170, height: 170 }]} />

                    {/* Animated Game Icons Background */}
                    <View style={styles.iconsContainer}>
                        {[...Array(8)].map((_, i) => (
                            <Animated.View
                                key={i}
                                entering={FadeInDown.delay(i * 80).duration(700).springify()}
                                style={[
                                    styles.floatingIcon,
                                    {
                                        left: `${(i * 27 + 8) % 85}%`,
                                        top: `${(i * 19 + 10) % 75}%`,
                                        opacity: 0.12 + (i % 3) * 0.08,
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={['gamepad-variant', 'trophy', 'star', 'lightning-bolt'][i % 4] as any}
                                    size={16 + (i % 3) * 6}
                                    color="#FFF"
                                />
                            </Animated.View>
                        ))}
                    </View>

                    <View style={styles.headerContent}>
                        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                            <View style={styles.titleRow}>
                                <View style={styles.iconBadge}>
                                    <MaterialCommunityIcons name="gamepad-variant" size={32} color="#fff" />
                                </View>
                                <View style={styles.titleContainer}>
                                    <Text variant="displaySmall" style={styles.header}>
                                        Games
                                    </Text>
                                    <Text variant="titleMedium" style={styles.subtitle}>
                                        Choose a game to play 🎮
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                                style={styles.syncBar}
                            >
                                <View style={styles.syncContent}>
                                    <View style={styles.syncIconContainer}>
                                        <MaterialCommunityIcons name="cloud-check" size={22} color="#4CAF50" />
                                    </View>
                                    <Text variant="bodyMedium" style={styles.syncText}>
                                        All scores synced
                                    </Text>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    </View>
                </LinearGradient>
                {/* Games Grid */}
                <View style={styles.gamesGrid}>
                    {games.map((game, index) => (
                        <Animated.View
                            key={game.id}
                            entering={FadeInRight.delay(index * 80).duration(600).springify()}
                            style={[styles.gameCardWrapper, { width: isMobile ? '100%' : '48%' }]}
                        >
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate(game.route)}
                            >
                                <Surface style={styles.gameCard} elevation={4}>
                                    <LinearGradient
                                        colors={[game.gradient[0], game.gradient[1]] as const}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.gameCardGradient}
                                    >
                                        <View style={styles.gameIconContainer}>
                                            <LinearGradient
                                                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                                                style={styles.gameIconBg}
                                            >
                                                <MaterialCommunityIcons
                                                    name={game.icon as any}
                                                    size={42}
                                                    color="#fff"
                                                />
                                            </LinearGradient>
                                        </View>
                                    </LinearGradient>

                                    <View style={styles.gameCardContent}>
                                        <Text variant="titleMedium" style={styles.gameTitle}>
                                            {game.title}
                                        </Text>
                                        <Text variant="bodyMedium" style={styles.gameDescription}>
                                            {game.description}
                                        </Text>
                                        <View style={styles.playButton}>
                                            <MaterialCommunityIcons name="play-circle" size={20} color={game.color} />
                                            <Text style={[styles.playText, { color: game.color }]}>Play Now</Text>
                                        </View>
                                    </View>
                                </Surface>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* Info Card */}
                <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.infoCardWrapper}>
                    <Surface style={styles.infoCard} elevation={3}>
                        <LinearGradient
                            colors={['#FFF3E0', '#FFE0B2']}
                            style={styles.infoGradient}
                        >
                            <View style={styles.infoContent}>
                                <View style={styles.trophyIconContainer}>
                                    <MaterialCommunityIcons name="trophy" size={32} color="#FF9800" />
                                </View>
                                <View style={styles.infoTextContainer}>
                                    <Text variant="titleMedium" style={styles.infoTitle}>
                                        Earn Rewards!
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.infoText}>
                                        Play games to earn XP and unlock new levels!
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Surface>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? '#0F172A' : '#F5F5F5',
    },
    scrollView: {
        flex: 1,
    },
    headerBackground: {
        paddingBottom: spacing.xxl + spacing.md,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: spacing.lg,
        shadowColor: '#C44569',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    iconsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    floatingIcon: {
        position: 'absolute',
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        zIndex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    titleContainer: {
        flex: 1,
    },
    header: {
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
        fontSize: 32,
        letterSpacing: 0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        fontSize: 16,
    },
    syncBar: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    syncContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.sm,
    },
    syncIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    syncText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    content: {
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingBottom: 120,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.lg,
        marginBottom: spacing.xl,
    },
    gameCardWrapper: {
        marginBottom: spacing.lg,
    },
    gameCard: {
        borderRadius: 20,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 4,
    },
    gameCardGradient: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameIconContainer: {
        marginBottom: 0,
    },
    gameIconBg: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    gameCardContent: {
        padding: spacing.lg,
        gap: spacing.xs,
        backgroundColor: isDark ? '#1E293B' : '#fff',
    },
    gameTitle: {
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
        fontSize: 17,
        letterSpacing: 0.3,
    },
    gameDescription: {
        color: isDark ? '#CBD5E1' : '#666',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: spacing.xs,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: spacing.xs,
    },
    playText: {
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    infoCardWrapper: {
        marginTop: spacing.md,
    },
    infoCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 3,
    },
    infoGradient: {
        padding: spacing.lg,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    trophyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontWeight: '800',
        color: '#E65100',
        marginBottom: 4,
        fontSize: 17,
    },
    infoText: {
        color: '#F57C00',
        fontWeight: '600',
        lineHeight: 20,
        fontSize: 14,
    },
});

export default GamesScreen;
