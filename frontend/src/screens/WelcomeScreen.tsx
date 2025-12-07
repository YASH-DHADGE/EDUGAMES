import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, StatusBar, Animated as RNAnimated, Easing } from 'react-native';
import { Text, TextInput, ActivityIndicator, Surface, Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn, Layout, SlideInDown } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { theme, spacing, borderRadius, typography, shadows, gradients } from '../theme';
import { useAppTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: 1,
        icon: 'lightning-bolt',
        title: 'Track Your Streaks',
        description: 'Stay consistent and build daily learning habits.',
    },
    {
        id: 2,
        icon: 'trophy-variant',
        title: 'Earn Rewards',
        description: 'Unlock badges, collect XP, and level up as you progress.',
    },
    {
        id: 3,
        icon: 'rocket-launch',
        title: 'Learn Anywhere',
        description: 'Access your lessons offline. Learn at your own pace.',
    },
];

// Burst Particle Component
const BurstParticle = ({ angle, distance, color }: any) => {
    const anim = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        RNAnimated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
        }).start();
    }, []);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * distance],
    });

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * distance],
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 0.8, 0],
    });

    const scale = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    return (
        <RNAnimated.View
            style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: color,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
            }}
        />
    );
};

// Bubble Animation Component
const Bubble = ({ size, initialX, initialY, duration, delay = 0 }: any) => {
    const translateY = useRef(new RNAnimated.Value(0)).current;
    const scale = useRef(new RNAnimated.Value(1)).current;
    const opacity = useRef(new RNAnimated.Value(1)).current;
    const [popped, setPopped] = useState(false);
    const [showParticles, setShowParticles] = useState(false);

    useEffect(() => {
        if (!popped) {
            // Reset animations when reappearing
            scale.setValue(1);
            opacity.setValue(1);

            RNAnimated.loop(
                RNAnimated.sequence([
                    RNAnimated.timing(translateY, {
                        toValue: -30,
                        duration: duration,
                        useNativeDriver: true,
                        delay: delay,
                    }),
                    RNAnimated.timing(translateY, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [popped]);

    const handlePress = () => {
        if (popped) return;
        setPopped(true);
        setShowParticles(true);

        // Pop animation
        RNAnimated.parallel([
            RNAnimated.timing(scale, {
                toValue: 1.2,
                duration: 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            RNAnimated.timing(opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        // Hide particles after animation
        setTimeout(() => {
            setShowParticles(false);
        }, 1000);

        // Reappear after 10 seconds
        setTimeout(() => {
            setPopped(false);
        }, 10000);
    };

    // Generate particles for the burst
    const particles = React.useMemo(() => {
        if (!showParticles) return [];
        const items = [];
        for (let i = 0; i < 8; i++) {
            items.push({
                id: i,
                angle: (i * Math.PI * 2) / 8,
                distance: size * 0.8,
            });
        }
        return items;
    }, [showParticles, size]);

    return (
        <View style={{ position: 'absolute', left: initialX, top: initialY, zIndex: 0 }}>
            <RNAnimated.View
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    transform: [{ translateY }, { scale }],
                    opacity: opacity,
                    overflow: 'hidden',
                }}
            >
                <TouchableOpacity activeOpacity={1} onPress={handlePress} style={{ flex: 1 }}>
                    {/* Water-like Theme Colors */}
                    <LinearGradient
                        colors={['rgba(14, 165, 233, 0.3)', 'rgba(56, 189, 248, 0.1)']} // Sky blue / Cyan
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            flex: 1,
                            borderRadius: size / 2,
                            borderWidth: 1,
                            borderColor: 'rgba(56, 189, 248, 0.4)',
                        }}
                    />
                    {/* Shine effect */}
                    <View
                        style={{
                            position: 'absolute',
                            top: size * 0.15,
                            left: size * 0.15,
                            width: size * 0.25,
                            height: size * 0.15,
                            borderRadius: size,
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            transform: [{ rotate: '-45deg' }]
                        }}
                    />
                </TouchableOpacity>
            </RNAnimated.View>

            {/* Burst Particles */}
            {showParticles && (
                <View style={{ position: 'absolute', left: size / 2, top: size / 2 }}>
                    {particles.map((p) => (
                        <BurstParticle
                            key={p.id}
                            angle={p.angle}
                            distance={p.distance}
                            color={'#38BDF8'} // Light Blue
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const BackgroundBubbles = () => {
    // Generate random bubbles
    const bubbles = React.useMemo(() => {
        const items = [];
        for (let i = 0; i < 6; i++) {
            items.push({
                id: i,
                size: Math.random() * 60 + 40, // 40-100
                x: Math.random() * width,
                y: Math.random() * height,
                duration: Math.random() * 3000 + 3000, // 3-6s
                delay: Math.random() * 2000,
            });
        }
        return items;
    }, []);

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="box-none">
            {bubbles.map((b) => (
                <Bubble
                    key={b.id}
                    size={b.size}
                    initialX={b.x}
                    initialY={b.y}
                    duration={b.duration}
                    delay={b.delay}
                />
            ))}
        </View>
    );
};

const WelcomeScreen = ({ navigation }: any) => {
    const { login, register, loginAsGuest } = useAuth();
    const { theme: activeTheme, isDark } = useAppTheme();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const scrollViewRef = useRef<ScrollView>(null);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [showRoleMenu, setShowRoleMenu] = useState(false);
    const [showClassMenu, setShowClassMenu] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleScroll = (event: any) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentSlide(slideIndex);
    };

    const goToNextSlide = () => {
        if (currentSlide < SLIDES.length - 1) {
            scrollViewRef.current?.scrollTo({
                x: width * (currentSlide + 1),
                animated: true,
            });
        } else {
            openAuthModal('login');
        }
    };

    const handleAuth = async () => {
        if (!email || !password || (authMode === 'register' && !name)) {
            setError('Please fill in all fields');
            return;
        }

        if (authMode === 'register') {
            if (role === 'student' && !selectedClass) {
                setError('Please select a class');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            if (authMode === 'login') {
                await login(email, password);
            } else {
                await register({
                    name,
                    email,
                    password,
                    language: 'en',
                    role,
                    selectedClass: role === 'student' ? selectedClass : null
                });
            }
        } catch (e: any) {
            setError(e?.response?.data?.message || `${authMode === 'login' ? 'Login' : 'Registration'} failed. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const openAuthModal = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setShowAuthModal(true);
        setError('');
    };

    if (showAuthModal) {
        return (
            <View style={[styles.loginContainer, { backgroundColor: activeTheme.colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "light-content"} backgroundColor="transparent" translucent />

                {/* Interactive Bubbles in Modal */}
                {/* Moved to bottom for z-index */}

                {/* Curved Header */}
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerBackground}
                >
                    {/* Decorative Bubbles in Header */}
                    <View style={[styles.decorativeCircle, { top: -60, right: -40, width: 180, height: 180, opacity: 0.2 }]} />
                    <View style={[styles.decorativeCircle, { bottom: -20, left: -20, width: 100, height: 100, opacity: 0.1 }]} />

                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            onPress={() => setShowAuthModal(false)}
                            style={styles.backButton}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Animated.View entering={FadeInDown.duration(600)}>
                            <Text style={styles.headerTitle}>
                                {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                {authMode === 'login' ? 'Sign in to continue learning' : 'Join us and start learning'}
                            </Text>
                        </Animated.View>
                    </View>
                </LinearGradient>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.loginScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            entering={SlideInDown.duration(500)}
                            style={styles.formContainer}
                        >
                            <Surface style={[styles.formCard, { backgroundColor: activeTheme.colors.surface }]} elevation={3}>
                                {authMode === 'register' && (
                                    <>
                                        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: activeTheme.colors.textSecondary }]}>Full Name</Text>
                                            <View style={[styles.inputWrapper, { backgroundColor: activeTheme.colors.surfaceVariant + '40', borderColor: activeTheme.colors.outline + '20' }]}>
                                                <MaterialCommunityIcons name="account-outline" size={20} color={activeTheme.colors.primary} style={styles.inputIcon} />
                                                <TextInput
                                                    mode="flat"
                                                    value={name}
                                                    onChangeText={setName}
                                                    placeholder="John Doe"
                                                    style={styles.input}
                                                    underlineColor="transparent"
                                                    activeUnderlineColor="transparent"
                                                    textColor={activeTheme.colors.onSurface}
                                                    placeholderTextColor={activeTheme.colors.textTertiary}
                                                />
                                            </View>
                                        </Animated.View>

                                        {/* Role Selection */}
                                        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.inputGroup}>
                                            <Text style={[styles.inputLabel, { color: activeTheme.colors.textSecondary }]}>I am a</Text>
                                            <Menu
                                                visible={showRoleMenu}
                                                onDismiss={() => setShowRoleMenu(false)}
                                                anchor={
                                                    <TouchableOpacity
                                                        onPress={() => setShowRoleMenu(true)}
                                                        style={[styles.inputWrapper, { backgroundColor: activeTheme.colors.surfaceVariant + '40', borderColor: activeTheme.colors.outline + '20' }]}
                                                    >
                                                        <MaterialCommunityIcons name="account-tie-outline" size={20} color={activeTheme.colors.primary} style={styles.inputIcon} />
                                                        <Text style={[styles.inputText, { color: activeTheme.colors.onSurface }]}>
                                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                                        </Text>
                                                        <MaterialCommunityIcons name="chevron-down" size={20} color={activeTheme.colors.outline} style={{ marginRight: spacing.md }} />
                                                    </TouchableOpacity>
                                                }
                                                contentStyle={{ backgroundColor: activeTheme.colors.surface, borderRadius: borderRadius.lg }}
                                            >
                                                {['student', 'teacher', 'institute', 'admin'].map((r) => (
                                                    <Menu.Item
                                                        key={r}
                                                        onPress={() => {
                                                            setRole(r);
                                                            setShowRoleMenu(false);
                                                        }}
                                                        title={r.charAt(0).toUpperCase() + r.slice(1)}
                                                        titleStyle={{ color: activeTheme.colors.onSurface }}
                                                    />
                                                ))}
                                            </Menu>
                                        </Animated.View>

                                        {/* Class Selection - Only for Students */}
                                        {role === 'student' && (
                                            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.inputGroup}>
                                                <Text style={[styles.inputLabel, { color: activeTheme.colors.textSecondary }]}>Class</Text>
                                                <Menu
                                                    visible={showClassMenu}
                                                    onDismiss={() => setShowClassMenu(false)}
                                                    anchor={
                                                        <TouchableOpacity
                                                            onPress={() => setShowClassMenu(true)}
                                                            style={[styles.inputWrapper, { backgroundColor: activeTheme.colors.surfaceVariant + '40', borderColor: activeTheme.colors.outline + '20' }]}
                                                        >
                                                            <MaterialCommunityIcons name="school-outline" size={20} color={activeTheme.colors.primary} style={styles.inputIcon} />
                                                            <Text style={[styles.inputText, { color: selectedClass ? activeTheme.colors.onSurface : activeTheme.colors.textSecondary }]}>
                                                                {selectedClass ? `Class ${selectedClass}` : 'Select Class'}
                                                            </Text>
                                                            <MaterialCommunityIcons name="chevron-down" size={20} color={activeTheme.colors.outline} style={{ marginRight: spacing.md }} />
                                                        </TouchableOpacity>
                                                    }
                                                    contentStyle={{ backgroundColor: activeTheme.colors.surface, maxHeight: 300, borderRadius: borderRadius.lg }}
                                                >
                                                    {[6, 7, 8, 9, 10].map((c) => (
                                                        <Menu.Item
                                                            key={c}
                                                            onPress={() => {
                                                                setSelectedClass(c);
                                                                setShowClassMenu(false);
                                                            }}
                                                            title={`Class ${c}`}
                                                            titleStyle={{ color: activeTheme.colors.onSurface }}
                                                        />
                                                    ))}
                                                </Menu>
                                            </Animated.View>
                                        )}
                                    </>
                                )}

                                <Animated.View entering={FadeInDown.delay(authMode === 'register' ? 400 : 100).duration(400)} style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: activeTheme.colors.textSecondary }]}>Email</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: activeTheme.colors.surfaceVariant + '40', borderColor: activeTheme.colors.outline + '20' }]}>
                                        <MaterialCommunityIcons name="email-outline" size={20} color={activeTheme.colors.primary} style={styles.inputIcon} />
                                        <TextInput
                                            mode="flat"
                                            value={email}
                                            onChangeText={setEmail}
                                            placeholder="your@email.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            style={styles.input}
                                            underlineColor="transparent"
                                            activeUnderlineColor="transparent"
                                            textColor={activeTheme.colors.onSurface}
                                            placeholderTextColor={activeTheme.colors.textTertiary}
                                        />
                                    </View>
                                </Animated.View>

                                <Animated.View entering={FadeInDown.delay(authMode === 'register' ? 500 : 200).duration(400)} style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: activeTheme.colors.textSecondary }]}>Password</Text>
                                    <View style={[styles.inputWrapper, { backgroundColor: activeTheme.colors.surfaceVariant + '40', borderColor: activeTheme.colors.outline + '20' }]}>
                                        <MaterialCommunityIcons name="lock-outline" size={20} color={activeTheme.colors.primary} style={styles.inputIcon} />
                                        <TextInput
                                            mode="flat"
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="Enter password"
                                            secureTextEntry={!showPassword}
                                            style={styles.input}
                                            underlineColor="transparent"
                                            activeUnderlineColor="transparent"
                                            textColor={activeTheme.colors.onSurface}
                                            placeholderTextColor={activeTheme.colors.textTertiary}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeIcon}
                                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                        >
                                            <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color={activeTheme.colors.outline} />
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>

                                {error ? (
                                    <Animated.Text entering={ZoomIn} style={styles.errorText}>
                                        {error}
                                    </Animated.Text>
                                ) : null}

                                <TouchableOpacity
                                    onPress={handleAuth}
                                    disabled={loading}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={gradients.primary}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.primaryBtn}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.primaryBtnText}>
                                                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {authMode === 'login' && (
                                    <TouchableOpacity
                                        onPress={loginAsGuest}
                                        style={styles.secondaryBtn}
                                    >
                                        <Text style={styles.secondaryBtnText}>Continue as Guest</Text>
                                    </TouchableOpacity>
                                )}

                                <View style={[styles.signupLinkContainer, { borderTopColor: activeTheme.colors.outline + '20' }]}>
                                    <Text style={[styles.signupText, { color: activeTheme.colors.textSecondary }]}>
                                        {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                                    </Text>
                                    <TouchableOpacity onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                                        <Text style={[styles.signupLink, { color: activeTheme.colors.primary }]}>
                                            {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Surface>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Interactive Bubbles in Modal - Rendered last to be on top */}
                <BackgroundBubbles />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Animated Bubbles Background */}
            {/* Moved to bottom for z-index */}

            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => openAuthModal('login')}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.scrollView}
            >
                {SLIDES.map((slide, index) => (
                    <View key={slide.id} style={styles.slide}>
                        <Animated.View
                            entering={ZoomIn.delay(200).duration(600)}
                            style={styles.heroIconContainer}
                        >
                            <Surface style={[styles.heroIconCard, { backgroundColor: activeTheme.colors.surface }]} elevation={4}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.heroIconGradient}
                                >
                                    <MaterialCommunityIcons name={slide.icon as any} size={64} color="#fff" />
                                </LinearGradient>
                            </Surface>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.textContainer}>
                            <Text style={[styles.heading, { color: activeTheme.colors.onBackground }]}>{slide.title}</Text>
                            <Text style={[styles.subtitle, { color: activeTheme.colors.textSecondary }]}>{slide.description}</Text>
                        </Animated.View>
                    </View>
                ))}
            </ScrollView>

            {/* Animated Bubbles Background - Rendered after ScrollView to be interactive */}
            <BackgroundBubbles />

            <View style={[styles.footer, { backgroundColor: activeTheme.colors.background }]}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: activeTheme.colors.outline + '40' },
                                currentSlide === index && { width: 32, backgroundColor: activeTheme.colors.primary }
                            ]}
                            layout={Layout.springify()}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    onPress={goToNextSlide}
                    activeOpacity={0.9}
                    style={{ width: '100%', maxWidth: 320 }}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryBtn}
                    >
                        <Text style={styles.primaryBtnText}>
                            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    // Shared Styles
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerBackground: {
        paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
        zIndex: 1,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerContent: {
        zIndex: 2,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: typography.headlineMedium.fontSize,
        fontWeight: '800',
        color: '#fff',
        marginBottom: spacing.xs,
    },
    headerSubtitle: {
        fontSize: typography.bodyLarge.fontSize,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },

    // Onboarding Styles
    bubblesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 0,
    },
    skipButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight! + 20,
        right: spacing.xxl,
        zIndex: 10,
        padding: spacing.sm,
    },
    skipText: {
        color: theme.colors.primary,
        fontSize: typography.bodyMedium.fontSize,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
        zIndex: 1,
    },
    slide: {
        width,
        height: height * 0.75,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
    },
    heroIconContainer: {
        marginBottom: spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroIconCard: {
        borderRadius: 40,
        padding: spacing.sm,
        backgroundColor: '#fff',
    },
    heroIconGradient: {
        width: 120,
        height: 120,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    heading: {
        fontSize: typography.headlineMedium.fontSize,
        fontWeight: '800',
        color: theme.colors.onBackground,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.bodyLarge.fontSize,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.xxl,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        zIndex: 2,
    },
    pagination: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xxl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: borderRadius.full,
        backgroundColor: theme.colors.outline + '40',
    },
    dotActive: {
        width: 32,
        backgroundColor: theme.colors.primary,
    },
    primaryBtn: {
        width: '100%',
        height: 56,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        ...shadows.lg,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: typography.titleMedium.fontSize,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Login Styles
    loginContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loginScrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    formContainer: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        marginTop: -spacing.xxl, // Slightly more overlap
        zIndex: 10,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: spacing.lg,
        paddingVertical: spacing.xl,
        marginHorizontal: spacing.sm, // Ensure margin on very small screens
        ...shadows.lg,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: typography.labelMedium.fontSize,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.outline + '20',
        borderRadius: borderRadius.lg,
        backgroundColor: theme.colors.surfaceVariant + '40',
        height: 56,
    },
    inputIcon: {
        marginLeft: spacing.lg,
        marginRight: spacing.xs,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 56,
        fontSize: 16,
        paddingHorizontal: 0,
        textAlignVertical: 'center',
    },
    inputText: {
        flex: 1,
        fontSize: 16,
    },
    eyeIcon: {
        padding: spacing.md,
    },
    secondaryBtn: {
        marginTop: spacing.lg,
        alignItems: 'center',
        padding: spacing.md,
    },
    secondaryBtnText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    signupLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline + '20',
    },
    signupText: {
        color: theme.colors.textSecondary,
    },
    signupLink: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    errorText: {
        color: theme.colors.error,
        marginBottom: spacing.lg,
        textAlign: 'center',
        fontWeight: '500',
        backgroundColor: theme.colors.errorContainer,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
});

export default WelcomeScreen;
