import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Text, useTheme, IconButton, Surface } from 'react-native-paper';
import Markdown, { RenderRules } from 'react-native-markdown-display';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import XPToast from '../../components/learn/XPToast';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { progressService } from '../../services/progressService';
import { learnService } from '../../services/learnService';
import { spacing } from '../../theme';
import ScreenBackground from '../../components/ScreenBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Matches CustomTabBar height + margin + padding
const BOTTOM_NAV_HEIGHT = Platform.OS === 'android' ? 100 : 90;

const LessonReaderScreen = ({ route, navigation }: any) => {
    // Now accepts subchapterId directly for self-fetching
    const { title: initialTitle, content: initialContent, xpReward = 10, chapterId, subjectId, classId, subchapterId } = route.params;

    const theme = useTheme();
    const { isDark } = useAppTheme();
    const { addXP } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [title, setTitle] = useState(initialTitle || 'Lesson');
    const [content, setContent] = useState(initialContent || '');
    const [loading, setLoading] = useState(!initialContent && !!subchapterId);
    const [completed, setCompleted] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const isLargeScreen = width > 768; // Tablet/Desktop breakpoint
    const styles = createStyles(isDark, isLargeScreen);
    const mdStyles = createMarkdownStyles(isDark);

    useEffect(() => {
        if (!initialContent && subchapterId) {
            loadContentAndProgress(subchapterId);
        } else if (subchapterId) {
            checkProgress(subchapterId);
        }
    }, [subchapterId, initialContent]);

    const loadContentAndProgress = async (id: string) => {
        try {
            setLoading(true);
            const [data, progress] = await Promise.all([
                learnService.getSubchapter(id),
                progressService.getChapterProgress(id)
            ]);

            setTitle(data.name);
            setContent(data.lessonContent || '# No content available');

            if (progress?.completed) {
                setCompleted(true);
            }
        } catch (error) {
            console.error('Failed to load lesson:', error);
            setContent('# Error loading content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const checkProgress = async (id: string) => {
        try {
            const progress = await progressService.getChapterProgress(id);
            if (progress?.completed) {
                setCompleted(true);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const rules: RenderRules = {
        image: (node, children, parent, styles) => {
            const { src, alt } = node.attributes;
            return (
                <Image
                    key={node.key}
                    style={{
                        width: '100%',
                        height: 200,
                        resizeMode: 'contain',
                        borderRadius: 12,
                        marginVertical: 10,
                        backgroundColor: isDark ? '#1E293B' : '#F5F5F7',
                    }}
                    source={{ uri: src }}
                    accessibilityLabel={alt}
                />
            );
        },
    };

    const handleComplete = async () => {
        if (!completed) {
            addXP(xpReward, 'lesson_complete');
            setCompleted(true);
            setShowToast(true);

            if (subchapterId) {
                await progressService.updateProgress(subchapterId, { completed: true });
            }

            if (chapterId && subjectId && classId) {
                await progressService.markChapterComplete(chapterId, subjectId, classId);
            }

            // Optional: Auto-back or stay? 
            // Previous behavior was auto-back, but with bottom nav, user might just want to switch tabs.
            // Let's keep it manual or subtle.
            // keeping auto-back for flow continuity unless user wants to stay.
            // Actually, with the new UI, maybe we don't force back?
            // Let's keep the toast but remove auto-back to let them browse via dock.
        }
    };

    if (loading) {
        return (
            <ScreenBackground style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 20, color: isDark ? '#94A3B8' : '#64748B' }}>Loading Lesson...</Text>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground style={styles.container}>
            <XPToast
                visible={showToast}
                xp={xpReward}
                onHide={() => setShowToast(false)}
            />

            {/* Custom Header (Matching Home/Dashboard Style) */}
            <View style={[styles.header, { marginTop: insets.top }]}>
                {/* Back Button (Small, rounded) */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#fff' : '#333'} />
                </TouchableOpacity>

                {/* Title Badge style */}
                <View style={styles.headerTitleBadge}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#FF9A62" style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                {/* Spacer for balance */}
                <View style={{ width: 40 }} />
            </View>

            {/* Content Area */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInDown.duration(500)}>
                    <Surface style={styles.cardInfo} elevation={2}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.lessonTitle}>{title}</Text>
                        </View>

                        {/* Markdown Content */}
                        <View style={styles.markdownContainer}>
                            <Markdown style={mdStyles} rules={rules}>
                                {content}
                            </Markdown>
                        </View>

                        {/* Completion Section */}
                        {!completed && (
                            <TouchableOpacity
                                style={styles.completeButtonContainer}
                                onPress={handleComplete}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.completeButton}
                                >
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                    <Text style={styles.completeButtonText}>Complete Lesson</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {completed && (
                            <View style={styles.completedBanner}>
                                <MaterialCommunityIcons name="check-decagram" size={24} color="#10B981" />
                                <Text style={styles.completedText}>Lesson Completed!</Text>
                            </View>
                        )}

                    </Surface>
                </Animated.View>
            </ScrollView>

        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isLargeScreen: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.xs,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    headerTitleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: isDark ? '#F1F5F9' : '#334155',
        maxWidth: 200,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: isLargeScreen ? spacing.xxl : spacing.md,
        paddingBottom: BOTTOM_NAV_HEIGHT + spacing.xl,
        alignItems: isLargeScreen ? 'center' : 'stretch',
    },
    cardInfo: {
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderRadius: 20, // Rounded 20
        padding: 0, // Reset padding
        width: isLargeScreen ? 800 : '100%',
        marginBottom: spacing.lg,
        // Premium Shadows (simCardPremium)
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 24, // Inner padding
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#334155' : '#F1F5F9',
    },
    lessonTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: isDark ? '#F8FAFC' : '#1E293B',
        lineHeight: 32,
        marginBottom: 8,
    },
    markdownContainer: {
        padding: 24, // Inner padding
        paddingTop: 8,
        marginBottom: spacing.md,
    },

    // Button Styles
    completeButtonContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: spacing.md,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    completedBanner: {
        marginTop: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
        borderRadius: 16,
        gap: 10,
    },
    completedText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '700',
    },
});

const createMarkdownStyles = (isDark: boolean) => ({
    body: {
        fontSize: 16,
        lineHeight: 28,
        color: isDark ? '#CBD5E1' : '#334155',
        fontFamily: 'System',
    },
    heading1: {
        fontSize: 26,
        fontWeight: '800' as const,
        color: isDark ? '#F1F5F9' : '#0F172A',
        marginBottom: 16,
        marginTop: 24,
        lineHeight: 34,
    },
    heading2: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: isDark ? '#F1F5F9' : '#1E293B',
        marginBottom: 14,
        marginTop: 20,
        lineHeight: 30,
    },
    heading3: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: isDark ? '#E2E8F0' : '#334155',
        marginBottom: 12,
        marginTop: 16,
        lineHeight: 26,
    },
    paragraph: {
        marginBottom: 20,
        lineHeight: 28,
    },
    list_item: {
        marginBottom: 10,
        paddingLeft: 8,
    },
    strong: {
        fontWeight: '700' as const,
        color: isDark ? '#F1F5F9' : '#0F172A',
    },
    em: {
        fontStyle: 'italic' as const,
        color: isDark ? '#94A3B8' : '#64748B',
    },
    code_inline: {
        backgroundColor: isDark ? '#334155' : '#F1F5F9',
        color: '#6366F1',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 15,
        fontFamily: 'monospace',
    },
    code_block: {
        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginVertical: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#6366F1',
    },
    blockquote: {
        backgroundColor: isDark ? '#1E293B' : '#FFF7ED',
        borderLeftWidth: 4,
        borderLeftColor: '#F97316',
        paddingLeft: 16,
        paddingVertical: 12,
        marginVertical: 12,
        borderRadius: 8,
    },
});

export default LessonReaderScreen;
