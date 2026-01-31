import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Surface, Avatar, ActivityIndicator, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';
import FeedbackFormModal from '../../components/FeedbackFormModal';
import ScreenBackground from '../../components/ScreenBackground';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import CompactHeader from '../../components/ui/CompactHeader';

const TeacherFeedbackScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const colors = theme.colors;
    const { isDesktop, maxContentWidth } = useResponsive();

    const [viewMode, setViewMode] = useState<'received' | 'sent'>('received');
    const [feedback, setFeedback] = useState<any[]>([]); // Student feedback
    const [myFeedback, setMyFeedback] = useState<any[]>([]); // My feedback
    const [stats, setStats] = useState<any>({ totalFeedback: 0, avgRating: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, low_rating
    const [showModal, setShowModal] = useState(false);

    const styles = createStyles(isDark, isDesktop);

    useEffect(() => {
        if (viewMode === 'received') {
            fetchTeacherFeedback();
        } else {
            fetchMyFeedback();
        }
    }, [viewMode]);

    const fetchTeacherFeedback = async () => {
        setLoading(true);
        try {
            const response = await api.get('/feedback/teacher');
            setFeedback(response.data.feedback);
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching teacher feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyFeedback = async () => {
        setLoading(true);
        try {
            const response = await api.get('/feedback/user');
            setMyFeedback(response.data.feedback);
        } catch (error) {
            console.error('Error fetching my feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSuccess = () => {
        if (viewMode === 'sent') {
            fetchMyFeedback();
        } else {
            setViewMode('sent');
        }
    };

    const getFilteredFeedback = () => {
        if (viewMode === 'sent') return myFeedback;

        if (filter === 'pending') {
            return feedback.filter(f => f.status === 'pending');
        } else if (filter === 'low_rating') {
            return feedback.filter(f => f.rating <= 3);
        }
        return feedback;
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'bug': return '#F43F5E';
            case 'suggestion': return '#F59E0B';
            case 'praise': return '#EC4899';
            case 'complaint': return '#F97316';
            default: return '#64748B';
        }
    };

    const renderFeedbackItem = ({ item, index }: any) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
            <Surface style={styles.card} elevation={2}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        {item.userId?.avatar ? (
                            <Avatar.Image size={40} source={typeof item.userId.avatar === 'string' ? { uri: item.userId.avatar } : item.userId.avatar} />
                        ) : (
                            <Avatar.Text size={40} label={item.userId?.name?.substring(0, 2) || 'S'} style={{ backgroundColor: '#6366F1' }} />
                        )}
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.userName}>{item.userId?.name || 'User'}</Text>
                            <Text style={styles.userEmail}>{item.userId?.email}</Text>
                        </View>
                    </View>
                    <Text style={styles.date}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                </View>

                <View style={styles.ratingRow}>
                    <View style={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialCommunityIcons
                                key={star}
                                name={item.rating >= star ? "star" : "star-outline"}
                                size={18}
                                color={item.rating >= star ? "#FFD700" : isDark ? "#475569" : "#E2E8F0"}
                            />
                        ))}
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                        <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Text>
                    </View>
                </View>

                <Text style={styles.comment}>
                    {item.comment}
                </Text>

                {item.targetName && (
                    <Text style={styles.targetText}>
                        Re: {item.targetName} ({item.targetType})
                    </Text>
                )}

                {/* Show status for sent feedback */}
                {viewMode === 'sent' && (
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'reviewed' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                    }]}>
                        <MaterialCommunityIcons
                            name={item.status === 'resolved' ? 'check-circle' : item.status === 'reviewed' ? 'eye' : 'clock-outline'}
                            size={14}
                            color={item.status === 'resolved' ? '#10B981' : item.status === 'reviewed' ? '#3B82F6' : '#F59E0B'}
                        />
                        <Text style={[styles.statusText, {
                            color: item.status === 'resolved' ? '#10B981' : item.status === 'reviewed' ? '#3B82F6' : '#F59E0B'
                        }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                )}
            </Surface>
        </Animated.View>
    );

    const StatCard = ({ title, value, icon, color }: any) => (
        <Surface style={styles.statCard} elevation={2}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{title}</Text>
            </View>
        </Surface>
    );

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <CompactHeader
                    title="Feedback"
                    onBack={() => navigation.goBack()}
                />

                <View style={[styles.header, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>
                    {/* Tabs moved to body, or keep a sub-header */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, viewMode === 'received' && styles.activeTab]}
                            onPress={() => setViewMode('received')}
                        >
                            <Text style={[styles.tabText, viewMode === 'received' && styles.activeTabText]}>Student Feedback</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, viewMode === 'sent' && styles.activeTab]}
                            onPress={() => setViewMode('sent')}
                        >
                            <Text style={[styles.tabText, viewMode === 'sent' && styles.activeTabText]}>My Feedback</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.content, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>
                    {viewMode === 'received' && (
                        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.statsContainer}>
                            <StatCard
                                title="Total Feedback"
                                value={stats.totalFeedback}
                                icon="message-text-outline"
                                color="#3B82F6"
                            />
                            <StatCard
                                title="Avg Rating"
                                value={stats.avgRating ? stats.avgRating.toFixed(1) : '0.0'}
                                icon="star-outline"
                                color="#F59E0B"
                            />
                            <StatCard
                                title="Pending"
                                value={stats.pending}
                                icon="clock-outline"
                                color="#EC4899"
                            />
                        </Animated.View>
                    )}

                    {viewMode === 'received' && (
                        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.filterContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <Chip
                                    selected={filter === 'all'}
                                    onPress={() => setFilter('all')}
                                    style={[styles.chip, filter === 'all' && styles.chipActive]}
                                    textStyle={filter === 'all' ? styles.chipTextActive : styles.chipText}
                                    showSelectedOverlay
                                >
                                    All
                                </Chip>
                                <Chip
                                    selected={filter === 'pending'}
                                    onPress={() => setFilter('pending')}
                                    style={[styles.chip, filter === 'pending' && styles.chipActive]}
                                    textStyle={filter === 'pending' ? styles.chipTextActive : styles.chipText}
                                    showSelectedOverlay
                                >
                                    Pending
                                </Chip>
                                <Chip
                                    selected={filter === 'low_rating'}
                                    onPress={() => setFilter('low_rating')}
                                    style={[styles.chip, filter === 'low_rating' && styles.chipActive]}
                                    textStyle={filter === 'low_rating' ? styles.chipTextActive : styles.chipText}
                                    showSelectedOverlay
                                >
                                    Low Rating
                                </Chip>
                            </ScrollView>
                        </Animated.View>
                    )}

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#10B981" />
                        </View>
                    ) : (
                        <FlatList
                            data={getFilteredFeedback()}
                            renderItem={renderFeedbackItem}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="comment-check-outline" size={64} color={isDark ? "#475569" : "#CBD5E1"} />
                                    <Text style={styles.emptyText}>
                                        {viewMode === 'received' ? 'No student feedback found' : 'You haven\'t submitted any feedback yet'}
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>

                <FAB
                    icon="plus"
                    label="Give Feedback"
                    style={styles.fab}
                    onPress={() => setShowModal(true)}
                    color="#FFF"
                />

                <FeedbackFormModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    initialTargetType="app"
                    onSuccess={handleFeedbackSuccess}
                />
            </View>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 10,
    },
    headerContentWrapper: {
        width: '100%',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 5,
        marginRight: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 14,
    },
    activeTab: {
        backgroundColor: '#FFF',
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    activeTabText: {
        color: '#10B981',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    statLabel: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    filterContainer: {
        marginBottom: 16,
    },
    chip: {
        marginRight: 8,
        backgroundColor: isDark ? '#1E293B' : '#fff',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E2E8F0',
    },
    chipActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10B981',
    },
    chipText: {
        color: isDark ? '#94A3B8' : '#64748B',
    },
    chipTextActive: {
        color: '#10B981',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 100,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#1A1A1A',
    },
    userEmail: {
        fontSize: 12,
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 2,
    },
    date: {
        fontSize: 11,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
    },
    comment: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 12,
        color: isDark ? '#E2E8F0' : '#334155',
    },
    targetText: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 12,
        gap: 6
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: isDark ? '#94A3B8' : '#64748B',
        marginTop: 16,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 0,
        backgroundColor: '#10B981',
        borderRadius: 16,
    },
});

export default TeacherFeedbackScreen;
