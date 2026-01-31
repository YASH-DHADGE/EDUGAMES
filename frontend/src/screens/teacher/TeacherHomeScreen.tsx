import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, StatusBar } from 'react-native';
import { Text, Surface, Portal, Dialog, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenBackground from '../../components/ScreenBackground';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useWindowDimensions, Platform } from 'react-native';
import { spacing } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

import CompactHeader from '../../components/ui/CompactHeader';

const TeacherHomeScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();
    const styles = getStyles(isDark);
    const [stats, setStats] = useState({
        totalStudents: 0,
        pendingApprovals: 0,
        averageAttendance: '0%'
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await api.get('/teacher/stats');
            setStats({
                totalStudents: response.data.totalStudents || 0,
                pendingApprovals: response.data.pendingApprovals || 0,
                averageAttendance: response.data.averageAttendance || '0%'
            });
        } catch (error) {
            console.error('Failed to fetch teacher stats:', error);
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

    const handleLogout = () => {
        setShowLogoutDialog(false);
        logout();
    };

    const { isMobile, containerStyle } = useResponsive();

    // Categorized Bento Data
    const TEACHER_SECTIONS = [
        {
            title: "CLASSROOM OPERATIONS",
            // Desktop Asymmetric Row: 5 + 3 + 4 = 12
            data: [
                { id: '1', label: 'My Classrooms', icon: 'google-classroom', screen: 'TeacherClassroomList', gradient: ['#4F46E5', '#6366F1'], subtitle: 'Manage Classes', colSpan: 4 },
                { id: '1b', label: 'Preview', icon: 'eye', screen: 'TeacherClassroom', gradient: ['#8B5CF6', '#7C3AED'], subtitle: 'Content View', colSpan: 4 },
                { id: '2', label: 'Roster', icon: 'account-group', screen: 'StudentList', gradient: ['#0EA5E9', '#38BDF8'], subtitle: 'View Profiles', colSpan: 4 },
                { id: '3', label: 'Requests', icon: 'account-plus', screen: 'TeacherApprovals', gradient: ['#D97706', '#F59E0B'], subtitle: 'New Students', badge: stats.pendingApprovals, colSpan: 12, mobileFull: true },
            ]
        },
        {
            title: "ACADEMIC TOOLS",
            data: [
                { id: '4', label: 'Quiz', icon: 'plus-circle-outline', screen: 'TeacherQuizCreator', gradient: ['#DC2626', '#EF4444'], subtitle: 'Create & Manage', colSpan: 4 },
                { id: '5', label: 'Assign', icon: 'book-open-page-variant', screen: 'ChapterAssign', gradient: ['#EA580C', '#F97316'], subtitle: 'Homework', colSpan: 4 },
                { id: '6', label: 'Content', icon: 'folder-google-drive', screen: 'TeacherContentManager', gradient: ['#059669', '#10B981'], subtitle: 'Study Materials', colSpan: 4 },
            ]
        },
        {
            title: "INSIGHTS & WELLNESS",
            data: [
                { id: '7', label: 'Analytics', icon: 'chart-bar', screen: 'TeacherAnalytics', gradient: ['#2563EB', '#3B82F6'], subtitle: 'Performance', colSpan: 7 },
                { id: '8', label: 'Wellness', icon: 'heart-pulse', screen: 'TeacherWellbeing', gradient: ['#DB2777', '#EC4899'], subtitle: 'Student Health', colSpan: 5 },
            ]
        },
        {
            title: "UTILITIES",
            data: [
                { id: '9', label: 'Games', icon: 'controller-classic', screen: 'TeacherGameAnalytics', gradient: ['#E11D48', '#F43F5E'], subtitle: 'Educational', colSpan: 3 },
                { id: '10', label: 'Videos', icon: 'youtube', screen: 'TeacherVideoManager', gradient: ['#FF0000', '#FF4444'], subtitle: 'Curated', colSpan: 3 },
                { id: '11', label: 'Feedback', icon: 'message-text', screen: 'TeacherFeedback', gradient: ['#0284C7', '#0EA5E9'], subtitle: 'Reviews', colSpan: 3 },
                { id: '12', label: 'Notify', icon: 'bell-ring', screen: 'TeacherSendNotification', gradient: ['#BE123C', '#E11D48'], subtitle: 'Alerts', colSpan: 3 },
            ]
        }
    ];

    return (
        <ScreenBackground style={getStyles(isDark).container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <ScrollView
                style={{ zIndex: 10, elevation: 10 }} // Added explicit z-index
                showsVerticalScrollIndicator={false}
                contentContainerStyle={getStyles(isDark).scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#4F46E5'} />}
            >
                {/* Compact Header */}
                <CompactHeader
                    showProfile={true}
                    subtitle="Teacher Portal"
                    rightComponent={
                        <>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => (navigation as any).navigate('Notifications')}
                            >
                                <Ionicons name="notifications-outline" size={20} color={"#fff"} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={toggleTheme}
                            >
                                <MaterialCommunityIcons
                                    name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
                                    size={20}
                                    color={isDark ? '#FCD34D' : '#fff'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowLogoutDialog(true)} style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </>
                    }
                />

                <View style={styles.contentContainer}>
                    {/* Stats Cards Row */}
                    <View style={styles.statsRow}>
                        <Animated.View entering={FadeInDown.delay(100)} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                                <MaterialCommunityIcons name="account-group" size={20} color={isDark ? '#38BDF8' : '#0EA5E9'} />
                            </View>
                            <Text style={styles.statValue}>{stats.totalStudents}</Text>
                            <Text style={styles.statLabel}>Students</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200)} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                <MaterialCommunityIcons name="account-clock" size={20} color={isDark ? '#FBBF24' : '#F59E0B'} />
                            </View>
                            <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300)} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <MaterialCommunityIcons name="chart-line" size={20} color={isDark ? '#34D399' : '#10B981'} />
                            </View>
                            <Text style={styles.statValue}>{stats.averageAttendance}</Text>
                            <Text style={styles.statLabel}>Attendance</Text>
                        </Animated.View>
                    </View>

                    {/* 📦 BENTO GRID */}
                    <View style={[getStyles(isDark).mainContainer, { paddingBottom: 100 }]}>
                        {TEACHER_SECTIONS.map((section, secIndex) => (
                            <View key={secIndex} style={{ marginBottom: 32 }}>
                                <Text style={getStyles(isDark).sectionHeader}>{section.title}</Text>
                                <View style={getStyles(isDark).bentoGrid}>
                                    {section.data.map((item, index) => {
                                        const isMobile = SCREEN_WIDTH < 768;
                                        let itemWidth: any;

                                        if (isMobile) {
                                            if ((item as any).mobileFull) itemWidth = '100%';
                                            else itemWidth = '48%';
                                        } else {
                                            if (item.colSpan === 12) itemWidth = '100%';
                                            else if (item.colSpan === 8) itemWidth = '65.5%';
                                            else if (item.colSpan === 7) itemWidth = '57%';
                                            else if (item.colSpan === 6) itemWidth = '48.5%';
                                            else if (item.colSpan === 5) itemWidth = '40%';
                                            else if (item.colSpan === 4) itemWidth = '31.5%';
                                            else itemWidth = '23%'; // colSpan 3
                                        }

                                        return (
                                            <Animated.View
                                                key={item.id}
                                                entering={FadeInDown.delay(index * 100 + secIndex * 100).springify()}
                                                style={{
                                                    width: itemWidth,
                                                    height: item.colSpan === 12 ? 110 : (item.colSpan > 6 ? 110 : 100),
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

                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Logout Confirmation Dialog */}
            <Portal>
                <Dialog
                    visible={showLogoutDialog}
                    onDismiss={() => setShowLogoutDialog(false)}
                    style={{
                        backgroundColor: isDark ? '#1E293B' : '#fff',
                        maxWidth: 400,
                        width: '90%',
                        alignSelf: 'center',
                        borderRadius: 16
                    }}
                >
                    <View style={{
                        alignItems: 'center',
                        marginTop: 20,
                        marginBottom: 16
                    }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <MaterialCommunityIcons
                                name="logout"
                                size={32}
                                color={isDark ? '#F87171' : '#EF4444'}
                            />
                        </View>
                    </View>
                    <Dialog.Title style={{
                        textAlign: 'center',
                        color: isDark ? '#F1F5F9' : '#1E293B',
                        fontSize: 20,
                        fontWeight: '700'
                    }}>
                        Logout Confirmation
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text style={{
                            textAlign: 'center',
                            color: isDark ? '#94A3B8' : '#64748B',
                            fontSize: 16,
                            lineHeight: 24
                        }}>
                            Are you sure you want to logout?
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                        <Button
                            onPress={() => setShowLogoutDialog(false)}
                            mode="outlined"
                            textColor={isDark ? '#94A3B8' : '#64748B'}
                            style={{
                                borderColor: isDark ? '#475569' : '#CBD5E1',
                                borderRadius: 12,
                                marginRight: 8
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={handleLogout}
                            mode="contained"
                            buttonColor="#EF4444"
                            textColor="#fff"
                            style={{ borderRadius: 12 }}
                        >
                            Logout
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScreenBackground>
    );
};

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: isDark ? '#94A3B8' : '#64748B',
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
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
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 30,
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
    contentContainer: {
        paddingTop: 20,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        paddingHorizontal: 16,
    },
    mainContainer: {
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },

    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    bentoItem: {
        height: 100, // Slightly more compact for teacher's many tools
        borderRadius: 20,
        marginBottom: 4, // Safety
    },
    bentoSurface: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    bentoGradient: {
        flex: 1,
        padding: 12,
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

export default TeacherHomeScreen;
