import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface LogoProps {
    width?: number;
    height?: number;
}

const CoreTechLogo: React.FC<LogoProps> = ({ width = 100, height = 100 }) => {
    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedInnerCircleProps = useAnimatedProps(() => {
        return {
            opacity: 0.5 + pulse.value * 0.5,
            fillOpacity: 0.2 + pulse.value * 0.3,
        };
    });

    return (
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#7c3aed" stopOpacity="1" />
                        <Stop offset="1" stopColor="#22d3ee" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="glow" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor="#a78bfa" stopOpacity="0.8" />
                        <Stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
                    </LinearGradient>
                </Defs>

                {/* Outer Hexagon/Shield Shape */}
                <Path
                    d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
                    fill="url(#grad)"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                />

                {/* Inner Tech Circuitry */}
                <Path
                    d="M50 20 L50 35 M50 65 L50 80 M20 40 L35 50 L20 60 M80 40 L65 50 L80 60"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Central Node/Core */}
                <Circle cx="50" cy="50" r="10" fill="white" fillOpacity="0.9" />

                {/* Animated Pulse Ring around Core */}
                <AnimatedPath
                    d="M50 35 A15 15 0 1 1 50 65 A15 15 0 1 1 50 35"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    animatedProps={animatedInnerCircleProps}
                />

                {/* Connecting Dots */}
                <Circle cx="50" cy="20" r="3" fill="#bef264" />
                <Circle cx="50" cy="80" r="3" fill="#bef264" />
                <Circle cx="20" cy="50" r="3" fill="#bef264" />
                <Circle cx="80" cy="50" r="3" fill="#bef264" />

            </Svg>
        </View>
    );
};

export default CoreTechLogo;
