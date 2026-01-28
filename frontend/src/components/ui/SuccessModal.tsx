import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn, FadeOut, ZoomOut } from 'react-native-reanimated';
import { colors, shadows, borderRadius } from '../../theme'; // Ensure these imports match your theme structure

const { width } = Dimensions.get('window');

interface SuccessModalProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
    visible,
    title,
    message,
    onClose,
    buttonText = "Continue"
}) => {
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={ZoomIn.duration(300).springify()}
                    exiting={ZoomOut.duration(200)}
                    style={styles.container}
                >
                    <Surface style={styles.surface} elevation={4}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="check-circle" size={64} color={colors.primary} />
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <Button
                            mode="contained"
                            onPress={onClose}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                        >
                            {buttonText}
                        </Button>
                    </Surface>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    surface: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        ...shadows.lg,
    },
    iconContainer: {
        marginBottom: 20,
        // Add a subtle bounce or glow if desired
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937', // Gray 900
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#6B7280', // Gray 500
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: colors.primary,
        paddingVertical: 4,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 2,
    }
});

export default SuccessModal;
