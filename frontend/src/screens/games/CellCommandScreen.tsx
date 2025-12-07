import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameLayout from '../../components/games/GameLayout';
import TutorialOverlay from '../../components/games/TutorialOverlay';
import { useGameProgress } from '../../hooks/useGameProgress';
import { spacing } from '../../theme';
import { soundManager } from '../../utils/soundEffects';

const { height } = Dimensions.get('window');

// Game Data
const ORGANELLES = [
    { id: 'nucleus', name: 'Nucleus', icon: 'circle-opacity', color: '#9C27B0', targetPos: { x: 0, y: 0 } },
    { id: 'mitochondria', name: 'Mitochondria', icon: 'bacteria', color: '#FF9800', targetPos: { x: -80, y: -60 } },
    { id: 'ribosome', name: 'Ribosome', icon: 'dots-hexagon', color: '#F44336', targetPos: { x: 60, y: 50 } },
    { id: 'vacuole', name: 'Vacuole', icon: 'water', color: '#2196F3', targetPos: { x: 70, y: -40 } },
    { id: 'lysosome', name: 'Lysosome', icon: 'virus', color: '#4CAF50', targetPos: { x: -50, y: 70 } },
];

const DropZone = ({ x, y, active }: { x: number, y: number, active: boolean }) => (
    <View style={[styles.dropZone, { transform: [{ translateX: x }, { translateY: y }], borderColor: active ? '#fff' : 'rgba(255,255,255,0.3)' }]}>
        <View style={[styles.dropZoneInner, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent' }]} />
    </View>
);

const DraggableItem = ({ item, onDrop, completed }: { item: any, onDrop: (id: string) => void, completed: boolean }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });

    const pan = Gesture.Pan()
        .onStart(() => {
            if (completed) return;
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            if (completed) return;
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd((event) => {
            if (completed) return;
            if (event.absoluteY < height * 0.6) {
                runOnJS(onDrop)(item.id);
            }
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
            opacity: completed ? 0.5 : 1
        };
    });

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.draggable, animatedStyle]}>
                <Surface style={[styles.organelleBadge, { backgroundColor: item.color }]} elevation={4}>
                    <MaterialCommunityIcons name={item.icon as any} size={32} color="#fff" />
                </Surface>
                <Text style={styles.organelleLabel}>{item.name}</Text>
            </Animated.View>
        </GestureDetector>
    );
};

const CellCommandScreen = () => {
    const { score, addScore, endGame } = useGameProgress('cell_command');
    const [showTutorial, setShowTutorial] = useState(true);
    const [placedItems, setPlacedItems] = useState<string[]>([]);
    const [currentOrganelleIndex, setCurrentOrganelleIndex] = useState(0);

    const handleDrop = (id: string) => {
        if (id === ORGANELLES[currentOrganelleIndex].id) {
            soundManager.playCorrect();
            addScore(50);
            setPlacedItems(prev => [...prev, id]);

            if (currentOrganelleIndex < ORGANELLES.length - 1) {
                setCurrentOrganelleIndex(prev => prev + 1);
            } else {
                endGame();
            }
        } else {
            soundManager.playWrong();
        }
    };

    const currentTarget = ORGANELLES[currentOrganelleIndex];

    return (
        <GameLayout title="Cell Command" score={score}>
            <GestureHandlerRootView style={styles.container}>
                <LinearGradient
                    colors={['#2c3e50', '#000000']}
                    style={styles.gradient}
                >
                    <View style={styles.cellContainer}>
                        <View style={styles.cellMembrane}>
                            {placedItems.map(id => {
                                const item = ORGANELLES.find(o => o.id === id);
                                if (!item) return null;
                                return (
                                    <View
                                        key={id}
                                        style={[
                                            styles.placedItem,
                                            {
                                                transform: [
                                                    { translateX: item.targetPos.x },
                                                    { translateY: item.targetPos.y }
                                                ],
                                                backgroundColor: item.color
                                            }
                                        ]}
                                    >
                                        <MaterialCommunityIcons name={item.icon as any} size={24} color="#fff" />
                                    </View>
                                );
                            })}

                            {currentTarget && !placedItems.includes(currentTarget.id) && (
                                <DropZone
                                    x={currentTarget.targetPos.x}
                                    y={currentTarget.targetPos.y}
                                    active={true}
                                />
                            )}
                        </View>
                        <Text style={styles.instructionText}>
                            Place the <Text style={{ fontWeight: 'bold', color: currentTarget?.color }}>{currentTarget?.name}</Text>
                        </Text>
                    </View>

                    <Surface style={styles.palette} elevation={4}>
                        <Text style={styles.paletteTitle}>Parts Tray</Text>
                        <View style={styles.partsRow}>
                            {ORGANELLES.map((item) => (
                                <DraggableItem
                                    key={item.id}
                                    item={item}
                                    onDrop={handleDrop}
                                    completed={placedItems.includes(item.id)}
                                />
                            ))}
                        </View>
                    </Surface>
                </LinearGradient>
            </GestureHandlerRootView>

            <TutorialOverlay
                visible={showTutorial}
                title="Build the Cell!"
                instructions={[
                    "You are the Cell Commander.",
                    "Drag organelles from the tray below.",
                    "Place them correctly inside the cell membrane."
                ]}
                onStart={() => setShowTutorial(false)}
            />
        </GameLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cellContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellMembrane: {
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    dropZone: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropZoneInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    placedItem: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    instructionText: {
        marginTop: spacing.xl,
        color: '#fff',
        fontSize: 18,
    },
    palette: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    paletteTitle: {
        fontWeight: 'bold',
        marginBottom: spacing.md,
        color: '#333',
    },
    partsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    draggable: {
        alignItems: 'center',
    },
    organelleBadge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    organelleLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
});

export default CellCommandScreen;
