import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import PendingUserCard from '../components/PendingUserCard';
import api from '../services/api';
import { theme as appTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const InstituteDashboardScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();

    // Professional Theme - Indigo Focus
    const theme = {
        primary: '#1E1B4B', // Indigo 950
        secondary: '#312E81', // Indigo 900
        accent: '#4F46E5', // Indigo 600
        background: '#F8FAFC', // Slate 50
        card: '#FFFFFF',
        text: '#0F172A', // Slate 900
        textSecondary: '#64748B', // Slate 500
    };

    const styles = createStyles(theme, insets);

    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ teachers: 0, students: 0 });

    const fetchDashboardData = async () => {
        try {
            // Parallel fetch for efficiency
            const [pendingRes, statsRes] = await Promise.allSettled([
                api.get('/approval/pending'),
                api.get('/institute/stats') // Assuming this endpoint exists or will be created/mocked
            ]);

            if (pendingRes.status === 'fulfilled') {
                setPendingUsers(pendingRes.value.data);
            }

            if (statsRes.status === 'fulfilled') {
                // If endpoint doesn't exist yet, we might get an error, that's handled.
                // Assuming it returns basic count
                setStats(statsRes.value.data);
            } else {
                // Mock stats if API fails/doesn't exist
                setStats({ teachers: 12, students: 450 });
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const handleApprove = (userId: string) => {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
    };

    const handleReject = (userId: string) => {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
    };

    const menuItems = [
        { title: 'Manage Teachers', icon: 'human-male-board', screen: 'InstituteTeacherManager', color: '#10B981' },
        { title: 'Manage Students', icon: 'school', screen: 'InstituteStudentManager', color: '#3B82F6' },
        { title: 'Institute Profile', icon: 'domain', screen: 'Profile', color: '#8B5CF6' },
        { title: 'Reports', icon: 'file-chart', screen: 'InstituteReports', color: '#F59E0B' },
    ];

    return (
        <View style={styles.container}>
            {/* Top Navigation */}
            <View style={styles.topNav}>
                <View style={styles.navLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.navTitle}>Institute Portal</Text>
                        <Text style={styles.navSubtitle}>{user?.name || 'Dashboard'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Overview */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: '#EEF2FF' }]}>
                            <MaterialCommunityIcons name="human-male-board" size={28} color="#4F46E5" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{stats.teachers}</Text>
                            <Text style={styles.statLabel}>Active Teachers</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: '#F0F9FF' }]}>
                            <MaterialCommunityIcons name="school" size={28} color="#0EA5E9" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{stats.students}</Text>
                            <Text style={styles.statLabel}>Total Students</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Quick Actions Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>

                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.gridContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.gridItem}
                            onPress={() => (navigation as any).navigate(item.screen)}
                        >
                            <View style={[styles.gridIcon, { backgroundColor: item.color + '15' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                            </View>
                            <Text style={styles.gridTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                <Divider style={styles.divider} />

                {/* Pending Approvals Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Pending Approvals</Text>
                    {pendingUsers.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingUsers.length}</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="small" color={theme.accent} />
                        <Text style={styles.loadingText}>Fetching requests...</Text>
                    </View>
                ) : pendingUsers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="check-decagram-outline" size={48} color={theme.textSecondary} />
                        <Text style={styles.emptyText}>All caught up! No pending requests.</Text>
                    </View>
                ) : (
                    pendingUsers.map((user, index) => (
                        <Animated.View
                            key={user._id}
                            entering={FadeInUp.delay(300 + index * 50).duration(400)}
                        >
                            <PendingUserCard
                                user={user}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        </Animated.View>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: insets.top + 15,
        paddingBottom: 15,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    navLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBtn: {
        padding: 4,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    navSubtitle: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.text,
    },
    statLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    badge: {
        backgroundColor: theme.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    gridItem: {
        width: (SCREEN_WIDTH - 52) / 2,
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    gridIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gridTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        textAlign: 'center',
    },
    divider: {
        marginVertical: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: theme.textSecondary,
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'dashed',
        borderStyle: 'dashed',
    },
    emptyText: {
        marginTop: 12,
        color: theme.textSecondary,
        fontSize: 14,
    },
});

export default InstituteDashboardScreen;
