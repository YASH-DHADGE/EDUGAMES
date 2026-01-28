import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    withTiming,
    withRepeat,
    ZoomIn,
    FadeOut
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiAnimation from '../ConfettiAnimation';

const { width } = Dimensions.get('window');

const LevelUpPopup = () => {
    const { showLevelUp, closeLevelUp, level } = useAuth();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (showLevelUp) {
            // Trigger confetti slightly after popup appears
            const timer = setTimeout(() => setShowConfetti(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowConfetti(false);
        }
    }, [showLevelUp]);

    const handleClose = () => {
        setShowConfetti(false);
        closeLevelUp();
    };

    if (!showLevelUp) return null;

    return (
        <Portal>
            <View style={styles.overlay} pointerEvents="box-none">
                {/* Backdrop Tap to Close */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }} />
                </TouchableOpacity>

                {/* Confetti (Behind or Over?) - Over looks best for celebration */}
                {showConfetti && <ConfettiAnimation isVisible={true} onComplete={() => setShowConfetti(false)} />}

                <Animated.View
                    entering={ZoomIn.springify().damping(12)}
                    exiting={FadeOut.duration(200)}
                    style={styles.container}
                    pointerEvents="box-none"
                >
                    <LinearGradient
                        colors={['#FFD700', '#F59E0B', '#B45309']} // Premium Gold Gradient
                        style={styles.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Shimmer/Glow Effect Overlay */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0.5 }}
                        />

                        {/* Animated Trophy */}
                        <TrophyIcon />

                        <Text style={styles.title}>LEVEL UP!</Text>

                        <View style={styles.levelBadge}>
                            <LinearGradient
                                colors={['#fff', '#f0f9ff']}
                                style={styles.badgeInner}
                            >
                                <Text style={styles.levelText}>{level}</Text>
                                <Text style={styles.levelLabel}>LEVEL</Text>
                            </LinearGradient>
                        </View>

                        <Text style={styles.subtitle}>Outstanding!</Text>
                        <Text style={styles.description}>You've unlocked new content.</Text>

                        <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
                            <Text style={styles.buttonText}>CONTINUE</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Portal>
    );
};

const TrophyIcon = () => {
    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        scale.value = withSequence(withSpring(1.2), withSpring(1));
        rotate.value = withRepeat(
            withSequence(withTiming(-10, { duration: 1000 }), withTiming(10, { duration: 1000 })),
            -1,
            true
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }]
    }));

    return (
        <Animated.View style={[styles.iconContainer, style]}>
            <MaterialCommunityIcons name="trophy" size={80} color="#FFF" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 10 }} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    container: {
        width: width * 0.85,
        maxWidth: 360,
        borderRadius: 40,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        backgroundColor: '#fff',
    },
    gradient: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 24,
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    levelBadge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginBottom: 24,
    },
    badgeInner: {
        flex: 1,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#B45309',
    },
    levelText: {
        fontSize: 48,
        fontWeight: '900',
        color: '#B45309',
        height: 56, // Fix alignment
        lineHeight: 56,
    },
    levelLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 32,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#B45309',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

export default LevelUpPopup;
