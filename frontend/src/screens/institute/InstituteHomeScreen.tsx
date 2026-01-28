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

const InstituteHomeScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();
    const [stats, setStats] = useState({
        totalTeachers: 0,
        totalStudents: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await api.get('/institute/stats');
            setStats({
                totalTeachers: response.data.totalTeachers || 0,
                totalStudents: response.data.totalStudents || 0,
                pendingApprovals: response.data.pendingApprovals || 0
            });
        } catch (error) {
            console.error('Failed to fetch institute stats:', error);
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

    // Categorized Institute Data
    const INSTITUTE_SECTIONS = [
        {
            title: "MANAGEMENT",
            data: [
                { id: '1', label: 'Teachers', icon: 'account-tie', screen: 'InstituteTeacherManager', gradient: ['#4F46E5', '#6366F1'], subtitle: 'Staff Directory', colSpan: 6 },
                { id: '2', label: 'Students', icon: 'account-school', screen: 'InstituteAnalytics', gradient: ['#0EA5E9', '#38BDF8'], subtitle: 'Student Records', colSpan: 6 },
            ]
        },
        {
            title: "OVERVIEW",
            data: [
                { id: '3', label: 'Approvals', icon: 'check-decagram', screen: 'InstituteDashboard', gradient: ['#D97706', '#F59E0B'], subtitle: 'Pending Requests', badge: stats.pendingApprovals, colSpan: 7, mobileFull: true },
                { id: '4', label: 'Analytics', icon: 'chart-bar', screen: 'InstituteAnalytics', gradient: ['#DC2626', '#EF4444'], subtitle: 'Institute Performance', colSpan: 5, mobileFull: true },
            ]
        }
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
                                <Text style={getStyles(isDark).avatarText}>I</Text>
                            </View>
                            <Animated.View entering={FadeInRight.delay(200)}>
                                <Text style={getStyles(isDark).greeting}>Institute Portal</Text>
                                <Text style={getStyles(isDark).userName}>{user?.name?.split(' ')[0] || 'Institute'}</Text>
                            </Animated.View>
                        </View>

                        <View style={getStyles(isDark).headerActions}>
                            <TouchableOpacity
                                style={getStyles(isDark).iconBtn}
                                onPress={() => (navigation as any).navigate('Notifications')}
                            >
                                <Ionicons name="notifications-outline" size={20} color={"#fff"} />
                            </TouchableOpacity>
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
                                <MaterialCommunityIcons name="human-male-board" size={20} color="#6366F1" />
                            </View>
                            <Text style={getStyles(isDark).statValue}>{stats.totalTeachers}</Text>
                            <Text style={getStyles(isDark).statLabel}>Teachers</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200)} style={getStyles(isDark).statCard}>
                            <View style={[getStyles(isDark).statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <MaterialCommunityIcons name="school" size={20} color="#10B981" />
                            </View>
                            <Text style={getStyles(isDark).statValue}>{stats.totalStudents}</Text>
                            <Text style={getStyles(isDark).statLabel}>Students</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300)} style={getStyles(isDark).statCard}>
                            <View style={[getStyles(isDark).statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                <MaterialCommunityIcons name="account-clock" size={20} color="#F59E0B" />
                            </View>
                            <Text style={getStyles(isDark).statValue}>{stats.pendingApprovals}</Text>
                            <Text style={getStyles(isDark).statLabel}>Pending</Text>
                        </Animated.View>
                    </View>
                </LinearGradient>

                {/* 📦 BENTO GRID */}
                <View style={[getStyles(isDark).mainContainer, { paddingBottom: 100 }]}>
                    {INSTITUTE_SECTIONS.map((section, secIndex) => (
                        <View key={secIndex} style={{ marginBottom: 24 }}>
                            <Text style={getStyles(isDark).sectionHeader}>{section.title}</Text>
                            <View style={getStyles(isDark).bentoGrid}>
                                {section.data.map((item, index) => {
                                    // Responsive Logic
                                    const isMobile = SCREEN_WIDTH < 768;
                                    let itemWidth: any;

                                    if (isMobile) {
                                        if ((item as any).mobileFull) itemWidth = '100%';
                                        else itemWidth = '48%';
                                    } else {
                                        // Desktop Asymmetry
                                        if (item.colSpan === 12) itemWidth = '100%';
                                        else if (item.colSpan === 7) itemWidth = '57%';
                                        else if (item.colSpan === 5) itemWidth = '41%';
                                        else itemWidth = '31%';
                                    }

                                    return (
                                        <Animated.View
                                            key={item.id}
                                            entering={FadeInDown.delay(index * 100 + secIndex * 100).springify()}
                                            style={{
                                                width: itemWidth,
                                                height: item.colSpan === 12 ? 110 : 120,
                                                borderRadius: 20,
                                            }}
                                        >
                                            <TouchableOpacity
                                                style={{ flex: 1 }}
                                                onPress={() => (navigation as any).navigate(item.screen)}
                                                activeOpacity={0.9}
                                            >
                                                <Surface style={getStyles(isDark).bentoSurface} elevation={2}>
                                                    <LinearGradient
                                                        colors={item.gradient as any}
                                                        style={getStyles(isDark).bentoGradient}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                    >
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <MaterialCommunityIcons name={item.icon as any} size={28} color="#fff" />
                                                            {(item as any).badge > 0 && (
                                                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{(item as any).badge} NEW</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <View>
                                                            <Text style={[getStyles(isDark).bentoTitle, { fontSize: 16 }]}>{item.label}</Text>
                                                            <Text style={getStyles(isDark).bentoSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                                                        </View>
                                                    </LinearGradient>
                                                </Surface>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
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
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: isDark ? '#94A3B8' : '#64748B',
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    star: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
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
    mainContainer: {
        marginTop: -30,
        paddingHorizontal: 20,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 900, // Reduced for better Bento card proportions on desktop
    },
    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between', // Ensures items spread evenly
        // justifyContent: 'flex-start', // Alternative if we want tight packing
    },
    bentoItem: {
        height: 120, // Slightly taller for institute items
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

export default InstituteHomeScreen;
