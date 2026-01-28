import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
    onFinish?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
    const [countdown, setCountdown] = useState(5);
    const [progress] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));

    useEffect(() => {
        // Fade in animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Progress bar animation
        Animated.timing(progress, {
            toValue: 100,
            duration: 5000,
            useNativeDriver: false,
        }).start();

        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onFinish) {
                        setTimeout(onFinish, 500);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const progressWidth = progress.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
            style={styles.container}
        >
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo Icon */}
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="flask" size={80} color="#FFFFFF" />
                </View>

                {/* App Name */}
                <Text style={styles.title}>CoreTechLabs</Text>
                <Text style={styles.subtitle}>Science Learning Platform</Text>

                {/* Countdown Circle */}
                <View style={styles.countdownContainer}>
                    <View style={styles.countdownCircle}>
                        <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                </View>

                {/* Loading Text */}
                <Text style={styles.loadingText}>Loading...</Text>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View
                        style={[
                            styles.progressBar,
                            { width: progressWidth },
                        ]}
                    >
                        <LinearGradient
                            colors={['#FBBF24', '#F59E0B', '#D97706']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.progressGradient}
                        />
                    </Animated.View>
                </View>

                {/* Animated Dots */}
                <View style={styles.dotsContainer}>
                    {[0, 1, 2].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                { opacity: countdown % 3 === i ? 1 : 0.3 },
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '80%',
    },
    iconContainer: {
        marginBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 100,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 40,
        letterSpacing: 1,
    },
    countdownContainer: {
        marginBottom: 24,
    },
    countdownCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    loadingText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: 20,
        fontWeight: '600',
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 24,
    },
    progressBar: {
        height: '100%',
    },
    progressGradient: {
        flex: 1,
        borderRadius: 3,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
    },
});

export default LoadingScreen;
