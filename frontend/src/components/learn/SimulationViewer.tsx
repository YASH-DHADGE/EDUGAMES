import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, Platform, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { spacing } from '../../theme';

interface SimulationViewerProps {
    visible: boolean;
    title: string;
    fileName: string;
    onClose: () => void;
}

const SimulationViewer: React.FC<SimulationViewerProps> = ({ visible, title, fileName, onClose }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (loading) {
            // Pulse animation for brain
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Rotate animation for glow
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ).start();

            // Progress bar animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(progressAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                    Animated.timing(progressAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                ])
            ).start();

            // Fade in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [loading]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['30%', '90%'],
    });

    // Construct simulation URL based on platform
    const getSimulationUrl = () => {
        if (Platform.OS === 'web') {
            return `/simulations/${fileName}`;
        }

        // Use Expo host URI for development
        const hostUri = Constants.expoConfig?.hostUri;
        if (hostUri) {
            return `http://${hostUri}/simulations/${fileName}`;
        }

        return `http://localhost:8081/simulations/${fileName}`;
    };

    const simulationUrl = getSimulationUrl();

    const toggleFullscreen = () => {
        if (Platform.OS === 'web') {
            const iframe = document.querySelector('iframe');
            if (!isFullscreen && iframe && iframe.requestFullscreen) {
                iframe.requestFullscreen();
                setIsFullscreen(true);
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Floating particles component
    const FloatingParticles = () => (
        <View style={styles.particlesContainer}>
            {[...Array(15)].map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.particle,
                        {
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 6 + 2,
                            height: Math.random() * 6 + 2,
                            opacity: Math.random() * 0.3 + 0.1,
                        },
                    ]}
                />
            ))}
        </View>
    );

    // For web, use iframe instead of WebView
    if (Platform.OS === 'web') {
        return (
            <Modal
                visible={visible}
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.container}>
                    {/* Close and Fullscreen Buttons - Floating */}
                    <View style={styles.floatingControls}>
                        <TouchableOpacity onPress={onClose} style={styles.floatingButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleFullscreen} style={styles.floatingButton}>
                            <MaterialCommunityIcons
                                name={isFullscreen ? "fullscreen-exit" : "fullscreen"}
                                size={24}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Simulation Container */}
                    <View style={styles.simulationContainer}>
                        <View style={styles.simulationInner}>
                            <iframe
                                src={simulationUrl}
                                style={{
                                    flex: 1,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    borderRadius: '0px',
                                }}
                                onLoad={() => setLoading(false)}
                                onError={() => {
                                    setError(true);
                                    setLoading(false);
                                }}
                            />
                        </View>
                    </View>

                    {/* Ultra Premium Loading Screen */}
                    {loading && (
                        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
                            <LinearGradient
                                colors={['#1a0a3e', '#6A5AE0', '#8E2DE2', '#5B4B8A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.loadingGradient}
                            >
                                <FloatingParticles />

                                <View style={styles.loadingContent}>
                                    {/* Animated Brain with Multiple Glows */}
                                    <View style={styles.loadingImageWrapper}>
                                        <Animated.View
                                            style={[
                                                styles.glowCircle1,
                                                { transform: [{ rotate: spin }] }
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.glowCircle2,
                                                { transform: [{ rotate: spin }, { scale: pulseAnim }] }
                                            ]}
                                        />
                                        <Animated.View
                                            style={[
                                                styles.loadingImageContainer,
                                                { transform: [{ scale: pulseAnim }] }
                                            ]}
                                        >
                                            <Image
                                                source={require('../../../assets/loading-brain.png')}
                                                style={styles.loadingImage}
                                                resizeMode="contain"
                                            />
                                        </Animated.View>
                                    </View>

                                    {/* App Name with Glow Effect */}
                                    <View style={styles.titleWrapper}>
                                        <Text style={styles.loadingTitle}>StreakWise</Text>
                                        <View style={styles.titleUnderline} />
                                    </View>
                                    <Text style={styles.loadingSubtitle}>Interactive Simulation</Text>

                                    {/* Advanced Progress Bar */}
                                    <View style={styles.progressBarContainer}>
                                        <View style={styles.progressBarBackground}>
                                            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                                                <LinearGradient
                                                    colors={['#FFD700', '#FFA500', '#FF6B6B']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.progressGradient}
                                                />
                                                <View style={styles.progressShine} />
                                            </Animated.View>
                                        </View>
                                        <View style={styles.progressLabels}>
                                            <Text style={styles.progressLabel}>Initializing...</Text>
                                        </View>
                                    </View>

                                    {/* Loading Text with Animated Dots */}
                                    <View style={styles.loadingTextContainer}>
                                        <MaterialCommunityIcons name="atom" size={20} color="#FFD700" />
                                        <Text style={styles.loadingText}>Loading simulation</Text>
                                        <View style={styles.dotsContainer}>
                                            <View style={[styles.loadingDot, styles.dot1]} />
                                            <View style={[styles.loadingDot, styles.dot2]} />
                                            <View style={[styles.loadingDot, styles.dot3]} />
                                        </View>
                                    </View>

                                    {/* Fun Fact */}
                                    <View style={styles.funFactContainer}>
                                        <MaterialCommunityIcons name="lightbulb-on" size={16} color="#FFD700" />
                                        <Text style={styles.funFactText}>
                                            Did you know? Interactive simulations boost learning by 60%!
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Premium Error Overlay */}
                    {error && (
                        <View style={styles.errorOverlay}>
                            <BlurView intensity={80} style={styles.errorBlur}>
                                <LinearGradient
                                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(240, 240, 255, 0.95)']}
                                    style={styles.errorContent}
                                >
                                    <View style={styles.errorIconContainer}>
                                        <View style={styles.errorIconGlow} />
                                        <MaterialCommunityIcons name="alert-circle" size={70} color="#FF6B6B" />
                                    </View>
                                    <Text variant="titleLarge" style={styles.errorTitle}>Oops!</Text>
                                    <Text variant="bodyMedium" style={styles.errorMessage}>
                                        Simulation could not load
                                    </Text>
                                    <Text variant="bodySmall" style={styles.errorHint}>
                                        Please check your connection and try again
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={() => {
                                            setError(false);
                                            setLoading(true);
                                        }}
                                    >
                                        <LinearGradient
                                            colors={['#6A5AE0', '#8E2DE2']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.retryGradient}
                                        >
                                            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                                            <Text style={styles.retryButtonText}>Try Again</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </BlurView>
                        </View>
                    )}
                </View>
            </Modal>
        );
    }

    // Mobile version (simplified but still premium)
    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.headerWrapper}>
                    <LinearGradient
                        colors={['#6A5AE0', '#8E2DE2', '#5B4B8A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerGradient}
                    >
                        <View style={styles.decorativeCircle1} />
                        <View style={styles.decorativeCircle2} />

                        <View style={styles.headerContent}>
                            <View style={styles.headerRow}>
                                <TouchableOpacity onPress={onClose} style={styles.controlButton}>
                                    <MaterialCommunityIcons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.headerTitleContainer}>
                                    <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
                                        {title}
                                    </Text>
                                    <LinearGradient
                                        colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 165, 0, 0.3)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.brandingBadge}
                                    >
                                        <MaterialCommunityIcons name="brain" size={16} color="#FFD700" />
                                        <Text style={styles.brandingText}>StreakWise Interactive</Text>
                                    </LinearGradient>
                                </View>
                                <View style={{ width: 40 }} />
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                <WebView
                    source={{ uri: simulationUrl }}
                    style={styles.webview}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setError(true);
                        setLoading(false);
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                />

                {loading && (
                    <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
                        <LinearGradient
                            colors={['#1a0a3e', '#6A5AE0', '#8E2DE2', '#5B4B8A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.loadingGradient}
                        >
                            <FloatingParticles />
                            <View style={styles.loadingContent}>
                                <View style={styles.loadingImageWrapper}>
                                    <Animated.View style={[styles.glowCircle1, { transform: [{ rotate: spin }] }]} />
                                    <Animated.View style={[styles.glowCircle2, { transform: [{ scale: pulseAnim }] }]} />
                                    <Animated.View style={[styles.loadingImageContainer, { transform: [{ scale: pulseAnim }] }]}>
                                        <Image
                                            source={require('../../../assets/loading-brain.png')}
                                            style={styles.loadingImage}
                                            resizeMode="contain"
                                        />
                                    </Animated.View>
                                </View>

                                <View style={styles.titleWrapper}>
                                    <Text style={styles.loadingTitle}>StreakWise</Text>
                                    <View style={styles.titleUnderline} />
                                </View>
                                <Text style={styles.loadingSubtitle}>Interactive Simulation</Text>

                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBarBackground}>
                                        <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                                            <LinearGradient
                                                colors={['#FFD700', '#FFA500', '#FF6B6B']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.progressGradient}
                                            />
                                        </Animated.View>
                                    </View>
                                </View>

                                <View style={styles.loadingTextContainer}>
                                    <MaterialCommunityIcons name="atom" size={20} color="#FFD700" />
                                    <Text style={styles.loadingText}>Loading simulation</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {error && (
                    <View style={styles.errorOverlay}>
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.95)', 'rgba(240, 240, 255, 0.95)']}
                            style={styles.errorContent}
                        >
                            <View style={styles.errorIconContainer}>
                                <MaterialCommunityIcons name="alert-circle" size={70} color="#FF6B6B" />
                            </View>
                            <Text variant="titleLarge" style={styles.errorTitle}>Oops!</Text>
                            <Text variant="bodyMedium" style={styles.errorMessage}>
                                Simulation could not load
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    setError(false);
                                    setLoading(true);
                                }}
                            >
                                <LinearGradient
                                    colors={['#6A5AE0', '#8E2DE2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.retryGradient}
                                >
                                    <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                                    <Text style={styles.retryButtonText}>Try Again</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    headerWrapper: {
        position: 'relative',
        overflow: 'hidden',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'web' ? 20 : 50,
        paddingBottom: 25,
        position: 'relative',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -100,
        right: -50,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        bottom: -75,
        left: -30,
    },
    headerContent: {
        paddingHorizontal: spacing.md,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: spacing.sm,
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 22,
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    brandingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    badgeGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderRadius: 20,
    },
    brandingText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    badgeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFD700',
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    blurButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    simulationContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    simulationInner: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    loadingGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    particlesContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    particle: {
        position: 'absolute',
        backgroundColor: '#FFD700',
        borderRadius: 50,
    },
    loadingContent: {
        alignItems: 'center',
        zIndex: 10,
    },
    loadingImageWrapper: {
        position: 'relative',
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    glowCircle1: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(106, 90, 224, 0.3)',
        borderWidth: 2,
        borderColor: 'rgba(142, 45, 226, 0.5)',
    },
    glowCircle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255, 165, 0, 0.4)',
    },
    loadingImageContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingImage: {
        width: '100%',
        height: '100%',
    },
    titleWrapper: {
        alignItems: 'center',
        marginBottom: 8,
    },
    loadingTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: 2,
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    titleUnderline: {
        width: 80,
        height: 3,
        backgroundColor: '#FFD700',
        borderRadius: 2,
        marginTop: 8,
    },
    loadingSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 40,
        letterSpacing: 1,
    },
    progressBarContainer: {
        width: 300,
        marginBottom: 20,
    },
    progressBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        position: 'relative',
    },
    progressGradient: {
        flex: 1,
    },
    progressShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressLabels: {
        marginTop: 8,
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    loadingTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 30,
    },
    loadingText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    loadingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFD700',
    },
    dot1: {
        opacity: 0.4,
    },
    dot2: {
        opacity: 0.7,
    },
    dot3: {
        opacity: 1,
    },
    funFactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        maxWidth: 350,
    },
    funFactText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    errorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
    },
    errorBlur: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
    },
    errorContent: {
        padding: 40,
        alignItems: 'center',
    },
    errorIconContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    errorIconGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        top: -15,
        left: -15,
    },
    errorTitle: {
        color: '#FF6B6B',
        fontWeight: '900',
        marginBottom: 12,
    },
    errorMessage: {
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorHint: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#6A5AE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    retryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    floatingControls: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    floatingButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SimulationViewer;
