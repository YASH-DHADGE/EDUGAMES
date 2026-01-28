import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeOut,
    ZoomIn,
    SlideInRight,
    SlideOutLeft,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    icon: string;
    title: string;
    description: string;
}

const slides: OnboardingSlide[] = [
    {
        icon: 'book-open-variant',
        title: 'Learn at Your Pace',
        description: 'Master Math & Science with interactive lessons tailored just for you.',
    },
    {
        icon: 'gamepad-variant',
        title: 'Play to Learn',
        description: 'Turn study time into game time. Earn XP, unlock levels, and have fun!',
    },
    {
        icon: 'trophy-award',
        title: 'Earn Rewards',
        description: 'Build your streak, climb the leaderboard, and become a top student.',
    },
];

interface OnboardingTutorialProps {
    onComplete: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        onComplete();
    };

    return (
        <Modal visible={true} transparent animationType="fade">
            <View style={styles.overlay}>
                {/* Backdrop Blur (if supported, else dark overlay) */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleComplete}
                />

                <Animated.View
                    entering={ZoomIn.springify().damping(12)}
                    exiting={FadeOut}
                    style={styles.container}
                >
                    <LinearGradient
                        colors={['#2E1065', '#4C1D95', '#5B21B6']} // Deep Premium Purple
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientCard}
                    >
                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeBtn} onPress={handleComplete}>
                            <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>

                        {/* Animated Icon */}
                        <View style={styles.iconContainer}>
                            <FloatingIcon icon={slides[currentSlide].icon} />
                        </View>

                        {/* Text Content with Slide Animation */}
                        <Animated.View
                            key={currentSlide}
                            entering={SlideInRight.springify().damping(15)}
                            exiting={SlideOutLeft.duration(200)}
                            style={styles.textContainer}
                        >
                            <Text style={styles.title}>{slides[currentSlide].title}</Text>
                            <Text style={styles.description}>{slides[currentSlide].description}</Text>
                        </Animated.View>

                        {/* Progress Dots */}
                        <View style={styles.dotsContainer}>
                            {slides.map((_, i) => (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === currentSlide ? styles.dotActive : styles.dotInactive
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={handleNext}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#F472B6', '#DB2777']} // Pink/Rose pop
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                <Text style={styles.btnText}>
                                    {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                                </Text>
                                <MaterialCommunityIcons
                                    name={currentSlide === slides.length - 1 ? "rocket-launch" : "arrow-right"}
                                    size={20}
                                    color="#fff"
                                />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Skip Button */}
                        {currentSlide < slides.length - 1 && (
                            <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>
                        )}
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

// Sub-component for Icon Animation
const FloatingIcon = ({ icon }: { icon: string }) => {
    const y = useSharedValue(0);

    React.useEffect(() => {
        y.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 1500 }),
                withTiming(0, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }]
    }));

    return (
        <Animated.View style={style}>
            <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                style={styles.iconCircle}
            >
                <MaterialCommunityIcons name={icon as any} size={48} color="#fff" />
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 32,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    gradientCard: {
        padding: 32,
        borderRadius: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    iconContainer: {
        height: 120,
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    textContainer: {
        alignItems: 'center',
        height: 100, // Fixed height to prevent jump
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
        marginTop: 10,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 24,
        backgroundColor: '#F472B6',
    },
    dotInactive: {
        width: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    actionBtn: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#F472B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnGradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    skipBtn: {
        padding: 8,
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default OnboardingTutorial;
