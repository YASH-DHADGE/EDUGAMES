import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, Avatar, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ScreenBackground from '../components/ScreenBackground';
import { useAppTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import SuccessModal from '../components/ui/SuccessModal';
import CompactHeader from '../components/ui/CompactHeader';

const TeacherApprovalsScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const colors = theme.colors;
    const { isDesktop, maxContentWidth } = useResponsive();
    const { logout } = useAuth();

    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const styles = createStyles(isDark, isDesktop);

    const fetchPendingUsers = useCallback(async () => {
        try {
            const response = await api.get('/approval/pending');
            setPendingUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch pending users:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingUsers();
    }, [fetchPendingUsers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingUsers();
    };

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setActionLoading(userId);
        try {
            await api.post(`/approval/${action}/${userId}`);

            setPendingUsers(prev => prev.filter(u => u._id !== userId));
            setSuccessMessage(action === 'approve' ? 'Student approved successfully' : 'Request rejected');
            setShowSuccessModal(true);
        } catch (error) {
            console.error(`Failed to ${action} user:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    const renderPendingCard = (user: any, index: number) => (
        <Animated.View
            key={user._id}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={styles.cardContainer}
        >
            <Surface style={styles.card} elevation={2}>
                <View style={styles.cardHeader}>
                    <Avatar.Text
                        size={50}
                        label={user.name.substring(0, 2).toUpperCase()}
                        style={{ backgroundColor: colors.primary }}
                        color="#fff"
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <MaterialCommunityIcons name="school" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                                <Text style={styles.metaText}>Class {user.classNumber}</Text>
                            </View>
                            <View style={styles.metaDot} />
                            <View style={styles.metaItem}>
                                <MaterialCommunityIcons name="calendar-clock" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                                <Text style={styles.metaText}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleAction(user._id, 'reject')}
                        disabled={actionLoading === user._id}
                    >
                        {actionLoading === user._id ? (
                            <ActivityIndicator color="#EF4444" size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
                                <Text style={styles.rejectText}>Reject</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleAction(user._id, 'approve')}
                        disabled={actionLoading === user._id}
                    >
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.approveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {actionLoading === user._id ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                    <Text style={styles.approveText}>Approve</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Surface>
        </Animated.View>
    );

    return (
        <ScreenBackground>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Compact Header */}
                <CompactHeader
                    title="Student Approvals"
                    subtitle={`${pendingUsers.length} Pending Request${pendingUsers.length !== 1 ? 's' : ''}`}
                    onBack={() => navigation.goBack()}
                    rightComponent={
                        <TouchableOpacity onPress={logout} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 }}>
                            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
                        </TouchableOpacity>
                    }
                />

                <View style={[styles.contentContainer, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Loading requests...</Text>
                        </View>
                    ) : pendingUsers.length === 0 ? (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
                            <LinearGradient
                                colors={isDark ? ['#1E293B', '#0F172A'] : ['#F0F9FF', '#E0F2FE']}
                                style={styles.emptyIconContainer}
                            >
                                <MaterialCommunityIcons name="check-all" size={64} color="#0EA5E9" />
                            </LinearGradient>
                            <Text style={styles.emptyTitle}>All Caught Up!</Text>
                            <Text style={styles.emptyText}>No pending requests at the moment.</Text>
                        </Animated.View>
                    ) : (
                        <View style={styles.listContainer}>
                            {pendingUsers.map(renderPendingCard)}
                        </View>
                    )}
                </View>
            </ScrollView>

            <SuccessModal
                visible={showSuccessModal}
                title="Success"
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
                buttonText="Done"
            />
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerContentWrapper: {
        width: '100%',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
    },
    headerTextContainer: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    statsContainer: {
        flexDirection: 'row',
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    contentContainer: {
        padding: 20,
        marginTop: -30,
    },
    loadingContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    loadingText: {
        marginTop: 16,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        padding: 20,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#1E293B',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: isDark ? '#94A3B8' : '#64748B',
        textAlign: 'center',
    },
    listContainer: {
        gap: 16,
    },
    cardContainer: {
        marginBottom: 16,
    },
    card: {
        borderRadius: 24,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? '#fff' : '#1E293B',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: isDark ? '#94A3B8' : '#64748B',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    metaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDark ? '#475569' : '#CBD5E1',
    },
    actionRow: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    rejectButton: {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
    },
    rejectText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 15,
    },
    approveButton: {

    },
    approveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 13, // +1 for border compensation
        gap: 8,
    },
    approveText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default TeacherApprovalsScreen;
