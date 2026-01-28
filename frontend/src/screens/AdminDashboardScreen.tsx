import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator, Surface, Searchbar, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import PendingUserCard from '../components/PendingUserCard';
import api from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PendingUser {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'institute';
    createdAt: string;
    selectedClass?: number;
    instituteId?: { name: string };
}

const AdminDashboardScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();
    const { isDark } = useAppTheme();

    // Professional Theme Colors
    const theme = {
        primary: '#0F172A', // Slate 900
        secondary: '#334155', // Slate 700
        accent: '#2563EB', // Blue 600
        background: isDark ? '#0F172A' : '#F1F5F9', // Slate 900 or Slate 100
        cardUser: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F8FAFC' : '#1E293B',
        textSecondary: isDark ? '#94A3B8' : '#64748B',
        success: '#10B981',
        warning: '#F59E0B',
        info: '#3B82F6',
    };

    const styles = createStyles(theme, insets);

    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);

    const fetchPendingUsers = async () => {
        try {
            const response = await api.get('/approval/pending');
            setPendingUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch pending users:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingUsers();
    };

    const handleApprove = (userId: string) => {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
    };

    const handleReject = (userId: string) => {
        setPendingUsers(prev => prev.filter(u => u._id !== userId));
    };

    const getFilteredUsers = () => {
        let filtered = pendingUsers;

        if (searchQuery) {
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterRole) {
            filtered = filtered.filter(u => u.role === filterRole);
        }

        return filtered;
    };

    const getRoleCounts = () => {
        return {
            all: pendingUsers.length,
            student: pendingUsers.filter(u => u.role === 'student').length,
            teacher: pendingUsers.filter(u => u.role === 'teacher').length,
            institute: pendingUsers.filter(u => u.role === 'institute').length,
        };
    };

    const roleCounts = getRoleCounts();
    const filteredUsers = getFilteredUsers();

    return (
        <View style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.topNav}>
                <View style={styles.navLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Admin Panel</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Dashboard Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.pageTitle}>Overview</Text>
                    <Text style={styles.pageSubtitle}>Manage pending approvals and platform activity.</Text>
                </View>

                {/* Stats Grid */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <MaterialCommunityIcons name="account-clock" size={24} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{roleCounts.all}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <MaterialCommunityIcons name="school" size={24} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{roleCounts.student}</Text>
                            <Text style={styles.statLabel}>Students</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <MaterialCommunityIcons name="human-male-board" size={24} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{roleCounts.teacher}</Text>
                            <Text style={styles.statLabel}>Teachers</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                            <MaterialCommunityIcons name="domain" size={24} color="#8B5CF6" />
                        </View>
                        <View>
                            <Text style={styles.statValue}>{roleCounts.institute}</Text>
                            <Text style={styles.statLabel}>Institutes</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Action Bar */}
                <View style={styles.actionBar}>
                    <Searchbar
                        placeholder="Search users..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor={theme.textSecondary}
                        placeholderTextColor={theme.textSecondary}
                    />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                        {['student', 'teacher', 'institute'].map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[
                                    styles.filterChip,
                                    filterRole === role && { backgroundColor: theme.accent }
                                ]}
                                onPress={() => setFilterRole(filterRole === role ? null : role)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    filterRole === role && { color: '#fff' }
                                ]}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Users List */}
                <View style={styles.listSection}>
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>Approval Requests</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{filteredUsers.length} New</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={theme.accent} />
                        </View>
                    ) : filteredUsers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="check-all" size={48} color={theme.textSecondary} />
                            <Text style={styles.emptyText}>No pending requests found</Text>
                            {(searchQuery || filterRole) && (
                                <TouchableOpacity onPress={() => { setSearchQuery(''); setFilterRole(null); }}>
                                    <Text style={styles.linkText}>Clear Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        filteredUsers.map((user, index) => (
                            <Animated.View
                                key={user._id}
                                entering={FadeInUp.delay(index * 50).duration(400)}
                            >
                                <PendingUserCard
                                    user={user}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            </Animated.View>
                        ))
                    )}
                </View>

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
        backgroundColor: theme.cardUser,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
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
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        letterSpacing: 0.5,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    headerSection: {
        marginBottom: 24,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 15,
        color: theme.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (SCREEN_WIDTH - 52) / 2, // 20 padding * 2 + 12 gap = 52
        backgroundColor: theme.cardUser,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    statLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    actionBar: {
        marginBottom: 20,
    },
    searchBar: {
        backgroundColor: theme.cardUser,
        borderRadius: 12,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
    searchInput: {
        fontSize: 15,
        color: theme.text,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.cardUser,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    listSection: {
        marginTop: 4,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    badge: {
        backgroundColor: theme.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: theme.cardUser,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 12,
        marginBottom: 8,
    },
    linkText: {
        fontSize: 14,
        color: theme.accent,
        fontWeight: '600',
    },
});

export default AdminDashboardScreen;
