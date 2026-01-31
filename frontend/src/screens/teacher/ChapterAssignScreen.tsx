import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, ActivityIndicator, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { colors, spacing, shadows } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SuccessModal from '../../components/ui/SuccessModal';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

const ChapterAssignScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();

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
        setSelectedItem(null);
        setSelectAllClass(false);
        setSelectedStudents([]);

        try {
            const studentsRes = await api.get(`/teacher/students/class/${classFilter}`);
            setStudents(studentsRes.data);

            if (assignType === 'chapter') {
                const chaptersRes = await api.get(`/teacher/chapters?class=${classFilter}`);
                setChapters(chaptersRes.data);
            } else if (assignType === 'quiz') {
                const quizzesRes = await api.get('/teacher/content');
                setQuizzes(quizzesRes.data.filter((q: any) => q.type === 'quiz' && q.classNumber === parseInt(classFilter)));
            } else {
                const customRes = await api.get('/teacher/content');
                setCustomChapters(customRes.data.filter((c: any) => c.type === 'teacherChapter' && c.classNumber === parseInt(classFilter)));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
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
            setSelectAllClass(false);
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
                style={[
                    styles.itemCard,
                    {
                        backgroundColor: isDark ? '#1E293B' : '#fff',
                        borderColor: isSelected ? '#4F46E5' : (isDark ? '#334155' : '#E5E7EB')
                    },
                    isSelected && styles.itemCardActive
                ]}
                onPress={() => setSelectedItem(item._id)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.2)' : (isDark ? '#334155' : '#EEF2FF') }]}>
                    <MaterialCommunityIcons
                        name={assignType === 'quiz' ? 'clipboard-text-outline' : 'book-open-page-variant-outline'}
                        size={24}
                        color={isSelected ? '#4F46E5' : (isDark ? '#94A3B8' : '#4F46E5')}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: isDark ? '#fff' : '#1F2937' }]} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={[styles.itemSub, { color: isDark ? '#94A3B8' : '#6B7280' }]} numberOfLines={1}>
                        {item.subject} • {assignType === 'chapter' ? `Ch ${item.index || '?'}` : 'Quiz'}
                    </Text>
                </View>
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenBackground>
            <CompactHeader
                title="Assign Work"
                subtitle="Distribute content to students"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && { maxWidth: 900, alignSelf: 'center', width: '100%' }]} showsVerticalScrollIndicator={false}>

                {/* 1. Type Selection Tabs */}
                <View style={styles.tabsWrapper}>
                    <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                        {[{ id: 'chapter', label: 'Syllabus' }, { id: 'customChapter', label: 'My Chapters' }, { id: 'quiz', label: 'Quizzes' }].map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, assignType === tab.id && styles.tabActive]}
                                onPress={() => setAssignType(tab.id as any)}
                            >
                                <Text style={[styles.tabText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B' }, assignType === tab.id && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* 2. Class Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>SELECT CLASS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                        {['6', '7', '8', '9', '10'].map(c => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setClassFilter(c)}
                                style={[
                                    styles.classChip,
                                    classFilter === c && styles.classChipActive,
                                    {
                                        backgroundColor: classFilter === c ? '#4F46E5' : (isDark ? '#1E293B' : '#fff'),
                                        borderColor: classFilter === c ? '#4F46E5' : (isDark ? '#334155' : '#E5E7EB')
                                    }
                                ]}
                            >
                                <Text style={[styles.classChipText, classFilter === c && { color: '#fff' }, { color: classFilter === c ? '#fff' : (isDark ? '#CBD5E1' : '#475569') }]}>
                                    Class {c}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 3. Content Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                        SELECT {assignType === 'chapter' ? 'CHAPTER' : assignType === 'quiz' ? 'QUIZ' : 'TOPIC'}
                    </Text>

                    {dataLoading ? (
                        <ActivityIndicator size="small" color="#4F46E5" style={{ padding: 20 }} />
                    ) : getItems().length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsRow}>
                            {getItems().map(renderItem)}
                        </ScrollView>
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}>
                            <MaterialCommunityIcons name="folder-open-outline" size={32} color={isDark ? '#475569' : '#9CA3AF'} />
                            <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>No content found</Text>
                        </View>
                    )}
                </View>

                {/* 4. Student Selection */}
                <View style={styles.section}>
                    <View style={styles.studentHeaderRow}>
                        <Text style={[styles.sectionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>SELECT STUDENTS</Text>
                        <TouchableOpacity onPress={handleSelectAllToggle}>
                            <Text style={[styles.selectAllText, { color: selectAllClass ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B') }]}>
                                {selectAllClass ? 'Unselect All' : 'Select Whole Class'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {dataLoading ? (
                        <ActivityIndicator size="small" color="#4F46E5" style={{ padding: 20 }} />
                    ) : students.length > 0 ? (
                        <View style={styles.studentGrid}>
                            {students.map((student, index) => {
                                const isSelected = selectedStudents.includes(student._id);
                                return (
                                    <TouchableOpacity
                                        key={student._id}
                                        style={[
                                            styles.studentCard,
                                            isDesktop ? { width: '31%' } : { width: '48%' },
                                            {
                                                borderColor: isSelected ? '#4F46E5' : (isDark ? '#334155' : '#E5E7EB'),
                                                backgroundColor: isSelected ? (isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF') : (isDark ? '#1E293B' : '#fff')
                                            }
                                        ]}
                                        onPress={() => toggleStudent(student._id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.avatarBox, { backgroundColor: isSelected ? '#4F46E5' : (isDark ? '#334155' : '#F1F5F9') }]}>
                                            <Text style={[styles.avatarText, { color: isSelected ? '#fff' : (isDark ? '#CBD5E1' : '#64748B') }]}>
                                                {student.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.studentName, { color: isDark ? '#fff' : '#1F2937' }, isSelected && { color: '#4F46E5', fontWeight: 'bold' }]} numberOfLines={1}>
                                            {student.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}>
                            <MaterialCommunityIcons name="account-off-outline" size={32} color={isDark ? '#475569' : '#9CA3AF'} />
                            <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B' }]}>No students found</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <View style={[styles.bottomBar, { backgroundColor: isDark ? '#1E293B' : '#fff', borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <View style={[styles.bottomBarContent, isDesktop && { maxWidth: 900, width: '100%', alignSelf: 'center' }]}>
                    <View>
                        <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '600' }}>ASSIGNING TO</Text>
                        <Text style={{ color: isDark ? '#fff' : '#1F2937', fontSize: 15, fontWeight: 'bold' }}>
                            {selectAllClass ? `Class ${classFilter}` : `${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleAssign}
                        loading={loading}
                        disabled={loading || !selectedItem || (selectedStudents.length === 0 && !selectAllClass)}
                        style={styles.assignButton}
                        labelStyle={{ fontSize: 15, fontWeight: 'bold' }}
                    >
                        Assign Work
                    </Button>
                </View>
            </View>

            <SuccessModal
                visible={showSuccessModal}
                title="Assignment Sent!"
                message={successMessage}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                }}
                buttonText="Back to Dashboard"
            />
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 20,
    },
    tabsWrapper: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#4F46E5',
    },
    section: {
        marginBottom: 28,
        paddingHorizontal: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    chipScroll: {
        gap: 8,
    },
    classChip: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    classChipActive: {
        // handled inline
    },
    classChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    itemsRow: {
        gap: 12,
        paddingRight: 20,
    },
    itemCard: {
        width: 150,
        height: 110,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    itemCardActive: {
        borderWidth: 2,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
        marginTop: 8,
    },
    itemSub: {
        fontSize: 11,
        marginTop: 2,
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#4F46E5',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Student Grid
    studentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    selectAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    studentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 10,
    },
    avatarBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '700',
    },
    studentName: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    emptyState: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        elevation: 20,
    },
    bottomBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    assignButton: {
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        paddingHorizontal: 20,
    },
});

export default ChapterAssignScreen;
