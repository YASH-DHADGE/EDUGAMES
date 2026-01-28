import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    ZoomIn,
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
import { useWindowDimensions } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

const MAX_GAME_WIDTH = 600;
const ALLELE_SIZE = 56;

type Allele = 'T' | 't' | 'B' | 'b' | 'P' | 'p';

interface LevelData {
    id: number;
    title: string;
    description: string;
    trait: string;
    parent1: [Allele, Allele];
    parent2: [Allele, Allele];
    solution: string[][];
}

const LEVELS: LevelData[] = [
    {
        id: 1,
        title: "Height Traits",
        description: "Tall (T) is dominant over Short (t)",
        trait: "Height",
        parent1: ['T', 't'],
        parent2: ['T', 't'],
        solution: [["TT", "Tt"], ["Tt", "tt"]]
    },
    {
        id: 2,
        title: "Flower Color",
        description: "Purple (P) is dominant over White (p)",
        trait: "Flower Color",
        parent1: ['P', 'P'],
        parent2: ['p', 'p'],
        solution: [["Pp", "Pp"], ["Pp", "Pp"]]
    }
];

const DraggableAllele = ({ allele, source, onDrop, disabled, isDark }: any) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    const isCapital = allele === allele.toUpperCase();
    const gradient = isCapital
        ? ['#F59E0B', '#F97316'] as const
        : ['#10B981', '#14B8A6'] as const;

    const gesture = Gesture.Pan()
        .enabled(!disabled)
        .onBegin(() => {
            scale.value = withSpring(1.15);
        })
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
        })
        .onEnd((e) => {
            runOnJS(onDrop)(allele, e.absoluteX, e.absoluteY);
        })
        .onFinalize(() => {
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            scale.value = withSpring(1);
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[animatedStyle, { opacity: disabled ? 0.5 : 1, zIndex: 999 }]}>
                <LinearGradient
                    colors={gradient}
                    style={styles(isDark).alleleChip}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles(isDark).alleleText}>{allele}</Text>
                </LinearGradient>
            </Animated.View>
        </GestureDetector>
    );
};

const GeneticsLabScreen = () => {
    const { width } = useWindowDimensions();
    const { isDark } = useAppTheme();
    const { score, addScore, endGame } = useGameProgress('genetics_lab');
    const { elapsedTime, startTimer, stopTimer, displayTime, resetTimer } = useGameTimer();

    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [gridState, setGridState] = useState<string[][]>([["", ""], ["", ""]]);
    const [showTutorial, setShowTutorial] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [wrongCell, setWrongCell] = useState<{ r: number, c: number } | null>(null);

    const currentLevel = LEVELS[currentLevelIdx];
    const dropZoneRefs = useRef<{ [key: string]: View | null }>({});

    const containerWidth = Math.min(width - 40, MAX_GAME_WIDTH);
    const cellSize = (containerWidth - 120) / 2;

    const setDropZoneRef = (row: number, col: number, ref: View | null) => {
        dropZoneRefs.current[`${row}-${col}`] = ref;
    };

    const handleDropWithMeasurement = async (allele: Allele, absX: number, absY: number) => {
        let targetRow = -1;
        let targetCol = -1;

        const keys = Object.keys(dropZoneRefs.current);

        for (const key of keys) {
            const ref = dropZoneRefs.current[key];
            if (!ref) continue;

            try {
                const isInside = await new Promise<boolean>((resolve) => {
                    ref.measure((x, y, width, height, pageX, pageY) => {
                        if (pageX && pageY && absX >= pageX && absX <= pageX + width &&
                            absY >= pageY && absY <= pageY + height) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    });
                });

                if (isInside) {
                    const [r, c] = key.split('-').map(Number);
                    targetRow = r;
                    targetCol = c;
                    break;
                }
            } catch (e) {
                console.log('Measure error:', e);
            }
        }

        if (targetRow !== -1 && targetCol !== -1) {
            updateGrid(targetRow, targetCol, allele);
        }
    };

    const updateGrid = (row: number, col: number, allele: Allele) => {
        setGridState(prev => {
            const currentVal = prev[row][col];
            if (currentVal.length >= 2) return prev;

            const neededForCell = [currentLevel.parent1[col], currentLevel.parent2[row]];
            const currentAlleles = currentVal.split('');
            const remainingNeeded = [...neededForCell];

            currentAlleles.forEach(existing => {
                const idx = remainingNeeded.indexOf(existing as Allele);
                if (idx > -1) remainingNeeded.splice(idx, 1);
            });

            const matchIndex = remainingNeeded.indexOf(allele);

            if (matchIndex === -1) {
                soundManager.playWrong();
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
        resetTimer();
        startTimer();
        soundManager.playClick();
    };

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

    useEffect(() => {
        startTimer();
        return () => stopTimer();
    }, []);

    useEffect(() => {
        checkCompletion();
    }, [gridState]);

    return (
        <GameLayout title="Genetics Lab" score={score} lives={3} timer={displayTime}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles(isDark).container}>
                    {/* Compact Info Bar */}
                    <View style={styles(isDark).infoBar}>
                        <View style={styles(isDark).levelBadge}>
                            <Text style={styles(isDark).levelText}>Level {currentLevel.id}/{LEVELS.length}</Text>
                        </View>
                        <Text style={styles(isDark).infoTitle}>{currentLevel.title}</Text>
                        <View style={styles(isDark).infoActions}>
                            <TouchableOpacity style={styles(isDark).miniButton} onPress={() => setShowTutorial(true)}>
                                <MaterialCommunityIcons name="help-circle-outline" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles(isDark).miniButton} onPress={handleReset}>
                                <MaterialCommunityIcons name="refresh" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles(isDark).description}>{currentLevel.description}</Text>

                    {/* Traditional Punnett Square */}
                    <View style={styles(isDark).punnettContainer}>
                        {/* Top Row */}
                        <View style={styles(isDark).topRow}>
                            <View style={styles(isDark).cornerCell}>
                                <Text style={styles(isDark).cornerLabel}>Parents</Text>
                            </View>
                            {currentLevel.parent1.map((a, i) => (
                                <View key={`p1-${i}`} style={[styles(isDark).headerCell, { width: cellSize }]}>
                                    <DraggableAllele allele={a} source="top" onDrop={handleDropWithMeasurement} disabled={completed} isDark={isDark} />
                                </View>
                            ))}
                        </View>

                        {/* Grid Rows */}
                        {[0, 1].map(r => (
                            <View key={`row-${r}`} style={styles(isDark).gridRow}>
                                <View style={styles(isDark).leftCell}>
                                    <DraggableAllele allele={currentLevel.parent2[r]} source="left" onDrop={handleDropWithMeasurement} disabled={completed} isDark={isDark} />
                                </View>

                                {[0, 1].map(c => {
                                    const isWrong = wrongCell?.r === r && wrongCell?.c === c;
                                    const isFilled = gridState[r][c].length === 2;
                                    return (
                                        <View key={`cell-${r}-${c}`} style={{ width: cellSize }}>
                                            <LinearGradient
                                                colors={isDark ? ['#1E293B', '#1E293B'] as const : ['#EEF2FF', '#EEF2FF'] as const}
                                                style={[styles(isDark).gridCell, { height: cellSize }, isWrong && styles(isDark).wrongCell, isFilled && styles(isDark).filledCell]}
                                            >
                                                <View ref={ref => setDropZoneRef(r, c, ref)} collapsable={false} style={styles(isDark).dropZone}>
                                                    <Text style={styles(isDark).cellText}>{gridState[r][c]}</Text>
                                                    {isFilled && (
                                                        <Animated.View entering={ZoomIn.springify()} style={styles(isDark).checkmark}>
                                                            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                                                        </Animated.View>
                                                    )}
                                                </View>
                                            </LinearGradient>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Completion Modal */}
                    {completed && (
                        <Animated.View entering={ZoomIn.springify()} style={styles(isDark).resultOverlay}>
                            <LinearGradient colors={isDark ? ['#1E293B', '#334155'] as const : ['#EEF2FF', '#fff'] as const} style={styles(isDark).resultCard}>
                                <MaterialCommunityIcons name="dna" size={64} color="#6366F1" />
                                <Text style={styles(isDark).resultTitle}>Perfect Genetics!</Text>

                                <View style={styles(isDark).statsRow}>
                                    <View style={styles(isDark).statChip}>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color="#6366F1" />
                                        <Text style={styles(isDark).statText}>{displayTime}</Text>
                                    </View>
                                    <View style={styles(isDark).statChip}>
                                        <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                                        <Text style={styles(isDark).statText}>+100</Text>
                                    </View>
                                </View>

                                <TouchableOpacity onPress={nextLevel} activeOpacity={0.9}>
                                    <LinearGradient colors={['#6366F1', '#4F46E5'] as const} style={styles(isDark).continueButton}>
                                        <Text style={styles(isDark).continueText}>{currentLevelIdx < LEVELS.length - 1 ? "Next Level" : "Finish Lab"}</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    )}
                </View>
            </GestureHandlerRootView>

            <TutorialOverlay
                visible={showTutorial}
                title="Genetics Lab"
                instructions={["🧬 Complete the Punnett square", "📍 Drag alleles from sides", "🎯 Drop into grid cells", "💡 Capital = Dominant!"]}
                onStart={() => setShowTutorial(false)}
            />
        </GameLayout >
    );
};

const styles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC', padding: 20 },
    infoBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
    levelBadge: { backgroundColor: isDark ? '#334155' : '#E2E8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    levelText: { color: isDark ? '#F8FAFC' : '#0F172A', fontSize: 12, fontWeight: '700' },
    infoTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: -0.5 },
    infoActions: { flexDirection: 'row', gap: 8 },
    miniButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? '#1E293B' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    description: { fontSize: 14, color: isDark ? '#94A3B8' : '#64748B', marginBottom: 24, fontWeight: '500' },
    punnettContainer: { alignSelf: 'center', marginTop: 20 },
    topRow: { flexDirection: 'row', marginBottom: 12 },
    cornerCell: { width: 100, height: 80, justifyContent: 'center', alignItems: 'center' },
    cornerLabel: { fontSize: 12, fontWeight: '600', color: isDark ? '#64748B' : '#94A3B8' },
    headerCell: { height: 80, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
    leftCell: { width: 100, justifyContent: 'center', alignItems: 'center' },
    gridRow: { flexDirection: 'row', marginBottom: 12 },
    gridCell: { borderRadius: 16, borderWidth: 2, borderColor: isDark ? '#475569' : '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginLeft: 12, shadowColor: isDark ? '#000' : '#1E293B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 8, elevation: 2 },
    wrongCell: { borderColor: '#EF4444', backgroundColor: isDark ? '#450a0a' : '#FEE2E2' },
    filledCell: { borderColor: '#10B981' },
    dropZone: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cellText: { fontSize: 28, fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: 2 },
    checkmark: { position: 'absolute', top: 8, right: 8 },
    alleleChip: { width: ALLELE_SIZE, height: ALLELE_SIZE, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
    alleleText: { fontSize: 28, fontWeight: '800', color: '#fff' },
    resultOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 24 },
    resultCard: { borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 400, borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' },
    resultTitle: { fontSize: 28, fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', marginTop: 16, marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    statChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: isDark ? '#334155' : '#F1F5F9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    statText: { fontSize: 16, fontWeight: '700', color: isDark ? '#F8FAFC' : '#0F172A' },
    continueButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
    continueText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default GeneticsLabScreen;
