import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import CoreTechLogo from '../components/CoreTechLogo';

const SplashScreen = ({ navigation }: any) => {
    const pulse = useSharedValue(1);

    useEffect(() => {
        // Pulse animation for logo
        pulse.value = withRepeat(
            withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );

        // Navigate to login after 3 seconds
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Dark Purple Gradient Background */}
            <LinearGradient
                colors={['#1a1a2e', '#26264f', '#3d3d7a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            {/* Circular Glow Effects */}
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            {/* Content */}
            <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
                {/* Pulsing Logo */}
                <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                    <CoreTechLogo width={140} height={140} />
                </Animated.View>

                {/* Title */}
                <Animated.View entering={FadeIn.delay(500).duration(1000)}>
                    <Text style={styles.title}>Discover Intelligence with</Text>
                    <Text style={styles.brandName}>CoreTechLabs AI</Text>
                    <Text style={styles.subtitle}>
                        CoreTechLabs AI unlocks smart insights{'\n'}
                        with advanced AI solutions.
                    </Text>
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    background: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    glowTop: {
        position: 'absolute',
        top: -150,
        right: -150,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
    },
    glowBottom: {
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        zIndex: 1,
    },
    logoContainer: {
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 8,
    },
    brandName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default SplashScreen;
