import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface WaveBackgroundProps {
    colors?: string[];
}

const WaveBackground: React.FC<WaveBackgroundProps> = ({
    colors = ['rgba(139, 92, 246, 0.3)', 'rgba(167, 139, 250, 0.2)', 'rgba(196, 181, 253, 0.1)']
}) => {
    const wave1 = useSharedValue(0);
    const wave2 = useSharedValue(0);
    const wave3 = useSharedValue(0);

    useEffect(() => {
        wave1.value = withRepeat(
            withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        wave2.value = withRepeat(
            withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        wave3.value = withRepeat(
            withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedWave1 = useAnimatedStyle(() => {
        'worklet';
        const translateY = wave1.value * 20 - 10;
        return {
            transform: [{ translateY }],
        };
    });

    const animatedWave2 = useAnimatedStyle(() => {
        'worklet';
        const translateY = wave2.value * 30 - 15;
        return {
            transform: [{ translateY }],
        };
    });

    const animatedWave3 = useAnimatedStyle(() => {
        'worklet';
        const translateY = wave3.value * 25 - 12;
        return {
            transform: [{ translateY }],
        };
    });

    const createWavePath = (amplitude: number, frequency: number, offset: number) => {
        const path = `M0,${height * 0.3 + offset} ` +
            `Q${width * 0.25},${height * 0.3 + offset - amplitude} ${width * 0.5},${height * 0.3 + offset} ` +
            `T${width},${height * 0.3 + offset} ` +
            `L${width},${height} L0,${height} Z`;
        return path;
    };

    return (
        <View style={styles.container}>
            <Svg height={height} width={width} style={styles.svg}>
                <Animated.View style={animatedWave1}>
                    <Path
                        d={createWavePath(50, 2, 100)}
                        fill={colors[0]}
                    />
                </Animated.View>
                <Animated.View style={animatedWave2}>
                    <Path
                        d={createWavePath(40, 2.5, 150)}
                        fill={colors[1]}
                    />
                </Animated.View>
                <Animated.View style={animatedWave3}>
                    <Path
                        d={createWavePath(45, 2.2, 200)}
                        fill={colors[2]}
                    />
                </Animated.View>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height,
        zIndex: 0,
    },
    svg: {
        position: 'absolute',
        bottom: 0,
    },
});

export default WaveBackground;
