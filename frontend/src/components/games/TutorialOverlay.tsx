import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Image, Dimensions } from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import Animated, { FadeIn, ZoomIn, SlideInDown } from 'react-native-reanimated';
import { spacing } from '../../theme';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface TutorialOverlayProps {
    visible: boolean;
    title: string;
    instructions: string[];
    onStart: () => void;
    icon?: string; // Material Icon Name or similar
    lottieSource?: any; // For animated tutorials
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
    visible,
    title,
    instructions,
    onStart,
    lottieSource
}) => {
    const theme = useTheme();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.container}>
                <Animated.View entering={ZoomIn.duration(400)} style={styles.content}>
                    <Surface style={styles.card} elevation={5}>
                        {lottieSource && (
                            <View style={styles.lottieContainer}>
                                <LottieView
                                    source={lottieSource}
                                    autoPlay
                                    loop
                                    style={styles.lottie}
                                />
                            </View>
                        )}

                        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
                            {title}
                        </Text>

                        <View style={styles.instructionsContainer}>
                            {instructions.map((step, index) => (
                                <Animated.View
                                    key={index}
                                    entering={SlideInDown.delay(index * 200).springify()}
                                    style={styles.stepRow}
                                >
                                    <View style={[styles.stepBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>{index + 1}</Text>
                                    </View>
                                    <Text variant="bodyLarge" style={styles.stepText}>{step}</Text>
                                </Animated.View>
                            ))}
                        </View>

                        <Button
                            mode="contained"
                            onPress={onStart}
                            style={styles.button}
                            contentStyle={{ paddingVertical: 8 }}
                            labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                        >
                            Start Game
                        </Button>
                    </Surface>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    content: {
        width: '100%',
        maxWidth: 400,
    },
    card: {
        padding: spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    lottieContainer: {
        marginBottom: spacing.md,
    },
    lottie: {
        width: 150,
        height: 150,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    instructionsContainer: {
        width: '100%',
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    stepBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumber: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    stepText: {
        flex: 1,
        color: '#444',
    },
    button: {
        width: '100%',
        borderRadius: 12,
    },
});

export default TutorialOverlay;
