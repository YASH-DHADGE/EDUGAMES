import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, gradients, theme, shadows } from '../../theme';
import Animated, { FadeInDown, withTiming, useAnimatedStyle, useSharedValue, BounceIn, ZoomIn, FlipInEasyY } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Card {
    id: number;
    content: string;
    pairId: number;
    type: 'question' | 'answer';
}

const EDUCATIONAL_PAIRS = [
    { question: 'H₂O', answer: 'Water' },
    { question: 'CO₂', answer: 'Carbon Dioxide' },
    { question: 'Photosynthesis', answer: 'Plants make food' },
    { question: 'Gravity', answer: 'Force pulling down' },
    { question: 'DNA', answer: 'Genetic code' },
    { question: 'Atom', answer: 'Smallest unit' },
    { question: 'Cell', answer: 'Basic life unit' },
];

import { soundManager } from '../../utils/soundEffects';

import { useResponsive } from '../../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

interface CardComponentProps {
    card: Card;
    isFlipped: boolean;
    isMatched: boolean;
    onPress: () => void;
    style?: any;
    cardSize?: number;
}

const CardComponent: React.FC<CardComponentProps> = ({ card, isFlipped, isMatched, onPress, style, cardSize }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withTiming((isFlipped || isMatched) ? 180 : 0, { duration: 400 });
    }, [isFlipped, isMatched]);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotateY: `${rotation.value + 180}deg` }],
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotateY: `${rotation.value}deg` }],
        };
    });

    return (
        <Animated.View
            entering={FadeInDown.delay(card.id * 50)}
            style={[
                {
                    width: cardSize || '30%',
                    aspectRatio: 1,
                    marginBottom: 12,
                    perspective: 1000,
                },
                style
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                disabled={isFlipped || isMatched}
                activeOpacity={1} // Feedback handled by animation
                style={{ flex: 1 }}
            >
                {/* Back Face (Pattern/Gradient) - Visible when rot is 0 (value=0 -> -180) WAIT, logic check below */}
                {/* 
                   Let's restart logic for clarity:
                   State 0 (Face Down): 
                     - BackFace: 0deg (Visible) 
                     - FrontFace: 180deg (Hidden)
                   State 180 (Face Up):
                     - BackFace: 180deg (Hidden)
                     - FrontFace: 360deg (Visible) - or 0deg?
                   
                   If rotation goes 0 -> 180:
                   Front Style: rotateY(rotation) -> 180 (Hidden? No 180 is hidden)
                   My previous logic was mixed.
                   
                   Correct Standard Logic:
                   backAnimatedStyle: rotateY(rotation)  [0 -> 180] (Start 0 Vis, End 180 Hid)
                   frontAnimatedStyle: rotateY(rotation - 180) [-180 -> 0] (Start -180 Hid, End 0 Vis)
                */}

                {/* Front Face (Content/Matched) */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            borderRadius: 16,
                            ...shadows.md,
                            backgroundColor: 'white', // Base needed
                        },
                        frontAnimatedStyle // Uses rotation - 180 logic logic below
                    ]}
                >
                    <LinearGradient
                        colors={
                            isMatched
                                ? ['#4CAF50', '#66BB6A']
                                : ['#FFFFFF', '#F8FAFC']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 8,
                            borderRadius: 16,
                            borderWidth: isMatched ? 0 : 2,
                            borderColor: isMatched ? 'transparent' : theme.colors.primary,
                        }}
                    >
                        <Text
                            style={{
                                color: isMatched ? '#fff' : '#333',
                                fontSize: cardSize && cardSize < 80 ? 12 : 15,
                                fontWeight: '700',
                                textAlign: 'center',
                            }}
                            numberOfLines={4}
                            adjustsFontSizeToFit
                        >
                            {card.content}
                        </Text>
                    </LinearGradient>
                </Animated.View>

                {/* Back Face (Pattern) */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            borderRadius: 16,
                            ...shadows.md,
                            backgroundColor: theme.colors.primary,
                        },
                        backAnimatedStyle // Uses rotation logic
                    ]}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 16,
                        }}
                    >
                        <MaterialCommunityIcons
                            name="help-circle-outline"
                            size={cardSize ? cardSize * 0.4 : 36}
                            color="rgba(255,255,255,0.8)"
                        />
                    </LinearGradient>
                </Animated.View>

            </TouchableOpacity>
        </Animated.View>
    );
};

const MemoryMatchScreen = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const themeContext = useTheme();
    const { isDark } = useAppTheme();
    const { isTablet, isDesktop, width } = useResponsive();
    const insets = useSafeAreaInsets();

    // Grid Calculation
    // Optimized for mobile to maximize card size
    const isMobileSmall = width < 380;
    const containerPadding = isDesktop ? spacing.xl * 2 : isTablet ? spacing.lg * 2 : spacing.md;
    const availableWidth = width - (containerPadding * 2);

    // 3 columns for mobile is standard for 12 cards (4 rows), fits well vertically without too much scrolling
    const numColumns = isDesktop ? 6 : isTablet ? 4 : 3;

    const gap = isDesktop ? 16 : isTablet ? 12 : 10; // Tighter gap on mobile
    const cardSize = (availableWidth - (gap * (numColumns - 1))) / numColumns;

    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameActive, setGameActive] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    const styles = createStyles(isDark);
    const TOTAL_PAIRS = 6;

    // Initialize sounds
    useEffect(() => {
        soundManager.initialize();
        return () => {
            soundManager.cleanup();
        };
    }, []);

    useEffect(() => {
        initializeGame();
    }, []);

    useEffect(() => {
        if (gameActive) {
            startTimer();
        } else {
            stopTimer();
        }
    }, [gameActive]);

    useEffect(() => {
        if (matchedPairs.length === TOTAL_PAIRS && gameActive) {
            endGame();
        }
    }, [matchedPairs]);

    useEffect(() => {
        if (flippedCards.length === 2) {
            const [first, second] = flippedCards;
            const firstCard = cards.find((c) => c.id === first);
            const secondCard = cards.find((c) => c.id === second);

            if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
                // Match found
                soundManager.playCorrect();
                setMatchedPairs((prev) => [...prev, firstCard.pairId]);
                setFlippedCards([]);
            } else {
                // No match - flip back after delay
                soundManager.playWrong();
                setTimeout(() => {
                    setFlippedCards([]);
                }, 1000);
            }
            setMoves((prev) => prev + 1);
        }
    }, [flippedCards]);

    const initializeGame = () => {
        const pairs: Card[] = [];
        // Select random 6 pairs
        const selectedPairs = [...EDUCATIONAL_PAIRS]
            .sort(() => Math.random() - 0.5)
            .slice(0, TOTAL_PAIRS);

        selectedPairs.forEach((pair, i) => {
            pairs.push(
                {
                    id: i * 2,
                    content: pair.question,
                    pairId: i,
                    type: 'question',
                },
                {
                    id: i * 2 + 1,
                    content: pair.answer,
                    pairId: i,
                    type: 'answer',
                }
            );
        });

        // Shuffle cards
        const shuffled = pairs.sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setFlippedCards([]);
        setMatchedPairs([]);
        setMoves(0);
        resetGameTimer();
        setGameActive(true);
        setGameWon(false);
    };

    const handleCardPress = (cardId: number) => {
        if (flippedCards.length < 2 && !flippedCards.includes(cardId)) {
            soundManager.playClick();
            setFlippedCards((prev) => [...prev, cardId]);
        }
    };

    const endGame = () => {
        setGameActive(false);
        stopTimer();
        setGameWon(true);
        soundManager.playSuccess();
        const score = Math.max(0, 1000 - moves * 10 - elapsedTime * 2);
        const xpReward = Math.floor(score / 20);
        addXP(xpReward, 'Memory Match');

        saveGameResult({
            gameId: 'memory_match',
            score: score,
            maxScore: 1000,
            timeTaken: elapsedTime,
            difficulty: 'medium',
            completedLevel: 1
        });
    };

    // formatTime helper removed as it describes useGameTimer


    if (gameWon) {
        const score = Math.max(0, 1000 - moves * 10 - elapsedTime * 2);
        return (
            <LinearGradient
                colors={['#fa709a', '#fee140']}
                style={styles.container}
            >
                <View style={styles.innerContainer}>
                    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                        <IconButton
                            icon="arrow-left"
                            iconColor="#fff"
                            size={24}
                            onPress={() => navigation.goBack()}
                        />
                        <Text variant="titleLarge" style={styles.headerTitle}>Memory Match</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Animated.View entering={BounceIn.duration(800)} style={styles.resultContainer}>
                        <Surface style={styles.resultCard} elevation={5}>
                            <Animated.View entering={ZoomIn.delay(200)}>
                                <MaterialCommunityIcons
                                    name="trophy"
                                    size={80}
                                    color="#FFD700"
                                />
                            </Animated.View>
                            <Text variant="headlineMedium" style={styles.resultTitle}>🎉 You Won!</Text>
                            <Text variant="bodyLarge" style={styles.resultMessage}>
                                Congratulations! You found all pairs!
                            </Text>
                            <View style={styles.statsContainer}>
                                <View style={styles.statBox}>
                                    <MaterialCommunityIcons name="gesture-tap" size={24} color="#fa709a" />
                                    <Text variant="bodySmall" style={styles.statLabel}>Moves</Text>
                                    <Text variant="titleMedium" style={styles.statValue}>{moves}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <MaterialCommunityIcons name="clock-outline" size={24} color="#fa709a" />
                                    <Text variant="bodySmall" style={styles.statLabel}>Time</Text>
                                    <Text variant="titleMedium" style={styles.statValue}>{displayTime}</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                                    <Text variant="bodySmall" style={styles.statLabel}>Score</Text>
                                    <Text variant="titleMedium" style={styles.statValue}>{score}</Text>
                                </View>
                            </View>
                            <View style={styles.buttonRow}>
                                <LinearGradient
                                    colors={['#fa709a', '#fee140']}
                                    style={styles.gradientButton}
                                >
                                    <Button
                                        mode="text"
                                        onPress={initializeGame}
                                        textColor="#fff"
                                        labelStyle={styles.buttonLabel}
                                    >
                                        Play Again
                                    </Button>
                                </LinearGradient>
                                <Button
                                    mode="outlined"
                                    onPress={() => navigation.goBack()}
                                    style={styles.outlineButton}
                                    textColor="#fa709a"
                                >
                                    Exit
                                </Button>
                            </View>
                        </Surface>
                    </Animated.View>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#fa709a', '#fee140']}
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#fff"
                        size={24}
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="titleLarge" style={styles.headerTitle}>Memory Match</Text>
                    <View style={{ width: 40 }} />
                </View>

                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                    style={styles.statsCard}
                >
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="gesture-tap" size={20} color="#fa709a" />
                        <Text variant="titleMedium" style={styles.statItemLabel}>Moves: {moves}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#fa709a" />
                        <Text variant="titleMedium" style={styles.statItemLabel}>Time: {displayTime}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="cards" size={20} color="#fa709a" />
                        <Text variant="bodyMedium" style={styles.statItemLabel}>
                            Pairs: {matchedPairs.length}/{TOTAL_PAIRS}
                        </Text>
                    </View>
                </LinearGradient>

                <ScrollView
                    style={styles.gameArea}
                    overScrollMode="never"
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: containerPadding }
                    ]}
                >
                    <Text variant="bodyLarge" style={styles.instructions}>
                        Match the concepts with their meanings!
                    </Text>

                    <View style={[styles.grid, { gap }]}>
                        {cards.map((card) => (
                            <CardComponent
                                key={card.id}
                                card={card}
                                cardSize={cardSize}
                                isFlipped={flippedCards.includes(card.id)}
                                isMatched={matchedPairs.includes(card.pairId)}
                                onPress={() => handleCardPress(card.id)}
                                style={{ marginBottom: 0 }} // Gap handles spacing now
                            />
                        ))}
                    </View>

                    <LinearGradient
                        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                        style={styles.resetButton}
                    >
                        <Button
                            mode="text"
                            onPress={initializeGame}
                            icon="refresh"
                            textColor="#fa709a"
                            labelStyle={{ fontWeight: 'bold' }}
                        >
                            New Game
                        </Button>
                    </LinearGradient>
                </ScrollView>
            </View>
        </LinearGradient>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    headerTitle: {
        color: '#fff',
        fontWeight: 'bold',
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: spacing.md,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: 16,
        elevation: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    statItemLabel: {
        fontWeight: 'bold',
        color: '#333',
    },
    gameArea: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    instructions: {
        textAlign: 'center',
        marginBottom: spacing.lg,
        color: '#fff',
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    cardContainer: {
        width: '23%',
        aspectRatio: 0.7,
        margin: '1%',
    },
    card: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        elevation: 3,
    },
    matchedCard: {
        backgroundColor: '#C8E6C9',
    },
    cardFace: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backfaceVisibility: 'hidden',
    },
    cardBackGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    cardFront: {
        padding: spacing.xs,
    },
    cardText: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#333',
        fontSize: 11,
    },
    resetButton: {
        marginTop: spacing.lg,
        borderRadius: 30,
        overflow: 'hidden',
    },
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    resultCard: {
        padding: spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.98)',
    },
    resultTitle: {
        fontWeight: 'bold',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        color: isDark ? '#F1F5F9' : '#333',
    },
    resultMessage: {
        marginBottom: spacing.xl,
        color: isDark ? '#CBD5E1' : '#666',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statBox: {
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: 'rgba(250, 112, 154, 0.1)',
        borderRadius: 12,
        minWidth: 80,
    },
    statLabel: {
        color: '#666',
        marginTop: spacing.xs,
    },
    statValue: {
        fontWeight: 'bold',
        color: '#333',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
        justifyContent: 'center',
    },
    gradientButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    outlineButton: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fa709a',
    },
});

export default MemoryMatchScreen;
