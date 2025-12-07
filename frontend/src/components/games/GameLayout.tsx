import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text, Surface, IconButton, useTheme, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { soundManager } from '../../utils/soundEffects';
import LevelSelectModal from './LevelSelectModal';
import { spacing, borderRadius } from '../../theme';

interface GameLayoutProps {
    children: React.ReactNode;
    title: string;
    score?: number;
    lives?: number;
    onQuit?: () => void;
    showSoundToggle?: boolean;
    headerColor?: string[];
    onLevelSelect?: () => void; // Optional override
}

const GameLayout: React.FC<GameLayoutProps> = ({
    children,
    title,
    score,
    lives,
    onQuit,
    showSoundToggle = true,
    headerColor = ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)'],
    onLevelSelect
}) => {
    const navigation = useNavigation();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [soundEnabled, setSoundEnabled] = useState(!soundManager.isMuted);
    const [showQuitDialog, setShowQuitDialog] = useState(false);
    const [showLevelSelect, setShowLevelSelect] = useState(false);

    const handleBack = () => {
        soundManager.playClick();
        setShowQuitDialog(true);
    };

    const confirmQuit = () => {
        soundManager.playClick();
        if (onQuit) {
            onQuit();
        } else {
            navigation.goBack();
        }
    };

    const toggleSound = () => {
        if (soundEnabled) {
            soundManager.mute();
        } else {
            soundManager.unmute();
        }
        setSoundEnabled(!soundEnabled);
        soundManager.playClick();
    };

    return (
        <View style={styles.container}>
            {/* Game Content Layer */}
            <View style={styles.content}>
                {children}
            </View>

            {/* HUD / Header Layer */}
            <LinearGradient
                colors={headerColor as any}
                style={[styles.header, { paddingTop: insets.top + spacing.xs }]}
                pointerEvents="box-none"
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                        <MaterialCommunityIcons name="arrow-left-circle" size={32} color="#fff" />
                    </TouchableOpacity>

                    <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>

                    <View style={styles.statsRow}>
                        {lives !== undefined && (
                            <Surface style={styles.statBadge} elevation={2}>
                                <MaterialCommunityIcons name="heart" size={20} color="#ff5252" />
                                <Text style={styles.statText}>{lives}</Text>
                            </Surface>
                        )}
                        {score !== undefined && (
                            <Surface style={styles.statBadge} elevation={2}>
                                <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
                                <Text style={styles.statText}>{score}</Text>
                            </Surface>
                        )}
                        {showSoundToggle && (
                            <TouchableOpacity onPress={toggleSound} style={styles.iconButton}>
                                <MaterialCommunityIcons
                                    name={soundEnabled ? "volume-high" : "volume-off"}
                                    size={28}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onLevelSelect || (() => setShowLevelSelect(true))} style={styles.iconButton}>
                            <MaterialCommunityIcons
                                name="grid"
                                size={28}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Quit Dialog Modal */}
            <Modal
                transparent
                visible={showQuitDialog}
                animationType="fade"
                onRequestClose={() => setShowQuitDialog(false)}
            >
                <View style={styles.modalOverlay}>
                    <Surface style={styles.quitCard} elevation={5}>
                        <MaterialCommunityIcons name="exit-run" size={48} color={theme.colors.primary} />
                        <Text variant="headlineSmall" style={styles.quitTitle}>Quit Game?</Text>
                        <Text variant="bodyMedium" style={styles.quitMessage}>
                            Your current progress will be lost.
                        </Text>
                        <View style={styles.buttonRow}>
                            <Button
                                mode="outlined"
                                onPress={() => setShowQuitDialog(false)}
                                style={styles.button}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={confirmQuit}
                                style={[styles.button, { backgroundColor: '#ff5252' }]}
                            >
                                Quit
                            </Button>
                        </View>
                    </Surface>
                </View>
            </Modal>

            {/* Level Select Modal */}
            <LevelSelectModal
                visible={showLevelSelect}
                levels={[]} // Generic empty list for now, or could pass as prop
                onSelectLevel={() => setShowLevelSelect(false)} // Placeholder
                onClose={() => setShowLevelSelect(false)}
            />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Default fallback
    },
    content: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        flex: 1,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginHorizontal: spacing.sm,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    iconButton: {
        padding: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    statText: {
        fontWeight: 'bold',
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    quitCard: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        padding: spacing.xl,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    quitTitle: {
        fontWeight: 'bold',
        marginTop: spacing.md,
        textAlign: 'center',
    },
    quitMessage: {
        textAlign: 'center',
        color: '#666',
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    button: {
        flex: 1,
    },
});

export default GameLayout;
