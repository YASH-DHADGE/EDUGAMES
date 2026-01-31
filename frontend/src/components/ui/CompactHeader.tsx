import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../context/AuthContext';
import { spacing } from '../../theme';

interface CompactHeaderProps {
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    showProfile?: boolean;
    rightComponent?: React.ReactNode;
    style?: ViewStyle;
}

const CompactHeader: React.FC<CompactHeaderProps> = ({
    title,
    subtitle,
    onBack,
    showProfile = false,
    rightComponent,
    style
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();
    const { user } = useAuth();
    const colors = theme.colors;

    const gradients = isDark
        ? ['#0A1628', '#1E293B']
        : ['#4F46E5', '#6366F1', '#818CF8']; // Violet/Indigo theme

    return (
        <LinearGradient
            colors={gradients as any}
            style={[styles.headerContainer, { paddingTop: insets.top + spacing.md }, style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={[styles.contentWrapper, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>

                {/* Left Section */}
                <View style={styles.leftSection}>
                    {onBack && (
                        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {showProfile && user ? (
                        <View style={styles.profileContainer}>
                            <Avatar.Text
                                size={40}
                                label={user.name?.substring(0, 1).toUpperCase() || 'U'}
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                color="#fff"
                            />
                            <View>
                                <Text style={styles.greeting}>Welcome,</Text>
                                <Text style={styles.userName}>{user.name?.split(' ')[0]}</Text>
                            </View>
                        </View>
                    ) : (
                        <View>
                            {title && <Text style={styles.title}>{title}</Text>}
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    )}
                </View>

                {/* Right Section */}
                <View style={styles.rightSection}>
                    {rightComponent}
                </View>

            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        width: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 10,
    },
    contentWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    greeting: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
});

export default CompactHeader;
