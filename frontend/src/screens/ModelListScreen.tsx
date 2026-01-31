import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Pressable } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MODEL_REGISTRY } from '../data/modelRegistry';
import { spacing } from '../theme';
import ScreenBackground from '../components/ScreenBackground';
import Animated, { FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useResponsive } from '../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.95);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

const ModelListScreen = () => {
    const navigation = useNavigation();
    const { containerStyle, isDesktop, isTablet, isMobile } = useResponsive();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    const cols = isDesktop ? 3 : isTablet ? 2 : 1;

    function getGradientForIndex(index: number): [string, string] {
        const gradientList: [string, string][] = [
            ['#4F46E5', '#4338CA'], // Deep Indigo
            ['#0EA5E9', '#0284C7'], // Sky Blue
            ['#10B981', '#059669'], // Emerald
            ['#F59E0B', '#D97706'], // Amber
            ['#EC4899', '#BE185D'], // Pink
            ['#8B5CF6', '#7C3AED'], // Purple
        ];
        return gradientList[index % gradientList.length];
    }

    const models = Object.keys(MODEL_REGISTRY).map((key, index) => ({
        name: key,
        id: key,
        gradientColors: getGradientForIndex(index),
        icon: 'cube-outline'
    }));

    return (
        <ScreenBackground style={styles.container}>
            <View style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 🌟 PREMIUM HEADER (Matches Home Screen) */}
                    <LinearGradient
                        colors={isDark ? ['#0A1628', '#1E293B'] : ['#6366F1', '#8B5CF6', '#A855F7']}
                        style={[styles.headerBackground]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={[styles.headerContent, { paddingTop: insets.top + spacing.md }, containerStyle]}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle}>3D Models Library</Text>
                                <Text style={styles.headerSubtitle}>Explore interactive biology & anatomy models</Text>
                            </View>
                            <View style={{ width: 40 }} />
                        </View>
                    </LinearGradient>

                    {/* 🚀 MAIN CONTENT AREA (Overlapping Header) */}
                    <View style={[styles.mainContainer, containerStyle]}>
                        <View style={styles.grid}>
                            {models.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInDown.delay(index * 50).springify()}
                                    style={[
                                        styles.gridItemContainer,
                                        { width: cols === 1 ? '100%' : (cols === 2 ? '48%' : '31%') }
                                    ]}
                                >
                                    <ScaleButton
                                        style={styles.cardButton}
                                        onPress={() => (navigation as any).navigate('ThreeDModel', { model: item.id })}
                                    >
                                        <Surface style={styles.cardSurface} elevation={4}>
                                            <LinearGradient
                                                colors={item.gradientColors}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.cardGradient}
                                            >
                                                {/* Watermark Icon */}
                                                <MaterialCommunityIcons
                                                    name={item.icon as any}
                                                    size={100}
                                                    color="#FFF"
                                                    style={styles.watermarkIcon}
                                                />

                                                <View style={styles.cardContent}>
                                                    <MaterialCommunityIcons name={item.icon as any} size={32} color="#fff" style={styles.mainIcon} />
                                                    <View>
                                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                                                        <Text style={styles.cardSubtitle}>Tap to explore</Text>
                                                    </View>
                                                </View>

                                                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.8)" />
                                            </LinearGradient>
                                        </Surface>
                                    </ScaleButton>
                                </Animated.View>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    // Header Styles (Matched to Home)
    headerBackground: {
        paddingBottom: 80, // Space for overlap
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: -60, // Negative margin for overlap
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '800', // Matches Home Screen boldness
        fontSize: 22,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
        letterSpacing: 0.5,
    },

    // Main Content
    mainContainer: {
        paddingHorizontal: spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    gridItemContainer: {
        marginBottom: 8,
    },
    cardButton: {
        height: 120, // Matched height
        width: '100%',
    },
    cardSurface: {
        flex: 1,
        borderRadius: 24, // Matched border radius
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    cardGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        position: 'relative',
    },
    watermarkIcon: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        opacity: 0.1,
        transform: [{ rotate: '-15deg' }]
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    mainIcon: {
        opacity: 0.9,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
});

export default ModelListScreen;
