import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Surface, useTheme, IconButton } from 'react-native-paper';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { spacing } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Level {
    id: string | number;
    title: string;
    locked: boolean;
    stars?: number; // 0-3
}

interface LevelSelectModalProps {
    visible: boolean;
    title?: string;
    levels: Level[];
    onSelectLevel: (levelId: string | number) => void;
    onClose: () => void;
}

const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
    visible,
    title = "Select Level",
    levels,
    onSelectLevel,
    onClose
}) => {
    const theme = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Animated.View entering={ZoomIn.duration(400)} style={styles.content}>
                    <Surface style={styles.card} elevation={5}>
                        <View style={styles.header}>
                            <Text variant="headlineSmall" style={styles.title}>{title}</Text>
                            <IconButton icon="close" onPress={onClose} />
                        </View>

                        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                            {levels.map((level, index) => (
                                <TouchableOpacity
                                    key={level.id}
                                    style={[
                                        styles.levelBtn,
                                        level.locked && styles.lockedBtn,
                                        { borderColor: theme.colors.primary }
                                    ]}
                                    onPress={() => !level.locked && onSelectLevel(level.id)}
                                    activeOpacity={level.locked ? 1 : 0.7}
                                >
                                    {level.locked ? (
                                        <MaterialCommunityIcons name="lock" size={32} color="#999" />
                                    ) : (
                                        <>
                                            <Text style={[styles.levelNumber, { color: theme.colors.primary }]}>
                                                {index + 1}
                                            </Text>
                                            {level.stars !== undefined && (
                                                <View style={styles.starsRow}>
                                                    {[1, 2, 3].map(s => (
                                                        <MaterialCommunityIcons
                                                            key={s}
                                                            name={s <= level.stars! ? "star" : "star-outline"}
                                                            size={14}
                                                            color="#FFD700"
                                                        />
                                                    ))}
                                                </View>
                                            )}
                                        </>
                                    )}
                                    <Text style={styles.levelLabel} numberOfLines={1}>
                                        {level.title}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Surface>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    card: {
        borderRadius: 24,
        padding: spacing.lg,
        backgroundColor: '#fff',
        flex: 1
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md
    },
    title: {
        fontWeight: 'bold',
        marginLeft: spacing.xs
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        justifyContent: 'center',
        paddingBottom: spacing.lg
    },
    levelBtn: {
        width: 80,
        height: 100,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 4
    },
    lockedBtn: {
        borderColor: '#ccc',
        backgroundColor: '#E0E0E0',
        opacity: 0.8
    },
    levelNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4
    },
    starsRow: {
        flexDirection: 'row',
        marginBottom: 4
    },
    levelLabel: {
        fontSize: 10,
        textAlign: 'center',
        color: '#666'
    }
});

export default LevelSelectModal;
