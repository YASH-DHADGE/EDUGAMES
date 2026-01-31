import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import { borderRadius, spacing, shadows } from '../../theme';

interface DropdownItem {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    label?: string;
    data: DropdownItem[];
    value: string;
    onSelect: (value: string) => void;
    placeholder?: string;
    icon?: string;
    disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    label,
    data,
    value,
    onSelect,
    placeholder = 'Select an option',
    icon,
    disabled = false,
}) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const height = useSharedValue(0);
    const rotate = useSharedValue(0);

    const toggleDropdown = () => {
        if (disabled) return;

        if (isOpen) {
            height.value = withTiming(0, { duration: 250 });
            rotate.value = withTiming(0, { duration: 250 });
            setTimeout(() => setIsOpen(false), 250); // Wait for animation
        } else {
            setIsOpen(true);
            height.value = withTiming(200, { duration: 300 }); // Smooth open without bounce
            rotate.value = withTiming(180, { duration: 300 });
        }
    };

    const handleSelect = (item: DropdownItem) => {
        onSelect(item.value);
        toggleDropdown();
    };

    const listStyle = useAnimatedStyle(() => {
        return {
            height: height.value,
            opacity: interpolate(height.value, [0, 20], [0, 1], Extrapolate.CLAMP),
        };
    });

    const arrowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotate.value}deg` }],
        };
    });

    const selectedItem = data.find(item => item.value === value);

    const backgroundColor = theme.dark
        ? 'rgba(255, 255, 255, 0.05)'
        : theme.colors.surfaceVariant;

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                    {label}
                </Text>
            )}

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={toggleDropdown}
                style={[
                    styles.trigger,
                    {
                        backgroundColor,
                        borderColor: isOpen ? theme.colors.primary : 'transparent',
                        borderWidth: isOpen ? 2 : 1
                    }
                ]}
            >
                <View style={styles.triggerContent}>
                    {icon && (
                        <MaterialCommunityIcons
                            name={icon as any}
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                            style={{ marginRight: 12 }}
                        />
                    )}
                    <Text
                        style={[
                            styles.valueText,
                            {
                                color: selectedItem
                                    ? theme.colors.onSurface
                                    : theme.colors.onSurfaceVariant
                            }
                        ]}
                    >
                        {selectedItem ? selectedItem.label : placeholder}
                    </Text>
                </View>

                <Animated.View style={arrowStyle}>
                    <MaterialCommunityIcons
                        name="chevron-down"
                        size={24}
                        color={theme.colors.onSurfaceVariant}
                    />
                </Animated.View>
            </TouchableOpacity>

            {isOpen && (
                <Animated.View
                    style={[
                        styles.dropdownList,
                        listStyle,
                        {
                            backgroundColor: theme.dark ? '#1E293B' : '#FFFFFF',
                            borderColor: theme.dark ? '#334155' : '#E2E8F0',
                        }
                    ]}
                >
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                        {data.map((item, index) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.item,
                                    item.value === value && { backgroundColor: theme.colors.primaryContainer },
                                    index !== data.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.dark ? '#334155' : '#F1F5F9' }
                                ]}
                                onPress={() => handleSelect(item)}
                            >
                                <Text
                                    style={[
                                        styles.itemText,
                                        {
                                            color: item.value === value
                                                ? theme.colors.primary
                                                : theme.colors.onSurface
                                        }
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {item.value === value && (
                                    <MaterialCommunityIcons
                                        name="check"
                                        size={18}
                                        color={theme.colors.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
        // zIndex removed from here to let parent control stacking context if needed, 
        // OR kept if we want isolated stacking. 
        // Best practice: zIndex should be managed by parent for siblings.
        // But for the dropdown list to appear on top of OTHER elements, it needs zIndex.
        // Let's keep it but make it overridable.
        zIndex: 100,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: 18,
        borderRadius: borderRadius.lg, // Matching CustomInput
        minHeight: 62,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    valueText: {
        fontSize: 16,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%', // Open below
        left: 0,
        right: 0,
        marginTop: 8,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        overflow: 'hidden',
        zIndex: 1000,
        ...shadows.md,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    itemText: {
        fontSize: 15,
    },
});

export default CustomDropdown;
