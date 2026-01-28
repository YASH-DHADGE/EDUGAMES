import React from 'react';
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    useSharedValue,
    ZoomIn,
    FadeInDown,
    runOnJS
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const TabIcon = ({ name, isFocused, color, size }: { name: any, isFocused: boolean, color: string, size: number }) => {
    const scale = useSharedValue(1);

    React.useEffect(() => {
        if (isFocused) {
            // Bouncy "pop" effect when selected
            scale.value = withSequence(
                withTiming(0.8, { duration: 100 }),
                withSpring(1.2, { damping: 8, stiffness: 150 })
            );
        } else {
            scale.value = withTiming(1, { duration: 200 });
        }
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View style={[animatedStyle, styles.iconContainer]}>
            {isFocused && (
                <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={StyleSheet.absoluteFill}
                >
                    <LinearGradient
                        colors={['rgba(37, 99, 235, 0.15)', 'rgba(37, 99, 235, 0.02)']}
                        style={styles.activeIconBg}
                    />
                </Animated.View>
            )}
            <MaterialCommunityIcons name={name} size={size} color={color} />
        </Animated.View>
    );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const isWeb = Platform.OS === 'web';

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Animated.View
                entering={FadeInDown.delay(500).duration(500)}
                style={[
                    styles.floatingBar,
                    isWeb && styles.webBar,
                    Platform.OS === 'android' && { backgroundColor: 'transparent', elevation: 0 }
                ]}
            >
                <BlurView intensity={isWeb ? 20 : 50} tint={isDark ? 'dark' : 'default'} style={styles.blurContent}>
                    <View style={styles.tabRow}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    if (route.name === 'Learn') {
                                        // Force navigation to the dashboard to reset stack
                                        navigation.navigate('Learn', { screen: 'LearnDashboard' });
                                    } else {
                                        navigation.navigate(route.name);
                                    }
                                } else if (isFocused && !event.defaultPrevented) {
                                    // Handle tap on already focused tab (optional: scroll to top or reset)
                                    if (route.name === 'Learn') {
                                        navigation.navigate('Learn', { screen: 'LearnDashboard' });
                                    }
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            // Map route names to icons
                            let iconName = 'circle';
                            if (route.name === 'HomeTab') iconName = isFocused ? 'home' : 'home-outline';
                            else if (route.name === 'Learn') iconName = isFocused ? 'school' : 'school-outline';
                            else if (route.name === 'Tasks') iconName = isFocused ? 'checkbox-marked-circle' : 'checkbox-marked-circle-outline';
                            else if (route.name === 'Games') iconName = isFocused ? 'gamepad-variant' : 'gamepad-variant-outline';
                            else if (route.name === 'Settings') iconName = isFocused ? 'cog' : 'cog-outline';

                            const activeColor = '#2563EB';
                            const inactiveColor = '#757575';

                            return (
                                <TouchableOpacity
                                    key={index}
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={styles.tabButton}
                                    activeOpacity={0.7}
                                >
                                    <TabIcon
                                        name={iconName}
                                        isFocused={isFocused}
                                        color={isFocused ? activeColor : inactiveColor}
                                        size={26}
                                    />
                                    {isFocused && (
                                        <Animated.View
                                            entering={ZoomIn}
                                            style={[styles.activeIndicator, { backgroundColor: activeColor }]}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </BlurView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        pointerEvents: 'box-none',
    },
    floatingBar: {
        width: Platform.OS === 'web' ? 400 : '90%', // Mobile: 90% width (smaller than before)
        maxWidth: 380,
        height: Platform.OS === 'web' ? 64 : 56, // Mobile: Compact height (56px)
        marginBottom: Platform.OS === 'android' ? 40 : 24, // Mobile: Lifted up (40px) to avoid system nav overlap
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    webBar: {
        marginBottom: 24,
        width: '100%',
        maxWidth: 400,
    },
    blurContent: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Ultra subtle shine
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)', // Crisp glass edge
        borderRadius: 32,
    },
    tabRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        width: 44, // Slightly smaller touch target visual
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    activeIconBg: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 4, // Adjusted for smaller height
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});

export default CustomTabBar;
