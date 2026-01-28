import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { colors } from '../../theme';

const { width, height } = Dimensions.get('window');

interface BackgroundPatternProps {
    color?: string; // Base background color
    patternColor?: string; // Color of the dots
    opacity?: number;
}

const BackgroundPattern: React.FC<BackgroundPatternProps> = ({
    color = colors.background, // Match theme background (Sky 100)
    patternColor = colors.primary,
    opacity = 0.1
}) => {
    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 0, backgroundColor: color }]}>
            <Svg height="100%" width="100%">
                <Defs>
                    <Pattern
                        id="dotPattern"
                        x="0"
                        y="0"
                        width="16"
                        height="16"
                        patternUnits="userSpaceOnUse"
                    >
                        <Circle cx="2" cy="2" r="2" fill={patternColor} />
                    </Pattern>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" opacity={opacity} />
            </Svg>
        </View>
    );
};

export default BackgroundPattern;
