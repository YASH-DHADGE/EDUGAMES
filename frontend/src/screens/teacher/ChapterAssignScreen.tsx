import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Checkbox, Surface, Chip, ActivityIndicator, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { colors, gradients, spacing, shadows, borderRadius } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SuccessModal from '../../components/ui/SuccessModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChapterAssignScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [assignType, setAssignType] = useState<'chapter' | 'quiz' | 'customChapter'>('chapter');

    // Selection Data
    const [chapters, setChapters] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [customChapters, setCustomChapters] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // Selected Items
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectAllClass, setSelectAllClass] = useState<boolean>(false);

    // Filters
    const [classFilter, setClassFilter] = useState('7');

    useEffect(() => {
        fetchData();
    }, [classFilter, assignType]);

    const fetchData = async () => {
        setDataLoading(true);
        setSelectedItem(null); // Reset selection on filter change
        setSelectAllClass(false);
        setSelectedStudents([]);

        try {
            // Fetch students for the class using new endpoint
            const studentsRes = await api.get(`/teacher/students/class/${classFilter}`);
            setStudents(studentsRes.data);

            if (assignType === 'chapter') {
                const chaptersRes = await api.get(`/teacher/chapters?class=${classFilter}`);
                setChapters(chaptersRes.data);
            } else if (assignType === 'quiz') {
                const quizzesRes = await api.get('/teacher/content'); // Assuming this returns all, filtering might be needed
                setQuizzes(quizzesRes.data.filter((q: any) => q.type === 'quiz' && q.classNumber === parseInt(classFilter)));
            } else {
                const customRes = await api.get('/teacher/content');
                setCustomChapters(customRes.data.filter((c: any) => c.type === 'teacherChapter' && c.classNumber === parseInt(classFilter)));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Alert.alert('Error', 'Failed to load data.'); // Optional: Don't spam alerts on load
        } finally {
            setDataLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedItem) {
            Alert.alert('Selection Missing', `Please select a ${assignType === 'chapter' ? 'Syllabus Chapter' : assignType === 'quiz' ? 'Quiz' : 'Custom Chapter'} to assign.`);
            return;
        }
        if (selectedStudents.length === 0 && !selectAllClass) {
            Alert.alert('Selection Missing', 'Please select at least one student or the whole class.');
            return;
        }

        setLoading(true);
        try {
            let endpoint = '';
            let payload: any = {
                studentIds: selectAllClass ? [] : selectedStudents,
                classNumber: selectAllClass ? classFilter : undefined
            };

            if (assignType === 'chapter') {
                endpoint = '/teacher/assign-chapter';
                payload.chapterId = selectedItem;
            } else if (assignType === 'quiz') {
                endpoint = '/teacher/assign-quiz';
                payload.quizId = selectedItem;
            } else {
                endpoint = '/teacher/assign-custom-chapter';
                payload.chapterId = selectedItem;
            }

            await api.post(endpoint, payload);
            setSuccessMessage(`Work assigned to ${selectAllClass ? `Class ${classFilter}` : `${selectedStudents.length} student(s)`} successfully!`);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Failed to assign:', error);
            Alert.alert('Error', 'Failed to assign work. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (id: string) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(s => s !== id));
            setSelectAllClass(false); // If unselecting one, select all is false
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const handleSelectAllToggle = () => {
        if (selectAllClass) {
            setSelectAllClass(false);
            setSelectedStudents([]);
        } else {
            setSelectAllClass(true);
            setSelectedStudents(students.map(s => s._id));
        }
    };

    const styles = createStyles(colors, insets);

    const getItems = () => {
        if (assignType === 'chapter') return chapters;
        if (assignType === 'quiz') return quizzes;
        return customChapters;
    };

    const renderItem = (item: any) => {
        const isSelected = selectedItem === item._id;
        return (
            <TouchableOpacity
                key={item._id}
                style={[styles.itemCard, isSelected && styles.itemCardActive]}
                onPress={() => setSelectedItem(item._id)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.primary + '15' }]}>
                    <MaterialCommunityIcons
                        name={assignType === 'quiz' ? 'clipboard-text-outline' : 'book-open-page-variant-outline'}
                        size={24}
                        color={isSelected ? '#fff' : colors.primary}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, isSelected && styles.textLight]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={[styles.itemSub, isSelected ? styles.textLight : styles.textSecondary]} numberOfLines={1}>
                        {item.subject} • {assignType === 'chapter' ? `Ch ${item.index || '?'}` : 'Quiz'}
                    </Text>
                </View>
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={colors.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={gradients.primary}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Assign Work</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Type Selector Tabs */}
                <View style={styles.tabContainer}>
                    {[{ id: 'chapter', label: 'Syllabus' }, { id: 'customChapter', label: 'My Chapters' }, { id: 'quiz', label: 'Quizzes' }].map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, assignType === tab.id && styles.tabActive]}
                            onPress={() => setAssignType(tab.id as any)}
                        >
                            <Text style={[styles.tabText, assignType === tab.id && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                {/* Class Filter */}
                <View style={styles.filterSection}>
                    <Text style={styles.sectionLabel}>Select Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {['6', '7', '8', '9', '10'].map(c => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setClassFilter(c)}
                                style={[styles.classChip, classFilter === c && styles.classChipActive]}
                            >
                                <Text style={[styles.classChipText, classFilter === c && styles.classChipTextActive]}>
                                    Class {c}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>
                        Select {assignType === 'chapter' ? 'Chapter' : assignType === 'quiz' ? 'Quiz' : 'Topic'}
                    </Text>

                    {dataLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : getItems().length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsRow}>
                            {getItems().map(renderItem)}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="folder-open-outline" size={40} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>No content found for Class {classFilter}</Text>
                        </View>
                    )}
                </View>

                {/* Student Selection */}
                <View style={styles.section}>
                    <View style={styles.studentHeaderRow}>
                        <Text style={styles.sectionHeader}>Select Students</Text>
                        <TouchableOpacity onPress={handleSelectAllToggle} style={styles.selectAllBtn}>
                            <Text style={[styles.selectAllText, selectAllClass && { color: colors.primary }]}>
                                {selectAllClass ? 'Unselect All' : 'Select Whole Class'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {dataLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : students.length > 0 ? (
                        <View style={styles.studentGrid}>
                            {students.map((student, index) => {
                                const isSelected = selectedStudents.includes(student._id);
                                return (
                                    <Animated.View
                                        key={student._id}
                                        entering={FadeInDown.delay(index * 30).springify()}
                                        style={styles.studentWrapper}
                                    >
                                        <TouchableOpacity
                                            style={[styles.studentCard, isSelected && styles.studentCardActive]}
                                            onPress={() => toggleStudent(student._id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant }]}>
                                                <Text style={[styles.avatarText, isSelected && { color: '#fff' }]}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.studentName, isSelected && { color: colors.primary, fontWeight: '700' }]} numberOfLines={1}>
                                                {student.name}
                                            </Text>
                                            {isSelected && (
                                                <View style={styles.checkIcon}>
                                                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-group-outline" size={40} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>No students in Class {classFilter}</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Action */}
            <Surface style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]} elevation={4}>
                <Button
                    mode="contained"
                    onPress={handleAssign}
                    loading={loading}
                    disabled={loading || !selectedItem || (selectedStudents.length === 0 && !selectAllClass)}
                    style={styles.assignButton}
                    contentStyle={{ height: 50 }}
                    labelStyle={{ fontSize: 16, fontWeight: '700' }}
                >
                    Assign to {selectAllClass ? `Class ${classFilter}` : `${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                </Button>
            </Surface>

            <SuccessModal
                visible={showSuccessModal}
                title="Assignment Sent!"
                message={successMessage}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                }}
                buttonText="Done"
            />
        </View>
    );
};

const createStyles = (themeColors: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: themeColors.background,
    },
    header: {
        paddingTop: insets.top + spacing.md,
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: spacing.lg,
        borderRadius: 14,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#fff',
        ...shadows.sm,
    },
    tabText: {
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        fontSize: 13,
    },
    tabTextActive: {
        color: themeColors.primary,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.lg,
    },
    filterSection: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: themeColors.textSecondary,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    chipScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    classChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: themeColors.surface,
        borderWidth: 1,
        borderColor: themeColors.outlineVariant,
    },
    classChipActive: {
        backgroundColor: themeColors.primary,
        borderColor: themeColors.primary,
    },
    classChipText: {
        color: themeColors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    classChipTextActive: {
        color: '#fff',
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: themeColors.onSurface,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    itemsRow: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    itemCard: {
        width: 160,
        height: 110,
        backgroundColor: themeColors.surface,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: themeColors.outlineVariant,
        ...shadows.sm,
    },
    itemCardActive: {
        backgroundColor: themeColors.primary,
        borderColor: themeColors.primary,
        ...shadows.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: themeColors.onSurface,
        marginBottom: 2,
    },
    itemSub: {
        fontSize: 12,
        color: themeColors.textSecondary,
    },
    textLight: {
        color: '#fff',
    },
    textSecondary: {
        color: themeColors.textSecondary,
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: spacing.lg,
        marginBottom: spacing.md,
    },
    selectAllBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    selectAllText: {
        color: themeColors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    studentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    studentWrapper: {
        width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2, // 2 columns
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeColors.surface,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: themeColors.outlineVariant,
        gap: 10,
    },
    studentCardActive: {
        borderColor: themeColors.primary,
        backgroundColor: themeColors.primary + '10', // Light tint
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: themeColors.textSecondary,
    },
    studentName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: themeColors.onSurface,
    },
    checkIcon: {
        position: 'absolute',
        right: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: themeColors.surface,
        paddingTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: themeColors.outlineVariant,
    },
    assignButton: {
        borderRadius: 14,
        backgroundColor: themeColors.primary,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    emptyText: {
        marginTop: 8,
        color: themeColors.textSecondary,
        fontSize: 14,
    },
});

export default ChapterAssignScreen;
