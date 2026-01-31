import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Surface, ActivityIndicator, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import CustomDropdown from '../../components/ui/CustomDropdown';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

const TeacherSendNotificationScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Form state
    const [selectedStudent, setSelectedStudent] = useState('');
    const [audienceType, setAudienceType] = useState<'individual' | 'all' | 'filtered'>('all');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notificationType, setNotificationType] = useState('assignment');

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const styles = createStyles(isDark, isDesktop);
    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/teacher/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (audienceType === 'individual' && !selectedStudent) {
            Alert.alert('Error', 'Please select a student');
            return;
        }
        if (!title.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setSending(true);
        try {
            let payload: any = {
                title,
                message,
                type: notificationType,
                data: {}
            };

            if (audienceType === 'individual') {
                payload.recipientId = selectedStudent;
            } else if (audienceType === 'all') {
                payload.recipientId = 'all';
            } else {
                payload.recipientId = 'filtered';
                payload.filters = {};
                if (selectedClass) payload.filters.classLevel = parseInt(selectedClass);
                if (selectedCategory) payload.filters.learnerCategory = selectedCategory;
            }

            await api.post('/notifications/send', payload);

            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Failed to send notification:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'assignment': return '#3B82F6';
            case 'approval': return '#10B981';
            case 'reminder': return '#F59E0B';
            case 'system': return '#6366F1';
            default: return '#64748B';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'assignment': return 'clipboard-text-clock';
            case 'approval': return 'check-decagram';
            case 'reminder': return 'clock-alert';
            case 'system': return 'bell-ring';
            default: return 'bell';
        }
    };

    return (
        <ScreenBackground>
            <View style={{ flex: 1 }}>
                <CompactHeader
                    title="Send Notification"
                    subtitle="Broadcast updates to your class"
                    onBack={() => navigation.goBack()}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={[styles.contentContainer, isDesktop && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#4F46E5" />
                                </View>
                            ) : (
                                <Animated.View entering={FadeInDown.delay(100).duration(500)}>

                                    {/* Audience Card - High zIndex for Dropdown */}
                                    <Surface style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff', zIndex: 100 }]}>
                                        <View style={styles.cardHeader}>
                                            <MaterialCommunityIcons name="account-group-outline" size={24} color="#4F46E5" />
                                            <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#1F2937' }]}>AUDIENCE</Text>
                                        </View>

                                        {/* Audience Type Selection */}
                                        <View style={styles.audienceTypes}>
                                            <TouchableOpacity
                                                onPress={() => setAudienceType('all')}
                                                style={[styles.typeButton, audienceType === 'all' && styles.typeButtonActive, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                                            >
                                                <Text style={[styles.typeButtonText, audienceType === 'all' && styles.typeButtonTextActive, { color: isDark ? '#fff' : '#1F2937' }]}>All Students</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setAudienceType('filtered')}
                                                style={[styles.typeButton, audienceType === 'filtered' && styles.typeButtonActive, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                                            >
                                                <Text style={[styles.typeButtonText, audienceType === 'filtered' && styles.typeButtonTextActive, { color: isDark ? '#fff' : '#1F2937' }]}>Filtered Group</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setAudienceType('individual')}
                                                style={[styles.typeButton, audienceType === 'individual' && styles.typeButtonActive, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                                            >
                                                <Text style={[styles.typeButtonText, audienceType === 'individual' && styles.typeButtonTextActive, { color: isDark ? '#fff' : '#1F2937' }]}>Specific Student</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {audienceType === 'individual' && (
                                            <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 16 }}>
                                                <CustomDropdown
                                                    label="Select Student"
                                                    data={students.map(student => ({ label: student.name, value: student._id }))}
                                                    value={selectedStudent}
                                                    onSelect={setSelectedStudent}
                                                    placeholder="Choose a student..."
                                                    icon="account"
                                                />
                                            </Animated.View>
                                        )}

                                        {audienceType === 'filtered' && (
                                            <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 16, gap: 16 }}>
                                                {/* Higher zIndex for the top dropdown so it opens OVER the bottom one */}
                                                <View style={{ zIndex: 2000 }}>
                                                    <CustomDropdown
                                                        label="Filter by Class"
                                                        data={[
                                                            { label: 'Any Class', value: '' },
                                                            { label: 'Class 6', value: '6' },
                                                            { label: 'Class 7', value: '7' },
                                                            { label: 'Class 8', value: '8' },
                                                            { label: 'Class 9', value: '9' },
                                                            { label: 'Class 10', value: '10' },
                                                            { label: 'Class 11', value: '11' },
                                                            { label: 'Class 12', value: '12' },
                                                        ]}
                                                        value={selectedClass}
                                                        onSelect={setSelectedClass}
                                                        placeholder="Select Class..."
                                                        icon="school"
                                                    />
                                                </View>

                                                {/* Lower zIndex for the bottom dropdown */}
                                                <View style={{ zIndex: 1000 }}>
                                                    <CustomDropdown
                                                        label="Filter by Performance"
                                                        data={[
                                                            { label: 'Any Category', value: '' },
                                                            { label: 'Slow Learners (Needs Attention)', value: 'slow' },
                                                            { label: 'Fast Learners (Top Performers)', value: 'fast' },
                                                            { label: 'Neutral', value: 'neutral' },
                                                        ]}
                                                        value={selectedCategory}
                                                        onSelect={setSelectedCategory}
                                                        placeholder="Select Performance Category..."
                                                        icon="chart-timeline-variant"
                                                    />
                                                </View>
                                            </Animated.View>
                                        )}
                                    </Surface>

                                    {/* Type Card */}
                                    <Surface style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff', marginTop: 16 }]}>
                                        <View style={styles.cardHeader}>
                                            <MaterialCommunityIcons name="shape-outline" size={24} color="#4F46E5" />
                                            <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#1F2937' }]}>TYPE</Text>
                                        </View>

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScroll}>
                                            {['assignment', 'approval', 'reminder', 'system'].map((type) => (
                                                <TouchableOpacity
                                                    key={type}
                                                    onPress={() => setNotificationType(type)}
                                                    style={[
                                                        styles.typeChip,
                                                        notificationType === type
                                                            ? { backgroundColor: getTypeColor(type), borderColor: getTypeColor(type) }
                                                            : { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: 'transparent' }
                                                    ]}
                                                >
                                                    <MaterialCommunityIcons
                                                        name={getTypeIcon(type) as any}
                                                        size={18}
                                                        color={notificationType === type ? '#fff' : (isDark ? '#94A3B8' : '#64748B')}
                                                    />
                                                    <Text style={[
                                                        styles.typeText,
                                                        { color: notificationType === type ? '#fff' : (isDark ? '#94A3B8' : '#64748B') }
                                                    ]}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </Surface>

                                    {/* Content Card */}
                                    <Surface style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff', marginTop: 16 }]}>
                                        <View style={styles.cardHeader}>
                                            <MaterialCommunityIcons name="text-box-outline" size={24} color="#4F46E5" />
                                            <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#1F2937' }]}>CONTENT</Text>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#64748B' }]}>TITLE</Text>
                                            <TextInput
                                                mode="outlined"
                                                placeholder="e.g. Homework Deadline"
                                                value={title}
                                                onChangeText={setTitle}
                                                style={styles.input}
                                                outlineColor={isDark ? '#334155' : '#E2E8F0'}
                                                activeOutlineColor="#4F46E5"
                                                textColor={isDark ? '#F1F5F9' : '#1A1A1A'}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#64748B' }]}>MESSAGE</Text>
                                            <TextInput
                                                mode="outlined"
                                                placeholder="Write your message here..."
                                                value={message}
                                                onChangeText={setMessage}
                                                multiline
                                                numberOfLines={6}
                                                style={[styles.input, styles.textArea]}
                                                outlineColor={isDark ? '#334155' : '#E2E8F0'}
                                                activeOutlineColor="#4F46E5"
                                                textColor={isDark ? '#F1F5F9' : '#1A1A1A'}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff' }}
                                            />
                                        </View>
                                    </Surface>

                                    {/* Send Button */}
                                    <TouchableOpacity
                                        onPress={handleSend}
                                        disabled={sending}
                                        style={[styles.sendButton, { opacity: sending ? 0.7 : 1 }]}
                                    >
                                        {sending ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                                                <Text style={styles.sendButtonText}>Send Notification</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                </Animated.View>
                            )}
                            <View style={{ height: 40 }} />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <SuccessModal
                    visible={showSuccessModal}
                    title="Notification Sent!"
                    message="Your notification has been broadcast successfully."
                    onClose={() => {
                        setShowSuccessModal(false);
                        navigation.goBack();
                    }}
                    buttonText="Done"
                />
            </View>
        </ScreenBackground>
    );
};

const createStyles = (isDark: boolean, isDesktop: boolean) => StyleSheet.create({
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    audienceTypes: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 12,
        flexWrap: 'wrap',
    },
    typeButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    typeButtonActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    typeButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    typeButtonTextActive: {
        color: '#fff',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    typeScroll: {
        gap: 12,
        paddingVertical: 4,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        borderWidth: 1,
        gap: 8,
        marginRight: 10,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'transparent',
        fontSize: 15,
    },
    textArea: {
        minHeight: 120,
    },
    sendButton: {
        marginTop: 24,
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TeacherSendNotificationScreen;
