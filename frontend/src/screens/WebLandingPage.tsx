import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import WaveBackground from '../components/WaveBackground';

const FEATURES = [
    {
        id: 1,
        icon: 'lightning-bolt',
        title: 'Interactive Learning',
        description: 'Engage with interactive lessons, quizzes, and science simulations that make learning fun.',
        color: '#a78bfa',
    },
    {
        id: 2,
        icon: 'trophy-variant',
        title: 'Track Progress',
        description: 'Monitor your learning journey with XP, levels, and achievement badges.',
        color: '#c084fc',
    },
    {
        id: 3,
        icon: 'flask',
        title: 'Science Labs',
        description: 'Explore biology, chemistry, and physics through hands-on virtual experiments.',
        color: '#818cf8',
    },
];

const STATS = [
    { value: '10+', label: 'Science Games', sublabel: 'Learn by playing' },
    { value: '50+', label: 'Lessons', sublabel: 'Expert-crafted content' },
    { value: '100%', label: 'Free', sublabel: 'No hidden fees' },
];

const WebLandingPage = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Dark Gradient Background */}
            <LinearGradient
                colors={['#1e1b4b', '#312e81', '#4c1d95']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.background}
            />

            {/* Wave Animation */}
            <WaveBackground colors={['rgba(139, 92, 246, 0.2)', 'rgba(167, 139, 250, 0.15)', 'rgba(196, 181, 253, 0.1)']} />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Section */}
                <View style={[styles.hero, { paddingHorizontal: isMobile ? 20 : 60 }]}>
                    {/* Logo */}
                    <Animated.View entering={FadeInDown.delay(200).duration(1000)} style={styles.logoSection}>
                        <View style={styles.logoCircle}>
                            <MaterialCommunityIcons name="flask" size={64} color="#a78bfa" />
                        </View>
                        <Text style={styles.logoText}>CoreTechLabs</Text>
                    </Animated.View>

                    {/* Hero Content */}
                    <Animated.View entering={FadeInUp.delay(400).duration(1000)} style={styles.heroContent}>
                        <Text style={[styles.heroTitle, { fontSize: isMobile ? 36 : 56 }]}>
                            Discover Intelligence with{'\n'}
                            <Text style={styles.heroTitleAccent}>Science Learning</Text>
                        </Text>
                        <Text style={[styles.heroSubtitle, { fontSize: isMobile ? 16 : 20 }]}>
                            CoreTechLabs unlocks smart insights with advanced science learning solutions.
                            Explore interactive lessons, games, and simulations.
                        </Text>

                        {/* CTA Buttons */}
                        <View style={[styles.ctaContainer, { flexDirection: isMobile ? 'column' : 'row' }]}>
                            <TouchableOpacity
                                style={[styles.primaryBtn, isMobile && { width: '100%' }]}
                                onPress={() => navigation.navigate('Register')}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#7c3aed', '#a78bfa']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.primaryBtnGradient}
                                >
                                    <Text style={styles.primaryBtnText}>Get Started</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.secondaryBtn, isMobile && { width: '100%' }]}
                                onPress={() => navigation.navigate('Login')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.secondaryBtnText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                {/* Features Section */}
                <View style={[styles.featuresSection, { paddingHorizontal: isMobile ? 20 : 60 }]}>
                    <Animated.View entering={FadeInUp.delay(600).duration(800)}>
                        <Text style={[styles.sectionTitle, { fontSize: isMobile ? 28 : 40 }]}>
                            Why Choose CoreTechLabs?
                        </Text>
                        <Text style={[styles.sectionSubtitle, { fontSize: isMobile ? 14 : 18 }]}>
                            Everything you need to excel in science education
                        </Text>
                    </Animated.View>

                    <View style={[styles.featuresGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        {FEATURES.map((feature, index) => (
                            <Animated.View
                                key={feature.id}
                                entering={ZoomIn.delay(800 + index * 150).duration(600)}
                                style={[styles.featureCard, { width: isMobile ? '100%' : '31%' }]}
                            >
                                <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20', borderColor: feature.color + '40' }]}>
                                    <MaterialCommunityIcons
                                        name={feature.icon as any}
                                        size={40}
                                        color={feature.color}
                                    />
                                </View>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                {/* Stats Section */}
                <View style={[styles.statsSection, { paddingHorizontal: isMobile ? 20 : 60 }]}>
                    <View style={[styles.statsGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        {STATS.map((stat, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInUp.delay(1000 + index * 150).duration(600)}
                                style={styles.statCard}
                            >
                                <Text style={[styles.statValue, { fontSize: isMobile ? 40 : 56 }]}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                                <Text style={styles.statSublabel}>{stat.sublabel}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                {/* Final CTA Section */}
                <View style={[styles.finalCtaSection, { paddingHorizontal: isMobile ? 20 : 60 }]}>
                    <Animated.View entering={FadeInUp.delay(1300).duration(800)} style={styles.finalCtaContent}>
                        <Text style={[styles.finalCtaTitle, { fontSize: isMobile ? 28 : 40 }]}>
                            Ready to Start Learning?
                        </Text>
                        <Text style={[styles.finalCtaSubtitle, { fontSize: isMobile ? 14 : 18 }]}>
                            Join students mastering science through interactive learning
                        </Text>
                        <TouchableOpacity
                            style={[styles.finalCtaBtn, isMobile && { width: '100%' }]}
                            onPress={() => navigation.navigate('Register')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#7c3aed', '#a78bfa']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.finalCtaBtnGradient}
                            >
                                <Text style={styles.finalCtaBtnText}>Create Free Account</Text>
                                <MaterialCommunityIcons name="rocket-launch" size={24} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <MaterialCommunityIcons name="flask" size={32} color="#a78bfa" style={{ marginBottom: 12 }} />
                    <Text style={styles.footerBrand}>CoreTechLabs</Text>
                    <Text style={styles.footerTagline}>Science Learning Platform</Text>
                    <Text style={styles.footerCopyright}>© 2024 CoreTechLabs. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1b4b',
    },
    background: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    scrollView: {
        flex: 1,
        zIndex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    hero: {
        paddingTop: 80,
        paddingBottom: 80,
        alignItems: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(167, 139, 250, 0.15)',
        borderWidth: 2,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    heroContent: {
        alignItems: 'center',
        maxWidth: 800,
    },
    heroTitle: {
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 64,
    },
    heroTitleAccent: {
        color: '#a78bfa',
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 40,
        maxWidth: 600,
    },
    ctaContainer: {
        gap: 16,
        alignItems: 'center',
    },
    primaryBtn: {
        borderRadius: 12,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(167, 139, 250, 0.5)',
    },
    secondaryBtnText: {
        color: '#e5e7eb',
        fontSize: 16,
        fontWeight: '600',
    },
    featuresSection: {
        paddingVertical: 80,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    sectionSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 48,
    },
    featuresGrid: {
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureCard: {
        backgroundColor: 'rgba(30, 27, 75, 0.6)',
        borderRadius: 20,
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.2)',
        alignItems: 'center',
    },
    featureIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
    },
    statsSection: {
        paddingVertical: 60,
    },
    statsGrid: {
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        borderRadius: 20,
        padding: 40,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.2)',
        gap: 40,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontWeight: 'bold',
        color: '#a78bfa',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    statSublabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    finalCtaSection: {
        paddingVertical: 80,
    },
    finalCtaContent: {
        alignItems: 'center',
    },
    finalCtaTitle: {
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    finalCtaSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 32,
    },
    finalCtaBtn: {
        borderRadius: 12,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    finalCtaBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 12,
        gap: 12,
    },
    finalCtaBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        paddingVertical: 40,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(167, 139, 250, 0.2)',
    },
    footerBrand: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    footerTagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 12,
    },
    footerCopyright: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default WebLandingPage;
