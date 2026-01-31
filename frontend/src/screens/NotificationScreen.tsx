import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Image, Platform } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import api from '../services/api';
import { spacing, borderRadius, theme } from '../theme';
import { formatDistanceToNow } from 'date-fns';
import ScreenBackground from '../components/ScreenBackground';
import CompactHeader from '../components/ui/CompactHeader';
import { useAppTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

const NotificationScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment': return 'book-education-outline';
            case 'approval': return 'check-decagram-outline';
            case 'reminder': return 'clock-time-four-outline';
            case 'system': return 'information-outline';
            default: return 'bell-ring-outline';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'assignment': return '#4facfe';
            case 'approval': return '#4CAF50';
            case 'reminder': return '#FF9800';
            default: return '#666';
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} layout={Layout.springify()}>
            <TouchableOpacity
                onPress={() => !item.isRead && markAsRead(item._id)}
                activeOpacity={0.9}
                style={styles.cardContainer}
            >
                <Surface style={[styles.card, !item.isRead && styles.unreadCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]} elevation={2}>
                    <View style={styles.cardGradient}>
                        <View style={[styles.iconContainer, { backgroundColor: getColor(item.type) + (isDark ? '30' : '15') }]}>
                            <MaterialCommunityIcons
                                name={getIcon(item.type) as any}
                                size={28}
                                color={getColor(item.type)}
                            />
                        </View>
                        <View style={styles.content}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, { color: isDark ? '#F1F5F9' : '#334155' }, !item.isRead && styles.unreadText]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {!item.isRead && <View style={styles.dot} />}
                            </View>
                            <Text style={[styles.message, { color: isDark ? '#94A3B8' : '#64748b' }]} numberOfLines={3}>{item.message}</Text>
                            <View style={styles.footerRow}>
                                <MaterialCommunityIcons name="clock-outline" size={12} color={isDark ? '#64748B' : '#94a3b8'} />
                                <Text style={[styles.time, { color: isDark ? '#64748B' : '#94a3b8' }]}>
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Surface>
            </TouchableOpacity>
        </Animated.View>
    );

    const styles = createStyles(isDark, isDesktop);

    return (
        <ScreenBackground style={styles.container}>
            <CompactHeader
                title="Notifications"
                subtitle={`${notifications.filter(n => !n.isRead).length} unread`}
                onBack={() => navigation.goBack()}
                rightComponent={
                    <TouchableOpacity
                        onPress={markAllAsRead}
                        disabled={notifications.every(n => n.isRead)}
                        style={[styles.actionButton, notifications.every(n => n.isRead) && styles.disabledButton]}
                    >
                        <MaterialCommunityIcons
                            name="check-all"
                            size={24}
                            color={notifications.every(n => n.isRead) ? (isDark ? '#475569' : '#cbd5e1') : '#6366f1'}
                        />
                    </TouchableOpacity>
                }
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={[styles.listContent, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <LinearGradient
                                colors={isDark ? ['rgba(99, 102, 241, 0.1)', 'rgba(124, 58, 237, 0.1)'] : ['rgba(99, 102, 241, 0.1)', 'rgba(124, 58, 237, 0.1)']}
                                style={styles.emptyIconContainer}
                            >
                                <MaterialCommunityIcons name="bell-off-outline" size={64} color={isDark ? '#64748B' : '#94a3b8'} />
                            </LinearGradient>
                            <Text style={styles.emptyTitle}>All Caught Up!</Text>
                            <Text style={styles.emptyText}>You have no new notifications at the moment.</Text>
                        </View>
                    }
                />
            )}
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: isDark ? '#334155' : '#f8fafc',
    },
    disabledButton: {
        opacity: 0.5,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    cardContainer: {
        marginBottom: spacing.md,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardGradient: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center',
    },
    unreadCard: {
        borderWidth: 2,
        borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#e0e7ff',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    unreadText: {
        fontWeight: '800',
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    time: {
        fontSize: 12,
        fontWeight: '500',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        padding: spacing.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#334155',
        marginBottom: spacing.sm,
    },
    emptyText: {
        textAlign: 'center',
        color: isDark ? '#94A3B8' : '#64748B',
        fontSize: 16,
        lineHeight: 24,
    },
});

export default NotificationScreen;
