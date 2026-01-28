import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, StatusBar } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useWindowDimensions } from 'react-native';
import { spacing } from '../../theme';
// const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Removed in favor of hook

const AdminHomeScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            console.log('Fetching Admin Analytics...');
            const response = await api.get('/admin/analytics');
            console.log('Admin Analytics Response:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch admin analytics:', error);
            // Default stats for UI check
            // setStats({ institutes: 0, teachers: 0, students: 0 }); 
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    // Bento Grid Items Configuration
    const BENTO_ITEMS = [
        {
            id: 'institutes', label: 'Institutes', subtitle: 'Manage Organizations',
            icon: 'office-building', size: 'large',
            gradient: ['#4F46E5', '#4338CA'],
            screen: 'AdminInstituteManager',
            colSpan: 6,
        },
        {
            id: 'users', label: 'Users', subtitle: 'Manage Access',
            icon: 'account-group', size: 'large',
            gradient: ['#0891B2', '#06B6D4'],
            screen: 'AdminUserManagement',
            colSpan: 6,
        },
        {
            id: 'reports', label: 'Reports',
            icon: 'file-chart',
            gradient: ['#F59E0B', '#D97706'],
            screen: 'GlobalAnalytics',
            colSpan: 3,
        },
        {
            id: 'settings', label: 'Settings',
            icon: 'cog',
            gradient: ['#64748B', '#475569'],
            screen: 'AdminSettings', // Placeholder, handled in onPress if needed
            colSpan: 3,
        },
        {
            id: 'logs', label: 'Logs',
            icon: 'history',
            gradient: ['#3B82F6', '#2563EB'],
            screen: 'AdminLogs', // Placeholder
            colSpan: 3,
        },
        {
            id: 'support', label: 'Support',
            icon: 'lifebuoy',
            gradient: ['#EC4899', '#DB2777'],
            screen: 'AdminSupport', // Placeholder
            colSpan: 3,
        },
    ];

    const renderStars = () => {
        const stars = [];
        const starStyles = getStyles(isDark);
        for (let i = 0; i < 50; i++) {
            stars.push(
                <View
                    key={i}
                    style={[
                        starStyles.star,
                        {
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: Math.random() * 3 + 1,
                            height: Math.random() * 3 + 1,
                            opacity: Math.random() * 0.8 + 0.2,
                        },
                    ]}
                />
            );
        }
        return stars;
    };

    return (
        <View style={getStyles(isDark).container}>
            <LinearGradient
                colors={isDark ? ['#0A1628', '#0F172A', '#1E293B'] : ['#F0F9FF', '#E0F2FE', '#BAE6FD']}
                style={[StyleSheet.absoluteFill]} // Removed zIndex: -1
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
            />

            {isDark && (
                <View style={[getStyles(isDark).starsContainer]} pointerEvents="none">
                    {renderStars()}
                </View>
            )}

            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <ScrollView
                style={{ zIndex: 10, elevation: 10 }} // Added explicit z-index
                showsVerticalScrollIndicator={false}
                contentContainerStyle={getStyles(isDark).scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#4F46E5'} />}
            >
                {/* 🌟 PREMIUM HEADER */}
                <LinearGradient
                    colors={isDark ? ['#0A1628', '#1E293B'] : ['#4F46E5', '#6366F1', '#818CF8']}
                    style={getStyles(isDark).headerBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[getStyles(isDark).headerContent, { paddingTop: insets.top + spacing.lg }]}>
                        <View style={getStyles(isDark).profileSection}>
                            <View style={getStyles(isDark).avatarPlaceholder}>
                                <Text style={getStyles(isDark).avatarText}>A</Text>
                            </View>
                            <Animated.View entering={FadeInRight.delay(200)}>
                                <Text style={getStyles(isDark).greeting}>Admin Portal</Text>
                                <Text style={getStyles(isDark).userName}>{user?.name?.split(' ')[0] || 'Administrator'}</Text>
                            </Animated.View>
                        </View>

                        <View style={getStyles(isDark).headerActions}>
                            <TouchableOpacity
                                style={getStyles(isDark).iconBtn}
                                onPress={toggleTheme}
                            >
                                <MaterialCommunityIcons
                                    name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
                                    size={20}
                                    color={isDark ? '#FCD34D' : '#fff'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={logout} style={[getStyles(isDark).iconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Cards Row */}
                    <View style={getStyles(isDark).statsRow}>
                        <Animated.View entering={FadeInDown.delay(100)} style={getStyles(isDark).statCard}>
                            <View style={[getStyles(isDark).statIcon, { backgroundColor: 'rgba(79, 70, 229, 0.2)' }]}>
                                <MaterialCommunityIcons name="office-building" size={20} color="#6366F1" />
                            </View>
                            <Text style={getStyles(isDark).statValue}>{stats?.institutes || 0}</Text>
                            <Text style={getStyles(isDark).statLabel}>Institutes</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200)} style={getStyles(isDark).statCard}>
                            <View style={[getStyles(isDark).statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <MaterialCommunityIcons name="human-male-board" size={20} color="#10B981" />
                            </View>
                            <Text style={getStyles(isDark).statValue}>{stats?.teachers || 0}</Text>
                            <Text style={getStyles(isDark).statLabel}>Teachers</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300)} style={getStyles(isDark).statCard}>
                            <View style={[getStyles(isDark).statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                <MaterialCommunityIcons name="school" size={20} color="#F59E0B" />
                            </View>
                            <Text style={getStyles(isDark).statValue}>{stats?.students || 0}</Text>
                            <Text style={getStyles(isDark).statLabel}>Students</Text>
                        </Animated.View>
                    </View>
                </LinearGradient>

                {/* 📦 BENTO GRID */}
                <View style={getStyles(isDark).mainContainer}>
                    <View style={getStyles(isDark).bentoGrid}>
                        {BENTO_ITEMS.map((item, index) => {
                            // Responsive Logic
                            const isMobile = SCREEN_WIDTH < 768; // Tablet breakpoint
                            let itemWidth: any = '23%'; // Default desktop small

                            if (isMobile) {
                                // Mobile: Max 2 columns
                                if (item.colSpan >= 6) itemWidth = '48%'; // Keep side-by-side on mobile for main items too
                                else itemWidth = '48%';

                                // Override: if specifically 12, then 100% (none currently 12)
                            } else {
                                // Desktop Logic
                                if (item.colSpan === 6) itemWidth = '48%';
                                else itemWidth = '23%'; // Force 4 items per row (Reports, Settings, Logs, Support)
                            }

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[getStyles(isDark).bentoItem, { flexBasis: itemWidth }]}
                                    onPress={() => (navigation as any).navigate(item.screen)}
                                >
                                    <Surface style={getStyles(isDark).bentoSurface} elevation={2}>
                                        <LinearGradient
                                            colors={item.gradient as any}
                                            style={getStyles(isDark).bentoGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <MaterialCommunityIcons name={item.icon as any} size={isMobile ? 28 : (item.colSpan > 3 ? 32 : 24)} color="#fff" />
                                            <View>
                                                <Text style={[getStyles(isDark).bentoTitle, { fontSize: isMobile ? 14 : (item.colSpan > 3 ? 16 : 12) }]}>{item.label}</Text>
                                                {item.colSpan > 3 && <Text style={getStyles(isDark).bentoSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
                                            </View>
                                        </LinearGradient>
                                    </Surface>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    starsContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        // zIndex removed
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
    // Header
    headerBackground: {
        paddingBottom: 60,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    greeting: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    userName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#1E293B',
    },
    statLabel: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    // Main
    mainContainer: {
        marginTop: -30,
        paddingHorizontal: 20,
    },
    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    bentoItem: {
        height: 110,
        borderRadius: 20,
    },
    bentoSurface: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    bentoGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    bentoTitle: {
        color: '#fff',
        fontWeight: '700',
        marginTop: 'auto',
    },
    bentoSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
    }
});

export default AdminHomeScreen;
