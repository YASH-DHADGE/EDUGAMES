import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal as RNModal, useWindowDimensions, Pressable } from 'react-native';
import { Text, Surface, useTheme, ProgressBar, Button, IconButton, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import { learnService } from '../../services/learnService';
import { spacing, breakpoints } from '../../theme';
import Animated, { FadeInDown, FadeInUp, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import XPToast from '../../components/learn/XPToast';
import { getSimulationsByTopic } from '../../data/phetMappings';
import api from '../../services/api';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import ScreenBackground from '../../components/ScreenBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Responsive Web Constraints ---
const MAX_CONTENT_WIDTH = 1000;

// Reusable Scale Button for interactions
const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={() => (scale.value = withSpring(0.98))}
            onPressOut={() => (scale.value = withSpring(1))}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

const SubchapterScreen = ({ route, navigation }: any) => {
    const { subchapterId } = route.params;
    const theme = useTheme();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { addXP } = useAuth();

    const [subchapter, setSubchapter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completedActions, setCompletedActions] = useState<string[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [earnedXP, setEarnedXP] = useState(0);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    const isWeb = Platform.OS === 'web';
    const isLargeScreen = width > breakpoints.mobile;

    // Grid Columns Calculation
    const getNumColumns = () => {
        if (width > breakpoints.desktop) return 4;
        if (width > breakpoints.tablet) return 3;
        return 2;
    };
    const numColumns = getNumColumns();
    const cardWidth = isLargeScreen
        ? `${(100 / numColumns) - 2}%` // Gap compensation
        : '48%';

    useEffect(() => {
        loadSubchapter();
    }, []);

    const loadSubchapter = async () => {
        try {
            const data = await learnService.getSubchapter(subchapterId);
            setSubchapter(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (actionType: string, xpReward: number, navigateTo?: string) => {
        if (!completedActions.includes(actionType)) {
            addXP(xpReward);
            setCompletedActions([...completedActions, actionType]);
            setEarnedXP(xpReward);
            setShowToast(true);
        }

        if (navigateTo) {
            if (navigateTo === 'Quiz') {
                navigation.navigate('SubchapterQuiz', { subchapterId });
            } else if (navigateTo === 'Visualization') {
                const topicKey = subchapter?.name?.toLowerCase().replace(/\s+/g, '_') || '';
                const sims = getSimulationsByTopic(topicKey);
                navigation.navigate('SimulationList', { subchapterSims: sims });
            } else if (navigateTo === 'Games') {
                navigation.navigate('Games');
            } else if (navigateTo === 'Read') {
                navigation.navigate('LessonReader', {
                    title: subchapter?.name || 'Lesson',
                    content: subchapter?.lessonContent || '# No content available',
                    xpReward: 10
                });
            } else if (navigateTo === 'ThreeDModel') {
                navigation.navigate('ModelList');
            } else if (navigateTo === 'AI') {
                setShowAIModal(true);
            } else if (navigateTo && navigateTo.startsWith('Game:')) {
                const gameScreen = navigateTo.replace('Game:', '');
                navigation.navigate(gameScreen);
            }
        }
    };

    const handleGenerateQuiz = async () => {
        try {
            setGeneratingQuiz(true);
            const response = await api.post(`/learn/subchapters/${subchapterId}/quiz/regenerate`);
            if (response.data.success) {
                setShowAIModal(false);
                Alert.alert('Success', 'Quiz generated successfully!', [{ text: 'Take Quiz', onPress: () => handleAction('quiz', 20, 'Quiz') }]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate quiz.');
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleGenerateContent = async () => {
        try {
            setGeneratingContent(true);
            const response = await api.post(`/learn/subchapters/${subchapterId}/generate-content`);
            if (response.data.success) {
                await loadSubchapter();
                setShowAIModal(false);
                Alert.alert('Success', 'Reading material generated!', [{ text: 'Read Now', onPress: () => handleAction('read', 10, 'Read') }]);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate content.');
        } finally {
            setGeneratingContent(false);
        }
    };

    const CircularProgress = ({ progress }: { progress: number }) => {
        const size = 80;
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDashoffset = circumference - (progress * circumference);

        return (
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    {/* Track */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#fff"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                        {Math.round(progress * 100)}%
                    </Text>
                </View>
            </View>
        );
    };

    const ActionCard = ({ title, icon, xp, type, color, gradientColors, delay, navigateTo }: any) => {
        const isCompleted = completedActions.includes(type);
        const hoverScale = useSharedValue(1);

        return (
            <Animated.View
                entering={isWeb ? undefined : FadeInUp.delay(delay).duration(500)}
                layout={Layout.springify()}
                style={[styles.actionCardWrapper, { width: cardWidth as any }]}
            >
                <ScaleButton
                    onPress={() => handleAction(type, xp, navigateTo)}
                    style={styles.cardTouchable}
                    onHoverIn={() => { if (isWeb) hoverScale.value = withTiming(1.05); }}
                    onHoverOut={() => { if (isWeb) hoverScale.value = withTiming(1); }}
                >
                    <LinearGradient
                        colors={gradientColors || [color, color]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionCard}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name={icon} size={32} color="#fff" />
                            </View>
                            {isCompleted ? (
                                <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                            ) : (
                                <View style={styles.xpBadge}>
                                    <Text style={styles.xpText}>+{xp} XP</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.cardFooter}>
                            <Text numberOfLines={2} style={styles.cardTitle}>{title}</Text>
                        </View>
                    </LinearGradient>
                </ScaleButton>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <ScreenBackground style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6366F1" />
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground style={styles.container}>
            <XPToast visible={showToast} xp={earnedXP} onHide={() => setShowToast(false)} />

            <Portal>
                <Modal visible={showAIModal} onDismiss={() => setShowAIModal(false)} contentContainerStyle={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MaterialCommunityIcons name="robot-excited" size={28} color="#6A5AE0" />
                                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#1E293B' }}>AI Assistant</Text>
                            </View>
                            <IconButton icon="close" onPress={() => setShowAIModal(false)} />
                        </View>
                        <Text style={styles.modalDescription}>Use AI to generate personalized content for this topic.</Text>
                        <View style={{ gap: 12 }}>
                            <Button mode="contained" icon="brain" onPress={handleGenerateQuiz} loading={generatingQuiz} buttonColor="#7C3AED">Generate New Quiz</Button>
                            <Button mode="contained" icon="book-open-variant" onPress={handleGenerateContent} loading={generatingContent} buttonColor="#0EA5E9">Generate Reading Material</Button>
                        </View>
                    </View>
                </Modal>
            </Portal>

            {/* Header Background */}
            <View style={styles.headerBackgroundWrapper}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            {/* Header Content */}
            <View style={[styles.headerContentWrapper, { paddingTop: insets.top + spacing.md }, isLargeScreen && styles.webCentered]}>
                <View style={[styles.headerRow, isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH, width: '100%' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {subchapter?.name}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={[styles.scrollContent, isLargeScreen && styles.webScrollContent]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[isLargeScreen && { maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center' }]}>

                    {/* Progress Card */}
                    <Animated.View entering={FadeInDown.duration(600)} style={styles.progressCardWrapper}>
                        <LinearGradient
                            colors={['#7C3AED', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.progressCard}
                        >
                            <CircularProgress progress={completedActions.length / 5} />
                            <View style={styles.progressInfo}>
                                <Text style={styles.progressTitle}>Topic Progress</Text>
                                <Text style={styles.progressSubtitle}>{completedActions.length} of 5 activities completed</Text>
                                <View style={styles.linearProgressBg}>
                                    <View style={[styles.linearProgressFill, { width: `${(completedActions.length / 5) * 100}%` }]} />
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    <Text style={styles.sectionHeader}>Activities</Text>

                    <View style={styles.gridContainer}>
                        <ActionCard
                            title="Read Lesson"
                            icon="book-open-variant"
                            xp={10}
                            type="read"
                            color="#10B981" // Green
                            gradientColors={['#10B981', '#34D399']}
                            delay={100}
                            navigateTo="Read"
                        />
                        <ActionCard
                            title="Solve Quiz"
                            icon="brain"
                            xp={20}
                            type="quiz"
                            color="#F59E0B" // Orange
                            gradientColors={['#F59E0B', '#FBBF24']}
                            delay={200}
                            navigateTo="Quiz"
                        />
                        <ActionCard
                            title="AI Assistant"
                            icon="robot"
                            xp={15}
                            type="ai"
                            color="#0EA5E9" // Blue
                            gradientColors={['#0EA5E9', '#38BDF8']}
                            delay={300}
                            navigateTo="AI"
                        />
                        <ActionCard
                            title="Play Games"
                            icon="gamepad-variant"
                            xp={15}
                            type="game"
                            color="#D946EF" // Pink/Purple
                            gradientColors={['#D946EF', '#E879F9']}
                            delay={400}
                            navigateTo="Games"
                        />
                        <ActionCard
                            title="3D Models"
                            icon="cube-outline"
                            xp={15}
                            type="3d_model"
                            color="#6366F1" // Indigo
                            gradientColors={['#6366F1', '#818CF8']}
                            delay={500}
                            navigateTo="ThreeDModel"
                        />
                    </View>

                    {/* Lesson Preview */}
                    <Surface style={styles.lessonPreviewCard} elevation={2}>
                        <View style={styles.lessonPreviewHeader}>
                            <MaterialCommunityIcons name="text-box-outline" size={24} color="#64748B" />
                            <Text style={styles.lessonPreviewTitle}>Quick Preview</Text>
                        </View>
                        <Text style={styles.lessonPreviewText} numberOfLines={4}>
                            {subchapter?.lessonContent || `Welcome to the lesson on ${subchapter?.name}. Complete the activities above to master this topic!`}
                        </Text>
                        <Button mode="text" labelStyle={{ color: '#6366F1' }} onPress={() => handleAction('read', 10, 'Read')}>
                            Read Full Lesson
                        </Button>
                    </Surface>

                </View>
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    headerBackgroundWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
        zIndex: 0,
    },
    headerGradient: {
        flex: 1,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContentWrapper: {
        zIndex: 10,
        paddingHorizontal: spacing.lg,
        paddingBottom: 20,
    },
    webCentered: {
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        ...Platform.select({ web: { backdropFilter: 'blur(10px)' } }) as any
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 10,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    // Content
    scrollContent: {
        paddingTop: 60, // Push content down to overlap/underlap correctly
        paddingBottom: 40,
        paddingHorizontal: spacing.lg,
    },
    webScrollContent: {
        paddingHorizontal: 0, // Reset horizontal padding, handled by inner web container
    },

    // Progress Card
    progressCardWrapper: {
        marginBottom: 24,
        borderRadius: 24,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    progressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        gap: 20,
    },
    progressInfo: {
        flex: 1,
    },
    progressTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    progressSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 12,
    },
    linearProgressBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
    },
    linearProgressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 4,
    },

    // Grid
    sectionHeader: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12, // vertical gap handled by marginBottom on items, horizontal by justifyContent
    },
    actionCardWrapper: {
        marginBottom: 16,
    },
    cardTouchable: {
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    actionCard: {
        height: 160,
        borderRadius: 24,
        padding: 16,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    xpBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    xpText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    cardFooter: {},
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
    },

    // Lesson Preview
    lessonPreviewCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginTop: 16,
    },
    lessonPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    lessonPreviewTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    lessonPreviewText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 16,
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 24,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    modalContent: {
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalDescription: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 24,
        lineHeight: 22,
    },
});

export default SubchapterScreen;
