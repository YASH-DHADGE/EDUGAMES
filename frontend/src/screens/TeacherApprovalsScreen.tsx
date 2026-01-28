import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import PendingUserCard from '../components/PendingUserCard';
import api from '../services/api';
import { spacing, theme } from '../theme';
import GradientBackground from '../components/ui/GradientBackground';
import CustomCard from '../components/ui/CustomCard';

const TeacherApprovalsScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.welcomeText}>Approvals</Text>
                            <Text style={styles.subText}>Manage student requests</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                >
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="account-clock" size={24} color="#fff" />
                        </View>
                        <Text style={styles.sectionTitle}>Pending Requests</Text>
                        {pendingUsers.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pendingUsers.length}</Text>
                            </View>
                        )}
                    </View>

                    {loading ? (
                        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} size="large" />
                    ) : pendingUsers.length === 0 ? (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <MaterialCommunityIcons name="check-all" size={60} color="rgba(255,255,255,0.6)" />
                            </View>
                            <Text style={styles.emptyText}>All Caught Up!</Text>
                            <Text style={styles.emptySubtext}>No pending student approvals at the moment.</Text>
                        </Animated.View>
                    ) : (
                        pendingUsers.map((user, index) => (
                            <Animated.View
                                key={user._id}
                                entering={FadeInDown.delay(index * 100).duration(400)}
                            >
                                <PendingUserCard
                                    user={user}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Red tint
        borderRadius: 12,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    badge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        padding: 20,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    emptyText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default TeacherApprovalsScreen;
