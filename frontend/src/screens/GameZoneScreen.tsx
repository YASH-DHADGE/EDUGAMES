import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api'; // Import central API service
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameTimer } from '../hooks/useGameTimer';
import { saveGameResult } from '../services/gamesService';
import { calculateDelta, assessLearningOutcome, updateLeaderboardPoints } from '../utils/deltaAssessment';
import GameResultModal from './GameResultModal';
import { useAuth } from '../context/AuthContext';

// Placeholder Game Components (To be replaced with actual imports)
// Interface for Concept Node
interface ConceptNode {
    id: string;
    label: string;
    connections: string[];
    description?: string;
}

const ConceptChainGame = ({ content, config, onEndGame, difficulty }: any) => {
    const [chain, setChain] = useState<ConceptNode[]>([]);
    const [availableCards, setAvailableCards] = useState<ConceptNode[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(config?.timer || 60);
    const [hintsLeft, setHintsLeft] = useState(config?.hints || 3);
    const [hintActive, setHintActive] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [wrongCardId, setWrongCardId] = useState<string | null>(null);

    // Difficulty Colors
    const themeColor = difficulty === 'hard' ? '#FF5252' : difficulty === 'medium' ? '#FF9800' : '#4CAF50';

    useEffect(() => {
        if (content?.concepts) {
            // Shuffle available cards initially
            const shuffled = [...content.concepts].sort(() => Math.random() - 0.5);
            setAvailableCards(shuffled);
        }
    }, [content]);

    useEffect(() => {
        if (!gameEnded && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev: number) => {
                    if (prev <= 1) {
                        handleGameOver();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, gameEnded]);

    const handleGameOver = (finalScore?: number) => {
        setGameEnded(true);
        const endScore = finalScore !== undefined ? finalScore : score;
        onEndGame({
            score: endScore,
            stars: calculateStars(endScore),
            completed: chain.length > 0
        });
    };

    const calculateStars = (finalScore: number) => {
        const target = (content?.concepts?.length || 10) * (config?.pointsPerLink || 10);
        if (finalScore >= target * 0.8) return 3;
        if (finalScore >= target * 0.5) return 2;
        return 1;
    };

    const handleCardPress = (card: ConceptNode) => {
        if (gameEnded) return;

        // Validation Logic
        let isValid = false;
        if (chain.length === 0) {
            isValid = true; // First card is always free to pick
        } else {
            const lastNode = chain[chain.length - 1];
            if (lastNode.connections?.includes(card.id) || card.connections?.includes(lastNode.id)) {
                isValid = true;
            }
        }

        if (isValid) {
            // Add to chain
            setChain([...chain, card]);
            // Remove from available
            setAvailableCards(availableCards.filter(c => c.id !== card.id));
            // Update Score
            setScore((prev: number) => prev + (config?.pointsPerLink || 10));
            // Reset Hint
            setHintActive(false);

            // Check Win Condition (all cards used)
            if (availableCards.length === 1) { // 1 because we haven't removed current yet in this render cycle check
                const finalScore = score + (config?.pointsPerLink || 10);
                setTimeout(() => handleGameOver(finalScore), 500);
            }
        } else {
            // Show visual feedback for wrong card
            setWrongCardId(card.id);
            setTimeout(() => setWrongCardId(null), 800);

            // Show informative alert
            const lastLabel = chain.length > 0 ? chain[chain.length - 1].label : 'Start';
            Alert.alert(
                "❌ Wrong Link!",
                `"${card.label}" is not connected to "${lastLabel}".\n\nTry a different card! Use the hint button if needed.`,
                [{ text: "Got it", style: "cancel" }]
            );

            setScore((prev: number) => Math.max(0, prev - 5)); // Penalty

            // Reset Chain: Return all chained items to availableCards
            setAvailableCards([...availableCards, ...chain]);
            setChain([]);
        }
    };

    const useHint = () => {
        if (hintsLeft > 0 && !hintActive) {
            setHintsLeft((prev: number) => prev - 1);
            setHintActive(true);
            setScore((prev: number) => Math.max(0, prev - (config?.pointsPerLink || 10) / 2)); // Penalty for hint
        }
    };

    const isCardValidNext = (card: ConceptNode) => {
        if (chain.length === 0) return true;
        const lastNode = chain[chain.length - 1];
        return lastNode.connections?.includes(card.id) || card.connections?.includes(lastNode.id);
    };

    return (
        <View style={gameStyles.container}>
            {/* Top Bar */}
            <View style={gameStyles.topBar}>
                <View style={gameStyles.statBox}>
                    <Text style={gameStyles.statLabel}>Score</Text>
                    <Text style={gameStyles.statValue}>{score}</Text>
                </View>
                <View style={[gameStyles.statBox, { minWidth: 80 }]}>
                    <Text style={gameStyles.statLabel}>Time</Text>
                    <Text style={[gameStyles.statValue, { color: timeLeft < 10 ? 'red' : '#333' }]}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[gameStyles.hintButton, { opacity: hintsLeft > 0 ? 1 : 0.5, backgroundColor: themeColor }]}
                    onPress={useHint}
                    disabled={hintsLeft === 0}
                >
                    <MaterialCommunityIcons name="lightbulb-on" size={20} color="#fff" />
                    <Text style={gameStyles.hintText}>{hintsLeft}</Text>
                </TouchableOpacity>
            </View>

            {/* Chain Display */}
            <View style={gameStyles.chainContainer}>
                <Text style={gameStyles.sectionTitle}>Current Chain</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={gameStyles.chainScroll}>
                    {chain.map((node, index) => (
                        <View key={node.id} style={gameStyles.chainItemContainer}>
                            <View style={[gameStyles.chainNode, { borderColor: themeColor }]}>
                                <Text style={gameStyles.nodeText}>{node.label}</Text>
                            </View>
                            {index < chain.length - 1 && (
                                <MaterialCommunityIcons name="arrow-right" size={24} color={themeColor} />
                            )}
                        </View>
                    ))}
                    {chain.length === 0 && (
                        <Text style={gameStyles.emptyChainText}>Tap a card to start the chain</Text>
                    )}
                </ScrollView>
            </View>

            {/* Available Cards */}
            <View style={gameStyles.cardsContainer}>
                <Text style={gameStyles.sectionTitle}>Available Concepts</Text>
                <ScrollView contentContainerStyle={gameStyles.cardsGrid}>
                    <View style={gameStyles.cardsWrapper}>
                        {availableCards.map((card) => {
                            const isHinted = hintActive && isCardValidNext(card);
                            const isWrong = wrongCardId === card.id;
                            return (
                                <TouchableOpacity
                                    key={card.id}
                                    style={[
                                        gameStyles.card,
                                        isHinted && { borderColor: '#FFD700', borderWidth: 3, transform: [{ scale: 1.05 }] },
                                        isWrong && { borderColor: '#FF5252', borderWidth: 3, backgroundColor: '#FFEBEE' }
                                    ]}
                                    onPress={() => handleCardPress(card)}
                                >
                                    <Text style={[gameStyles.cardText, isWrong && { color: '#D32F2F' }]}>{card.label}</Text>
                                    {isHinted && <MaterialCommunityIcons name="star" size={16} color="#FFD700" style={gameStyles.hintIcon} />}
                                    {isWrong && <MaterialCommunityIcons name="close-circle" size={16} color="#FF5252" style={gameStyles.hintIcon} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const PlaceholderGame = ({ name, onEndGame, config, content }: any) => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>{name} Game</Text>
        <Text style={styles.debugText}>Config: {JSON.stringify(config)?.slice(0, 50)}...</Text>
        <Text style={styles.debugText}>Content: {JSON.stringify(content)?.slice(0, 50)}...</Text>
        <TouchableOpacity
            style={styles.simulateButton}
            onPress={() => onEndGame({ score: 100, stars: 3, completed: true })}
        >
            <Text style={styles.simulateButtonText}>Simulate Win</Text>
        </TouchableOpacity>
    </View>
);

const TimeTravelGame = (props: any) => <PlaceholderGame name="Time Travel" {...props} />;
const MirrorMatchGame = (props: any) => <PlaceholderGame name="Mirror Match" {...props} />;
const FormulaChefGame = (props: any) => <PlaceholderGame name="Formula Chef" {...props} />;
const StoryBranchGame = (props: any) => <PlaceholderGame name="Story Branch" {...props} />;

const GameZoneScreen = () => {

    const route = useRoute();
    const navigation = useNavigation();
    const { user, addXP } = useAuth();
    const { gameType, classLevel, subject, difficulty } = route.params as any || {};

    // State
    const [loading, setLoading] = useState(true);
    const [gameConfig, setGameConfig] = useState<any>(null);
    const [gameContent, setGameContent] = useState<any>(null);
    const [isOffline, setIsOffline] = useState(false);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer } = useGameTimer();
    const [isPlaying, setIsPlaying] = useState(false);
    // Delta System State
    const [resultModalVisible, setResultModalVisible] = useState(false); // Replaces showEndModal
    const [deltaResult, setDeltaResult] = useState<any>(null);
    const [learningOutcome, setLearningOutcome] = useState<any>(null);
    const [finalScore, setFinalScore] = useState(0);
    const [gameResult, setGameResult] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        loadGameResources();
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(!state.isConnected);
        });
        return () => {
            stopTimer();
            unsubscribe();
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        if (isPlaying) {
            startTimer();
        } else {
            stopTimer();
        }
    }, [isPlaying]);

    // Resource Loading
    const loadGameResources = async () => {
        try {
            setLoading(true);
            const networkState = await NetInfo.fetch();
            const connected = networkState.isConnected;
            setIsOffline(!connected);

            // Load Config
            let configData;
            const configKey = `game_config`;
            if (connected) {
                try {
                    const response = await api.get('/games/config');
                    configData = response.data;
                    await AsyncStorage.setItem(configKey, JSON.stringify(configData));
                } catch (err) {
                    console.warn('Failed to fetch config, falling back to cache', err);
                    const cached = await AsyncStorage.getItem(configKey);
                    if (cached) configData = JSON.parse(cached);
                }
            } else {
                const cached = await AsyncStorage.getItem(configKey);
                if (cached) configData = JSON.parse(cached);
            }

            // Load Content
            let contentData;
            const contentKey = `content_${subject}_${classLevel}_${gameType}`;
            if (connected) {
                try {
                    const response = await api.get('/games/content', {
                        params: { subject, class: classLevel, gameType },
                    });
                    contentData = response.data;
                    await AsyncStorage.setItem(contentKey, JSON.stringify(contentData));
                } catch (err) {
                    console.warn('Failed to fetch content, falling back to cache', err);
                    const cached = await AsyncStorage.getItem(contentKey);
                    if (cached) contentData = JSON.parse(cached);
                }
            } else {
                const cached = await AsyncStorage.getItem(contentKey);
                if (cached) contentData = JSON.parse(cached);
            }

            if (configData && contentData) {
                // Merge Config with Difficulty
                const baseConfig = configData[classLevel] || {};
                const diffMultiplier = configData.difficultyMultipliers?.[difficulty || 'medium'] || 1;

                const effectiveConfig = {
                    ...baseConfig,
                    timer: (baseConfig.timer || 60) * (diffMultiplier === 0 ? 1 : 1 / diffMultiplier),
                    scoringFactor: diffMultiplier,
                };

                setGameConfig(effectiveConfig);
                setGameContent(contentData);
                setIsPlaying(true);
            } else {
                // Even if failing to load, we can render the game with empty data or show error
                // For now, if we don't have enough data, we might show a retry or just proceed with defaults if possible
                if (!configData || !contentData) {
                    Alert.alert('Notice', 'Could not load all game resources. Game might not function correctly.');
                    // Optional: setIsPlaying(true) with partial data
                }
            }

        } catch (error) {
            console.error('Error loading game resources:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleGameEnd = async (result: any) => {
        setIsPlaying(false);
        stopTimer();

        // --- DELTA CALCULATION ---
        const dResult = calculateDelta(elapsedTime, difficulty || 'medium');

        // Calculate Final Score (Base Game Score + Delta)
        // Game returns a score (e.g., 100), we add Delta to it.
        const totalScore = result.score + dResult.delta;

        // Assess Outcome
        // Assuming perfect attempts if not provided by game result
        const attempts = result.attempts || 1;
        const mistakes = result.mistakes || 0;
        const outcome = assessLearningOutcome(dResult.delta, (result.score / 100) * 100, attempts, mistakes, difficulty || 'medium');

        setDeltaResult(dResult);
        setLearningOutcome(outcome);
        setFinalScore(totalScore);

        // Add XP
        addXP(totalScore, gameType);

        // Update Leaderboard
        await updateLeaderboardPoints(dResult.delta, difficulty || 'medium', user?._id || 'guest');

        const finalResult = {
            ...result,
            gameType,
            classLevel,
            subject,
            difficulty,
            elapsedTime,
            delta: dResult.delta,
            proficiency: dResult.proficiency,
            timestamp: new Date().toISOString(),
        };

        setGameResult(finalResult);

        // Save Logic
        const resultKey = `result_${gameType}_${classLevel}_${subject}_${difficulty}_${Date.now()}`;
        await AsyncStorage.setItem(resultKey, JSON.stringify(finalResult));

        await saveGameResult({
            gameId: gameType,
            score: totalScore,
            maxScore: 100 + 100, // Concept score + max delta
            timeTaken: elapsedTime,
            difficulty: typeof difficulty === 'string' ? difficulty : 'medium',
            completedLevel: 1,
            subject: subject || 'General',
            classLevel: classLevel || 'All',
            delta: dResult.delta,
            proficiency: dResult.proficiency,
            userId: user?._id
        });

        setResultModalVisible(true);
    };

    const renderGame = () => {
        const props = {
            gameType,
            classLevel,
            subject,
            difficulty,
            config: gameConfig,
            content: gameContent,
            onEndGame: handleGameEnd,
        };

        switch (gameType) {
            case 'conceptChain': return <ConceptChainGame {...props} />;
            case 'timeTravel': return <TimeTravelGame {...props} />;
            case 'mirrorMatch': return <MirrorMatchGame {...props} />;
            case 'formulaChef': return <FormulaChefGame {...props} />;
            case 'storyBranch': return <StoryBranchGame {...props} />;
            default:
                return (
                    <View style={styles.centerContent}>
                        <Text style={styles.errorText}>Unknown Game Type: {gameType}</Text>
                    </View>
                );
        }
    };

    const RestartGame = () => {
        setResultModalVisible(false);
        resetTimer();
        setIsPlaying(true);
    };

    const GoBackToMenu = () => {
        setResultModalVisible(false);
        navigation.goBack();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A00E0" />
                <Text style={styles.loadingText}>Loading Game Zone...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header/Banner for Offline */}
            {isOffline && (
                <View style={styles.offlineBanner}>
                    <MaterialCommunityIcons name="wifi-off" size={16} color="#fff" />
                    <Text style={styles.offlineText}>Playing Offline - Progress will sync later</Text>
                </View>
            )}

            <View style={styles.header}>
                <View style={styles.webHeaderContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{gameType?.replace(/([A-Z])/g, ' $1').trim()}</Text>
                    <View style={styles.timerContainer}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
                        <Text style={styles.timerText}>{displayTime}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.gameArea}>
                {renderGame()}
            </View>

            {/* Delta Game Result Modal */}
            <GameResultModal
                visible={resultModalVisible}
                gameId={gameType || 'game_zone'}
                score={finalScore}
                maxScore={200}
                timeTaken={elapsedTime}
                difficulty={difficulty || 'medium'}
                deltaResult={deltaResult}
                learningOutcome={learningOutcome}
                onClose={() => setResultModalVisible(false)}
                onGoHome={GoBackToMenu}
                onPlayAgain={RestartGame}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666'
    },
    offlineBanner: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    offlineText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centered for web wrapper
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        elevation: 2,
    },
    webHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 800,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textTransform: 'capitalize'
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    gameArea: {
        flex: 1,
        padding: 16,
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorText: {
        color: 'red',
        fontSize: 16
    },
    // Placeholder Styles
    placeholderContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed'
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4A00E0',
        marginBottom: 20
    },
    debugText: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
        marginBottom: 5
    },
    simulateButton: {
        marginTop: 30,
        backgroundColor: '#4A00E0',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24
    },
    simulateButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 5
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20
    },
    statsContainer: {
        width: '100%',
        marginBottom: 24,
        gap: 8,
        alignItems: 'center'
    },
    statText: {
        fontSize: 18,
        color: '#555'
    },
    modalButtons: {
        width: '100%',
        gap: 12
    },
    modalButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    playAgainBtn: {
        backgroundColor: '#4A00E0'
    },
    playAgainText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    menuBtn: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    menuText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600'
    }
});

const gameStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    statBox: {
        alignItems: 'center',
        backgroundColor: '#F8F9FF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        minWidth: 90,
    },
    statLabel: {
        fontSize: 11,
        color: '#8B8B9A',
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginTop: 2,
    },
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        gap: 6,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    hintText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    chainContainer: {
        padding: 16,
        backgroundColor: 'linear-gradient(180deg, #E8F4FD 0%, #F0F4FF 100%)',
        borderBottomWidth: 0,
        minHeight: 100,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5B6EE1',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chainScroll: {
        alignItems: 'center',
        paddingRight: 20,
        minHeight: 50,
    },
    chainItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chainNode: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 2,
        marginRight: 4,
        shadowColor: '#5B6EE1',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    nodeText: {
        fontWeight: '700',
        color: '#2D3748',
        fontSize: 14,
    },
    emptyChainText: {
        color: '#A0AEC0',
        fontStyle: 'italic',
        fontSize: 14,
    },
    cardsContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F0F4FF',
    },
    cardsGrid: {
        paddingBottom: 30,
    },
    cardsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 14,
    },
    card: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#5B6EE1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 14,
        minHeight: 90,
        borderWidth: 1,
        borderColor: '#E8ECF4',
    },
    cardText: {
        textAlign: 'center',
        fontWeight: '600',
        color: '#2D3748',
        fontSize: 15,
        lineHeight: 20,
    },
    hintIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    }
});

export default GameZoneScreen;
