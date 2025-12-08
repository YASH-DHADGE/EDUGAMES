import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, IconButton, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    FadeIn,
    FadeOut,
    SlideInDown
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';
import { soundManager } from '../../utils/soundEffects';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

const { width } = Dimensions.get('window');
const SLOT_HEIGHT = 70;
const SLOT_MARGIN = 8;

interface EventItem {
    id: string;
    description: string;
    year: number;
    displayYear?: string; // Optional for easy mode
}

const LEVEL_DATA: EventItem[] = [
    { id: '1', description: 'Invention of the Wheel', year: -3500 },
    { id: '2', description: 'Building of Great Pyramids', year: -2500 },
    { id: '3', description: 'Invention of Paper', year: 105 },
    { id: '4', description: 'Printing Press', year: 1440 },
    { id: '5', description: 'Steam Engine', year: 1712 },
    { id: '6', description: 'First Airplane Flight', year: 1903 },
    { id: '7', description: 'Moon Landing', year: 1969 },
    { id: '8', description: 'World Wide Web', year: 1989 },
];

const DraggableEvent = ({
    item,
    onDrop,
    index,
    isLocked,
    currentSlot,
    styles
}: {
    item: EventItem,
    onDrop: (itemId: string, slotIndex: number) => void,
    index: number,
    isLocked: boolean,
    currentSlot: number | null,
    styles: any
}) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });
    const scale = useSharedValue(1);

    const pan = Gesture.Pan()
        .onStart(() => {
            if (isLocked) return;
            context.value = { x: translateX.value, y: translateY.value };
            scale.value = withSpring(1.05);
            runOnJS(soundManager.playClick)();
        })
        .onUpdate((event) => {
            if (isLocked) return;
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd((event) => {
            if (isLocked) return;
            scale.value = withSpring(1);

            // Simple collision detection logic 
            // We'll rely on absolute Y position to determine "drop zone" roughly
            // This is a simplified approach; usually we'd measure layouts
            if (event.absoluteY < 400) { // Assuming top half is slots
                // Calculate approximate slot based on Y
                // This is tricky without exact measurements, so we'll just say "if dropped in top area, try to snap"
                // For now, let's just use a simple mock drop handler that finds the closest slot or just appends
                const estimatedSlot = Math.max(0, Math.floor((event.absoluteY - 100) / (SLOT_HEIGHT + SLOT_MARGIN)));
                runOnJS(onDrop)(item.id, estimatedSlot);
            }

            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ],
        zIndex: scale.value > 1 ? 100 : 1
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.cardWrapper, animatedStyle]}>
                <Surface style={[styles.card, isLocked ? styles.lockedCard : null]} elevation={2}>
                    <View style={styles.cardContent}>
                        <MaterialCommunityIcons name="history" size={24} color={isLocked ? "#4CAF50" : "#666"} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text variant="bodyMedium" style={styles.cardText}>{item.description}</Text>
                            {isLocked && <Text variant="labelSmall" style={{ color: '#4CAF50' }}>{item.year > 0 ? `${item.year} AD` : `${Math.abs(item.year)} BC`}</Text>}
                        </View>
                        {!isLocked && <MaterialCommunityIcons name="drag" size={24} color="#ccc" />}
                    </View>
                </Surface>
            </Animated.View>
        </GestureDetector>
    );
};

const TimeTravelDebugScreen = () => {
    const navigation = useNavigation();
    const { addXP } = useAuth();
    const { isDark } = useAppTheme();
    const styles = createStyles(isDark);

    // Game State
    const [sourceItems, setSourceItems] = useState<EventItem[]>([]);
    const [timelineSlots, setTimelineSlots] = useState<(EventItem | null)[]>([]);
    const [score, setScore] = useState(1000);
    const [startTime] = useState(Date.now());
    const [gameComplete, setGameComplete] = useState(false);
    const [checks, setChecks] = useState(0);
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();

    useEffect(() => {
        initGame();
    }, []);

    const initGame = () => {
        // Select 5 random events
        const selected = [...LEVEL_DATA].sort(() => Math.random() - 0.5).slice(0, 5);
        // Sort effectively to know the answer (not used directly, but good to know)
        // Shuffle for source
        const shuffled = [...selected].sort(() => Math.random() - 0.5);

        setSourceItems(shuffled);
        setTimelineSlots(new Array(5).fill(null));
        setScore(1000);
        setGameComplete(false);
        setChecks(0);
        setGameComplete(false);
        setChecks(0);
        resetGameTimer();
        startTimer();
        soundManager.initialize();
    };

    const handleItemPress = (item: EventItem, fromSource: boolean) => {
        soundManager.playClick();
        if (gameComplete) return;

        if (fromSource) {
            // Move from Source to first empty Slot
            const firstEmptyIndex = timelineSlots.findIndex(s => s === null);
            if (firstEmptyIndex !== -1) {
                const newSlots = [...timelineSlots];
                newSlots[firstEmptyIndex] = item;
                setTimelineSlots(newSlots);
                setSourceItems(prev => prev.filter(i => i.id !== item.id));
            }
        } else {
            // Move back to Source
            setSourceItems(prev => [...prev, item]);
            const newSlots = timelineSlots.map(s => s?.id === item.id ? null : s);
            setTimelineSlots(newSlots);
        }
    };

    const [showResultModal, setShowResultModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });

    const checkOrder = () => {
        if (timelineSlots.some(s => s === null)) {
            setModalContent({
                title: 'Incomplete',
                message: 'Please fill all slots in the timeline first.',
                type: 'error'
            });
            setShowResultModal(true);
            return;
        }

        // Verify order
        let isCorrect = true;
        let mistakes = 0;

        for (let i = 0; i < timelineSlots.length - 1; i++) {
            const current = timelineSlots[i];
            const next = timelineSlots[i + 1];
            if (current && next && current.year > next.year) {
                isCorrect = false;
                mistakes++;
            }
        }

        setChecks(prev => prev + 1);

        if (isCorrect) {
            soundManager.playSuccess();
            const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - startTime) / 1000));
            const finalScore = score - (checks * 100) + timeBonus;
            addXP(Math.floor(finalScore / 10), 'Time Travel Debug');
            setScore(finalScore);
            setGameComplete(true);
            stopTimer();

            saveGameResult({
                gameId: 'time_travel_debug',
                score: finalScore,
                maxScore: 1300,
                timeTaken: elapsedTime,
                difficulty: 'medium',
                accuracy: Math.max(0, 100 - (checks * 10))
            });

            setModalContent({
                title: 'Mission Complete!',
                message: `Timeline Restored!\n\nScore: ${finalScore}\nTime Taken: ${displayTime}`,
                type: 'success'
            });
            setShowResultModal(true);
        } else {
            soundManager.playWrong();
            setScore(prev => Math.max(0, prev - 150));
            setModalContent({
                title: 'Incorrect Order',
                message: 'Some events are out of order. Time is warping! (-150 pts)',
                type: 'error'
            });
            setShowResultModal(true);
        }
    };

    return (
        <LinearGradient
            colors={isDark ? ['#1a237e', '#000'] : ['#E8EAF6', '#C5CAE9']}
            style={styles.container}
        >
            <View style={styles.header}>
                <IconButton icon="arrow-left" iconColor={isDark ? "#fff" : "#333"} onPress={() => navigation.goBack()} />
                <Text variant="titleLarge" style={styles.title}>Time Travel Debug</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={isDark ? "#fff" : "#333"} style={{ marginRight: 6 }} />
                    <Text style={{ fontFamily: 'monospace', fontWeight: 'bold', color: isDark ? "#fff" : "#333" }}>{displayTime}</Text>
                </View>
                <View style={styles.scoreContainer}>
                    <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Timeline Section */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Timeline (Oldest to Newest)</Text>
                <View style={styles.timelineContainer}>
                    <View style={styles.timelineLine} />
                    {timelineSlots.map((slot, index) => (
                        <View key={index} style={styles.slotContainer}>
                            <View style={styles.timeMarker}>
                                <Text style={styles.timeMarkerText}>{index + 1}</Text>
                            </View>
                            {slot ? (
                                <Animated.View entering={FadeIn} exiting={FadeOut}>
                                    <Surface style={styles.filledSlot} elevation={2} onTouchEnd={() => handleItemPress(slot, false)}>
                                        <Text style={styles.slotText}>{slot.description}</Text>
                                        {gameComplete && (
                                            <Text style={styles.yearText}>
                                                {slot.year < 0 ? `${Math.abs(slot.year)} BC` : `${slot.year} AD`}
                                            </Text>
                                        )}
                                    </Surface>
                                </Animated.View>
                            ) : (
                                <View style={styles.emptySlot}>
                                    <Text style={styles.emptySlotText}>Drop Here</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Source Section */}
                <View style={styles.sourceArea}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Temporal Anomalies</Text>
                    <View style={styles.sourceGrid}>
                        {sourceItems.map((item) => (
                            <Animated.View
                                key={item.id}
                                entering={SlideInDown}
                                exiting={FadeOut}
                                style={styles.sourceItemWrapper}
                            >
                                <Surface style={styles.sourceCard} elevation={1} onTouchEnd={() => handleItemPress(item, true)}>
                                    <MaterialCommunityIcons name="help-circle-outline" size={24} color="#5C6BC0" />
                                    <Text style={styles.sourceText}>{item.description}</Text>
                                </Surface>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {gameComplete ? (
                    <Button mode="contained" onPress={initGame} style={styles.checkButton} buttonColor="#4CAF50">
                        Play Again
                    </Button>
                ) : (
                    <Button
                        mode="contained"
                        onPress={checkOrder}
                        style={styles.checkButton}
                        disabled={timelineSlots.some(s => s === null)}
                    >
                        Check Order
                    </Button>
                )}
            </View>

            {/* Custom Result Modal */}
            {showResultModal && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
                    <Animated.View entering={SlideInDown.springify()} style={{ width: '85%', maxWidth: 400 }}>
                        <Surface style={{ borderRadius: 24, padding: 24, alignItems: 'center', backgroundColor: isDark ? '#1E293B' : '#fff' }} elevation={5}>
                            <MaterialCommunityIcons
                                name={modalContent.type === 'success' ? "trophy" : "alert-circle"}
                                size={64}
                                color={modalContent.type === 'success' ? "#FFD700" : "#FF5252"}
                                style={{ marginBottom: 16 }}
                            />
                            <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#333', marginBottom: 8, textAlign: 'center' }}>
                                {modalContent.title}
                            </Text>
                            <Text variant="bodyLarge" style={{ textAlign: 'center', marginBottom: 24, color: isDark ? '#ddd' : '#666' }}>
                                {modalContent.message}
                            </Text>
                            <Button
                                mode="contained"
                                onPress={() => setShowResultModal(false)}
                                style={{ borderRadius: 30, width: '100%' }}
                                contentStyle={{ paddingVertical: 4 }}
                                buttonColor={modalContent.type === 'success' ? "#4CAF50" : "#FF5252"}
                            >
                                {modalContent.type === 'success' ? "Awesome!" : "Try Again"}
                            </Button>
                        </Surface>
                    </Animated.View>
                </View>
            )}
        </LinearGradient>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#333',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4
    },
    scoreText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        color: isDark ? '#ccc' : '#555',
        marginBottom: 16,
        fontWeight: '600',
    },
    timelineContainer: {
        position: 'relative',
        marginBottom: 30,
        paddingLeft: 20,
    },
    timelineLine: {
        position: 'absolute',
        left: 34, // Align with center of marker (width 30/2 + padding 20) roughly
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#9FA8DA',
    },
    slotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#3F51B5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        zIndex: 2,
    },
    timeMarkerText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filledSlot: {
        backgroundColor: isDark ? '#3949AB' : '#fff',
        padding: 16,
        borderRadius: 12,
        flex: 1,
        minWidth: width - 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slotText: {
        fontSize: 16,
        fontWeight: '500',
        color: isDark ? '#fff' : '#333',
        flexShrink: 1,
    },
    yearText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    emptySlot: {
        flex: 1,
        height: 56,
        borderWidth: 2,
        borderColor: 'rgba(159, 168, 218, 0.5)',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    emptySlotText: {
        color: 'rgba(159, 168, 218, 0.8)',
    },
    sourceArea: {
        marginTop: 10,
    },
    sourceGrid: {
        flexDirection: 'column',
        gap: 10,
    },
    sourceItemWrapper: {
        width: '100%',
    },
    sourceCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sourceText: {
        fontSize: 16,
        color: isDark ? '#fff' : '#333',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    checkButton: {
        borderRadius: 30,
        paddingVertical: 6,
    },
    cardWrapper: {
        marginBottom: 8
    },
    card: {
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#fff'
    },
    lockedCard: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
        borderWidth: 1
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardText: {
        fontWeight: '500'
    }
});

export default TimeTravelDebugScreen;
