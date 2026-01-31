import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, spacing } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

interface CustomInputProps extends TextInputProps {
    label: string;
    error?: string;
    helperText?: string;
    icon?: React.ReactNode;
    rightIcon?: string;
    onRightIconPress?: () => void;
}

const CustomInput: React.FC<CustomInputProps> = ({
    label,
    error,
    helperText,
    icon,
    rightIcon,
    onRightIconPress,
    value,
    onFocus,
    onBlur,
    ...props
}) => {
    const theme = useTheme();
    const { getResponsiveFontSize, getResponsivePadding } = useResponsive();
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? theme.colors.error
        : isFocused
            ? theme.colors.primary
            : 'transparent';

    const backgroundColor = theme.dark
        ? 'rgba(255, 255, 255, 0.05)'
        : theme.colors.surfaceVariant;

    // Responsive values
    const inputFontSize = getResponsiveFontSize(16);
    const minHeight = getResponsivePadding(62);

    return (
        <View style={styles.container}>
            {/* Label is now outside and static */}
            <Text
                style={[
                    styles.label,
                    {
                        color: error
                            ? theme.colors.error
                            : theme.colors.onSurfaceVariant,
                    },
                ]}
            >
                {label}
            </Text>

            <View style={[
                styles.inputContainer,
                {
                    borderColor,
                    borderWidth: isFocused ? 2 : 1,
                    backgroundColor: backgroundColor
                }
            ]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}

                <View style={styles.inputWrapper}>
                    <TextInput
                        value={value}
                        onFocus={(e) => {
                            setIsFocused(true);
                            onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            onBlur?.(e);
                        }}
                        style={[
                            styles.input,
                            {
                                color: theme.colors.onSurface,
                                paddingLeft: icon ? spacing.md : spacing.lg,
                                paddingRight: rightIcon ? spacing.xl : spacing.lg,
                                fontSize: inputFontSize,
                                minHeight: minHeight,
                            },
                        ]}
                        placeholder={isFocused ? props.placeholder : ''}
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        {...props}
                    />
                </View>

                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconContainer}>
                        <MaterialCommunityIcons
                            name={rightIcon as any}
                            size={24}
                            color={theme.colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {(error || helperText) && (
                <Text
                    style={[
                        styles.helperText,
                        { color: error ? theme.colors.error : theme.colors.onSurfaceVariant },
                    ]}
                >
                    {error || helperText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.lg, // More rounded modern look
        overflow: 'hidden',
    },
    iconContainer: {
        paddingLeft: spacing.lg,
    },
    rightIconContainer: {
        paddingRight: spacing.lg,
        paddingLeft: spacing.sm,
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        fontSize: 18.5,
        paddingHorizontal: spacing.lg,
        paddingVertical: 18,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: spacing.lg,
    },
});

export default CustomInput;
