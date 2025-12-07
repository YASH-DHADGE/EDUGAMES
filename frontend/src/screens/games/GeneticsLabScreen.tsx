import React, { useState, useEffect, useCallback } from 'react';
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

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 60) / 2; // Simple 2x2 layout
const ALLELE_SIZE = 50;

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
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    // Grid state: 2x2 array of strings (e.g., "Tt")
    const [gridState, setGridState] = useState<string[][]>([["", ""], ["", ""]]);
    const [showTutorial, setShowTutorial] = useState(true);
    const [completed, setCompleted] = useState(false);

    const currentLevel = LEVELS[currentLevelIdx];

    // Ref to measure grid positions (Simplified: we assume fixed layout)
    // Top-Left: ~ 80, 200 ???
    // Ideally we use a measure logic, but for this prototype we'll use hit-testing logic based on percentages of screen width.

    const handleDrop = (allele: Allele, absX: number, absY: number) => {
        // Rudimentary Hit Testing
        // Grid is roughly centered.
        // Let's divide screen into 4 quadrants for the grid area.

        // This relies on the UI layout being consistent.
        // A better way is to check which "Slot" in the grid is closest.

        // Grid Top starts approx 250px down?
        // Let's assume a simplified zones logic for the 2x2 grid.
        // Row 1: Y 300-450, Row 2: Y 450-600
        // Col 1: X 50-width/2, Col 2: X width/2-width-50

        // Note: This is fragile but fast for prototyping.

        const gridTop = 280;
        const rowHeight = CELL_SIZE;
        const colWidth = CELL_SIZE;
        const startX = (width - (colWidth * 2)) / 2;

        // Determine Row
        let row = -1;
        if (absY > gridTop && absY < gridTop + rowHeight) row = 0;
        else if (absY > gridTop + rowHeight && absY < gridTop + (rowHeight * 2)) row = 1;

        // Determine Col
        let col = -1;
        if (absX > startX && absX < startX + colWidth) col = 0;
        else if (absX > startX + colWidth && absX < startX + (colWidth * 2)) col = 1;

        if (row !== -1 && col !== -1) {
            updateGrid(row, col, allele);
        }
    };

    const updateGrid = (row: number, col: number, allele: Allele) => {
        // Check if this allele belongs here.
        // Parent 1 (Top) provides the first letter (conventionally, or we sort)
        // Parent 2 (Left) provides the second.

        // Actually, Punnett squares inherit one from Top Column and one from Left Row.
        const expectedTop = currentLevel.parent1[col];
        const expectedLeft = currentLevel.parent2[row];

        // Did the user drop the correct one?
        // Let's just append to the cell if it's not full.
        setGridState(prev => {
            const currentVal = prev[row][col];
            if (currentVal.length >= 2) return prev; // Full

            // Check if valid move:
            // If cell is empty, it needs to match EITHER Top or Left (whichever hasn't been placed).
            // But simplified: Just verify if drag source matches? 
            // We passed 'allele'. 

            // Allow placement -> Validation later? Or validation on drop?
            // Validation on drop:
            if (allele !== expectedTop && allele !== expectedLeft) {
                soundManager.playWrong();
                return prev;
            }

            // Prevent duplicates if specifically strictly enforcing slots?
            // Let's just add it.
            const newVal = currentVal + allele;
            // Sort to normalize (Tt vs tT -> Tt) if mostly uppercase first
            // But let's just accept drag.

            soundManager.playClick();

            const newGrid = [...prev];
            newGrid[row] = [...prev[row]];
            newGrid[row][col] = newVal;
            return newGrid;
        });
    };

    useEffect(() => {
        checkCompletion();
    }, [gridState]);

    const checkCompletion = () => {
        // Check if grid matches solution
        let isComplete = true;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const cell = gridState[r][c];
                // Normalize for comparison
                const sortedCell = cell.split('').sort().join('');
                const sortedSol = currentLevel.solution[r][c].split('').sort().join('');

                if (sortedCell !== sortedSol) isComplete = false;
            }
        }

        if (isComplete && !completed) {
            setCompleted(true);
            soundManager.playCorrect();
            addScore(100);
            // Show finish dialog or next level?
        }
    };

    const nextLevel = () => {
        if (currentLevelIdx < LEVELS.length - 1) {
            setCurrentLevelIdx(prev => prev + 1);
            setGridState([["", ""], ["", ""]]);
            setCompleted(false);
        } else {
            endGame();
        }
    };

    const resetLevel = () => {
        setGridState([["", ""], ["", ""]]);
        setCompleted(false);
    };

    return (
        <GameLayout title="Genetics Lab" score={score} lives={3}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <LinearGradient colors={['#E8F5E9', '#A5D6A7']} style={styles.background} />

                    <Surface style={styles.headerCard} elevation={2}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{currentLevel.title}</Text>
                        <Text variant="bodySmall">{currentLevel.description}</Text>
                    </Surface>

                    {/* Punnett Square Layout */}
                    <View style={styles.gridContainer}>
                        {/* Top Parents */}
                        <View style={styles.topRow}>
                            <View style={styles.corner} />
                            {currentLevel.parent1.map((a, i) => (
                                <View key={`p1-${i}`} style={styles.headerCell}>
                                    <DraggableAllele allele={a} source="top" onDrop={handleDrop} disabled={completed} />
                                </View>
                            ))}
                        </View>

                        {/* Rows */}
                        {currentLevel.parent2.map((pAllele, rIdx) => (
                            <View key={`row-${rIdx}`} style={styles.gridRow}>
                                {/* Left Parent */}
                                <View style={styles.headerCell}>
                                    <DraggableAllele allele={pAllele} source="left" onDrop={handleDrop} disabled={completed} />
                                </View>
                                {/* Grid Cells */}
                                {[0, 1].map(cIdx => (
                                    <View key={`cell-${rIdx}-${cIdx}`} style={styles.cell}>
                                        <Text style={styles.cellText}>{gridState[rIdx][cIdx]}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>

                    {completed && (
                        <View style={styles.resultOverlay}>
                            <Surface style={styles.resultCard} elevation={5}>
                                <Text style={styles.resultEmoji}>🧬</Text>
                                <Text variant="headlineSmall" style={styles.resultTitle}>Perfect Match!</Text>
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
        paddingTop: 20
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    headerCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        marginBottom: 30,
        width: width - 40
    },
    gridContainer: {
        // marginTop: 20
    },
    topRow: {
        flexDirection: 'row',
    },
    corner: {
        width: 60,
        height: 60,
    },
    headerCell: {
        width: CELL_SIZE,
        height: 60,
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
