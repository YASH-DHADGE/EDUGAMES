import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, useTheme, Button, IconButton } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameLayout from '../../components/games/GameLayout';
import TutorialOverlay from '../../components/games/TutorialOverlay';
import { useGameProgress } from '../../hooks/useGameProgress';
import { soundManager } from '../../utils/soundEffects';
import { useGameTimer } from '../../hooks/useGameTimer';
import { saveGameResult } from '../../services/gamesService';

const { width } = Dimensions.get('window');
const HEADER_WIDTH = 70;
const PADDING = 20;
const CELL_SIZE = (width - HEADER_WIDTH - PADDING * 2) / 2;
const ALLELE_SIZE = 45;

type Allele = 'T' | 't' | 'B' | 'b' | 'P' | 'p';
interface Parent {
    id: string;
    alleles: [Allele, Allele];
    position: 'top' | 'left';
}

interface LevelData {
    id: number;
    title: string;
    description: string;
    trait: string;
    parent1: [Allele, Allele]; // Top
    parent2: [Allele, Allele]; // Left
    solution: string[][]; // 2x2 grid solution strings e.g. ["TT", "Tt", "Tt", "tt"]
}

const LEVELS: LevelData[] = [
    {
        id: 1,
        title: "Height Traits",
        description: "Tall (T) is dominant over Short (t).",
        trait: "Height",
        parent1: ['T', 't'],
        parent2: ['T', 't'],
        solution: [["TT", "Tt"], ["Tt", "tt"]]
    },
    {
        id: 2,
        title: "Flower Color",
        description: "Purple (P) is dominant over White (p).",
        trait: "Flower Color",
        parent1: ['P', 'P'],
        parent2: ['p', 'p'],
        solution: [["Pp", "Pp"], ["Pp", "Pp"]]
    }
];

const DraggableAllele = ({ allele, source, onDrop, disabled }: { allele: Allele, source: string, onDrop: (val: Allele, x: number, y: number) => void, disabled: boolean }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });

    const pan = Gesture.Pan()
        .onStart(() => {
            if (disabled) return;
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((e) => {
            if (disabled) return;
            translateX.value = e.translationX + context.value.x;
            translateY.value = e.translationY + context.value.y;
        })
        .onEnd((e) => {
            if (disabled) return;
            runOnJS(onDrop)(allele, e.absoluteX, e.absoluteY);
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const style = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        zIndex: 100
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.alleleContainer, style, { backgroundColor: allele === allele.toUpperCase() ? '#FFD54F' : '#81C784' }]}>
                <Text style={styles.alleleText}>{allele}</Text>
            </Animated.View>
        </GestureDetector>
    );
};

const GeneticsLabScreen = () => {
    const { score, addScore, endGame, resetGame } = useGameProgress('genetics_lab');
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer: resetGameTimer } = useGameTimer();
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    // Grid state: 2x2 array of strings (e.g., "Tt")
    const [gridState, setGridState] = useState<string[][]>([["", ""], ["", ""]]);
    const [showTutorial, setShowTutorial] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [wrongCell, setWrongCell] = useState<{ r: number, c: number } | null>(null);

    const currentLevel = LEVELS[currentLevelIdx];

    // Refs to store layout measurements
    const gridLayoutRef = useRef<{ x: number, y: number, width: number, height: number } | null>(null);

    const handleDrop = (allele: Allele, absX: number, absY: number) => {
        // Fallback or deprecated - we use handleDropWithMeasurement now.
        // But if needed, the manual logic would be:
        // const gridTop = 280; 
        // const startX = (width - ((CELL_SIZE * 2) + HEADER_WIDTH)) / 2 + HEADER_WIDTH;
    };

    // We will use a ref for the Container View and measure it legally.
    const containerRef = useRef<View>(null);
    const [dropZones, setDropZones] = useState<{ row: number, col: number, x: number, y: number, width: number, height: number }[]>([]);

    // We can't easily repeatedly measure in React Native without triggering it.
    // Enhanced Approach: Update `dropZones` on layout.
    // However, onLayout gives relative coordinates. 
    // We'll use a simpler robust heuristic: The grid is large.

    // Let's fallback to the View measure method when measuring is needed, or stick to the simplified logic but making it relative to the VIEW measurement not Screen constants.

    const handleLayout = (event: any) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        // This x,y is relative to parent.
    };

    const dropZoneRefs = useRef<{ [key: string]: View | null }>({});

    const setDropZoneRef = (row: number, col: number, ref: View | null) => {
        dropZoneRefs.current[`${row}-${col}`] = ref;
    };

    const handleDropWithMeasurement = async (allele: Allele, absX: number, absY: number) => {
        // Find which cell contains the point (absX, absY)
        // We iterate through our refs and measure them.

        let targetRow = -1;
        let targetCol = -1;

        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const ref = dropZoneRefs.current[`${r}-${c}`];
                if (ref) {
                    const isInside = await new Promise<boolean>((resolve) => {
                        ref.measure((x, y, width, height, pageX, pageY) => {
                            if (absX >= pageX && absX <= pageX + width &&
                                absY >= pageY && absY <= pageY + height) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        });
                    });

                    if (isInside) {
                        targetRow = r;
                        targetCol = c;
                        break;
                    }
                }
            }
            if (targetRow !== -1) break;
        }

        if (targetRow !== -1 && targetCol !== -1) {
            updateGrid(targetRow, targetCol, allele);
        }
    };

    const updateGrid = (row: number, col: number, allele: Allele) => {
        const expectedTop = currentLevel.parent1[col];
        const expectedLeft = currentLevel.parent2[row];

        setGridState(prev => {
            const currentVal = prev[row][col];
            if (currentVal.length >= 2) return prev;

            if (allele !== expectedTop && allele !== expectedLeft) {
                soundManager.playWrong();

                // Trigger visual feedback
                setWrongCell({ r: row, c: col });
                setTimeout(() => setWrongCell(null), 500);

                return prev;
            }

            const newVal = currentVal + allele;
            soundManager.playClick();

            const newGrid = [...prev];
            newGrid[row] = [...prev[row]];
            newGrid[row][col] = newVal;
            return newGrid;
        });
    };

    const handleReset = () => {
        setGridState([["", ""], ["", ""]]);
        setCompleted(false);
        resetGameTimer();
        startTimer();
        soundManager.playClick();
    };

    useEffect(() => {
        startTimer();
        return () => stopTimer();
    }, []);

    useEffect(() => {
        checkCompletion();
    }, [gridState]);

    const checkCompletion = () => {
        let isComplete = true;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const cell = gridState[r][c];
                const sortedCell = cell.split('').sort().join('');
                const sortedSol = currentLevel.solution[r][c].split('').sort().join('');
                if (sortedCell !== sortedSol) isComplete = false;
            }
        }

        if (isComplete && !completed) {
            setCompleted(true);
            soundManager.playCorrect();
            addScore(100);
        }
    };

    const nextLevel = async () => {
        if (currentLevelIdx < LEVELS.length - 1) {
            setCurrentLevelIdx(prev => prev + 1);
            setGridState([["", ""], ["", ""]]);
            setCompleted(false);
        } else {
            stopTimer();
            endGame(score, elapsedTime);
            await saveGameResult({
                gameId: 'genetics_lab',
                score: score,
                maxScore: LEVELS.length * 100,
                timeTaken: elapsedTime,
                difficulty: 'medium',
                completedLevel: LEVELS.length
            });
        }
    };

    return (
        <GameLayout title="Genetics Lab" score={score} lives={3} timer={displayTime}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <LinearGradient colors={['#E8F5E9', '#A5D6A7']} style={styles.background} />

                    {/* Header with Help Button */}
                    <Surface style={styles.headerCard} elevation={2}>
                        <View style={styles.headerRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{currentLevel.title}</Text>
                                <Text variant="bodySmall">{currentLevel.description}</Text>
                            </View>
                            <IconButton
                                icon="help-circle-outline"
                                size={24}
                                iconColor="#2E7D32"
                                onPress={() => setShowTutorial(true)}
                            />
                            <IconButton
                                icon="refresh"
                                size={24}
                                iconColor="#2E7D32"
                                onPress={handleReset}
                            />
                        </View>
                    </Surface>

                    {/* Punnett Square Layout */}
                    <View style={styles.gridContainer}>
                        {/* Top Parents */}
                        <View style={styles.topRow}>
                            <View style={styles.corner} />
                            {currentLevel.parent1.map((a, i) => (
                                <View key={`p1-${i}`} style={styles.topHeaderCell}>
                                    <DraggableAllele allele={a} source="top" onDrop={handleDropWithMeasurement} disabled={completed} />
                                </View>
                            ))}
                        </View>

                        {/* Rows */}
                        {currentLevel.parent2.map((pAllele, rIdx) => (
                            <View key={`row-${rIdx}`} style={styles.gridRow}>
                                {/* Left Parent */}
                                <View style={styles.leftHeaderCell}>
                                    <DraggableAllele allele={pAllele} source="left" onDrop={handleDropWithMeasurement} disabled={completed} />
                                </View>
                                {/* Grid Cells */}
                                {[0, 1].map(cIdx => {
                                    const isWrong = wrongCell?.r === rIdx && wrongCell?.c === cIdx;
                                    return (
                                        <View
                                            key={`cell-${rIdx}-${cIdx}`}
                                            style={[
                                                styles.cell,
                                                isWrong && { backgroundColor: '#FFEBEE', borderColor: '#EF5350' }
                                            ]}
                                            ref={ref => setDropZoneRef(rIdx, cIdx, ref)}
                                            collapsable={false} // Important for measure
                                        >
                                            <Text style={styles.cellText}>{gridState[rIdx][cIdx]}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {completed && (
                        <View style={styles.resultOverlay}>
                            <Surface style={styles.resultCard} elevation={5}>
                                <Text style={styles.resultEmoji}>🧬</Text>
                                <Text variant="headlineSmall" style={styles.resultTitle}>Perfect Match!</Text>
                                <Text variant="titleMedium" style={{ marginBottom: 20 }}>Time: {displayTime}</Text>
                                <Button mode="contained" onPress={nextLevel}>
                                    {currentLevelIdx < LEVELS.length - 1 ? "Next Level" : "Finish Lab"}
                                </Button>
                            </Surface>
                        </View>
                    )}

                </View>
            </GestureHandlerRootView>

            <TutorialOverlay
                visible={showTutorial}
                title="Genetics Lab"
                instructions={[
                    "Predict the traits of the offspring.",
                    "Drag alleles from the Parents (Yellow/Green blocks).",
                    "Drop them into the grid to fill the Punnett Square.",
                    "Dominant traits are Capitalized!"
                ]}
                onStart={() => setShowTutorial(false)}
            />
        </GameLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    headerCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        marginBottom: 20, // Reduced margin
        width: width - 40
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gridContainer: {
        marginTop: 10,
        alignItems: 'center'
    },
    topRow: {
        flexDirection: 'row',
    },
    corner: {
        width: HEADER_WIDTH,
        height: 60,
    },
    topHeaderCell: {
        width: CELL_SIZE,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftHeaderCell: {
        width: HEADER_WIDTH,
        height: CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridRow: {
        flexDirection: 'row',
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderWidth: 2,
        borderColor: '#388E3C',
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2E7D32',
        letterSpacing: 4
    },
    alleleContainer: {
        width: ALLELE_SIZE,
        height: ALLELE_SIZE,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2
    },
    alleleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1B5E20'
    },
    resultOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)'
    },
    resultCard: {
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    resultEmoji: {
        fontSize: 48,
        marginBottom: 10
    },
    resultTitle: {
        color: '#2E7D32',
        marginBottom: 20,
        fontWeight: 'bold'
    }
});

export default GeneticsLabScreen;
