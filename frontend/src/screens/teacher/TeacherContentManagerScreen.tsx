import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput, ActivityIndicator, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display'; // Import Markdown Renderer
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import CompactHeader from '../../components/ui/CompactHeader';
import ScreenBackground from '../../components/ScreenBackground';

const TeacherContentManagerScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark, theme } = useAppTheme();
    const { isDesktop, maxContentWidth } = useResponsive();

    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Chapter Details
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedClass, setSelectedClass] = useState('6');
    const [subject, setSubject] = useState('Math');

    // Editor State
    const [isPreview, setIsPreview] = useState(false);
    // Selection Tracking for Toolbar
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const handleSubmit = async () => {
        if (!title || !content || !subject || !selectedClass) {
            Alert.alert('Error', 'Please fill in all details');
            return;
        }
        setLoading(true);
        try {
            await api.post('/teacher/chapter', {
                title,
                content,
                classNumber: selectedClass,
                subject
            });
            setSuccessMessage('Content Created Successfully!');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Failed to create chapter:', error);
            Alert.alert('Error', 'Failed to create chapter');
        } finally {
            setLoading(false);
        }
    };

    const handleFormat = (type: 'bold' | 'italic' | 'h1' | 'h2' | 'list' | 'code') => {
        let prefix = '';
        let suffix = '';
        let newContent = content;
        let newCursorPos = selection.end;

        const selectedText = content.substring(selection.start, selection.end);

        switch (type) {
            case 'bold':
                prefix = '**';
                suffix = '**';
                break;
            case 'italic':
                prefix = '*';
                suffix = '*';
                break;
            case 'code':
                prefix = '`';
                suffix = '`';
                break;
            case 'h1':
                prefix = '# ';
                break;
            case 'h2':
                prefix = '## ';
                break;
            case 'list':
                prefix = '- ';
                break;
        }

        if (selectedText) {
            // Wrap selected text
            const before = content.substring(0, selection.start);
            const after = content.substring(selection.end);
            newContent = `${before}${prefix}${selectedText}${suffix}${after}`;
            newCursorPos = selection.end + prefix.length + suffix.length;
        } else {
            // Insert at cursor
            const before = content.substring(0, selection.start);
            const after = content.substring(selection.start);
            newContent = `${before}${prefix}${suffix}${after}`;
            newCursorPos = selection.start + prefix.length;
        }

        setContent(newContent);
    };

    return (
        <ScreenBackground>
            <CompactHeader
                title="Create Content"
                subtitle="Build learning materials"
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 100 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    entering={FadeInDown.duration(600).springify()}
                    style={[
                        styles.formContainer,
                        isDesktop && {
                            maxWidth: 1000,
                            alignSelf: 'center',
                            width: '100%',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                        }
                    ]}
                >

                    {/* LEFT COLUMN: Details */}
                    <View style={[isDesktop ? { flex: 0.4, marginRight: 24 } : { width: '100%' }]}>
                        <Surface style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]} elevation={2}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: '#4F46E5' }]}>
                                    <MaterialCommunityIcons name="book-open-variant" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#1E293B' }]}>Chapter Details</Text>
                                    <Text style={styles.cardSubtitle}>Basic info</Text>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                                    Title <Text style={{ color: '#EF4444' }}>*</Text>
                                </Text>
                                <TextInput
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="e.g. Algebra Basics"
                                    style={[styles.textInput, { backgroundColor: isDark ? '#334155' : '#fff' }]}
                                    mode="outlined"
                                    outlineColor={isDark ? '#475569' : '#E2E8F0'}
                                    activeOutlineColor="#4F46E5"
                                    textColor={isDark ? '#fff' : '#1E293B'}
                                    placeholderTextColor={isDark ? '#94A3B8' : '#94A3B8'}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>Class</Text>
                                <View style={styles.chipRow}>
                                    {['6', '7', '8', '9', '10'].map(c => (
                                        <TouchableOpacity
                                            key={c}
                                            style={[
                                                styles.chip,
                                                selectedClass === c && styles.chipActive,
                                                {
                                                    backgroundColor: selectedClass === c
                                                        ? '#4F46E5'
                                                        : (isDark ? '#334155' : '#F1F5F9'),
                                                    borderColor: selectedClass === c
                                                        ? '#4F46E5'
                                                        : (isDark ? '#475569' : '#E2E8F0')
                                                }
                                            ]}
                                            onPress={() => setSelectedClass(c)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                selectedClass === c && styles.chipTextActive,
                                                { color: selectedClass === c ? '#fff' : (isDark ? '#CBD5E1' : '#64748B') }
                                            ]}>
                                                Class {c}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: isDark ? '#CBD5E1' : '#334155' }]}>Subject</Text>
                                <View style={styles.chipRow}>
                                    {['Math', 'Science', 'English', 'Social'].map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.chip,
                                                subject === s && styles.chipActive,
                                                {
                                                    backgroundColor: subject === s
                                                        ? '#4F46E5'
                                                        : (isDark ? '#334155' : '#F1F5F9'),
                                                    borderColor: subject === s
                                                        ? '#4F46E5'
                                                        : (isDark ? '#475569' : '#E2E8F0')
                                                }
                                            ]}
                                            onPress={() => setSubject(s)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                subject === s && styles.chipTextActive,
                                                { color: subject === s ? '#fff' : (isDark ? '#CBD5E1' : '#64748B') }
                                            ]}>
                                                {s}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </Surface>
                    </View>

                    {/* RIGHT COLUMN: Content Editor */}
                    <View style={[isDesktop ? { flex: 0.6 } : { width: '100%', marginTop: 24 }]}>
                        <Surface style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]} elevation={2}>

                            {/* Toggle Header */}
                            <View style={[styles.editorHeader, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, !isPreview && styles.toggleBtnActive]}
                                        onPress={() => setIsPreview(false)}
                                    >
                                        <MaterialCommunityIcons
                                            name="pencil"
                                            size={16}
                                            color={!isPreview ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B')}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[
                                            styles.toggleText,
                                            !isPreview && styles.toggleTextActive,
                                            { color: !isPreview ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B') }
                                        ]}>
                                            Write
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleBtn, isPreview && styles.toggleBtnActive]}
                                        onPress={() => setIsPreview(true)}
                                    >
                                        <MaterialCommunityIcons
                                            name="eye"
                                            size={16}
                                            color={isPreview ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B')}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[
                                            styles.toggleText,
                                            isPreview && styles.toggleTextActive,
                                            { color: isPreview ? '#4F46E5' : (isDark ? '#94A3B8' : '#64748B') }
                                        ]}>
                                            Preview
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Toolbar (Only in Write Mode) */}
                            {!isPreview && (
                                <View style={[styles.toolbar, { borderBottomColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                    <TouchableOpacity onPress={() => handleFormat('bold')} style={styles.toolBtn}>
                                        <MaterialCommunityIcons name="format-bold" size={22} color={isDark ? '#CBD5E1' : '#475569'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormat('italic')} style={styles.toolBtn}>
                                        <MaterialCommunityIcons name="format-italic" size={22} color={isDark ? '#CBD5E1' : '#475569'} />
                                    </TouchableOpacity>
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
                                    <TouchableOpacity onPress={() => handleFormat('h1')} style={styles.toolBtn}>
                                        <MaterialCommunityIcons name="format-header-1" size={22} color={isDark ? '#CBD5E1' : '#475569'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormat('h2')} style={styles.toolBtn}>
                                        <MaterialCommunityIcons name="format-header-2" size={22} color={isDark ? '#CBD5E1' : '#475569'} />
                                    </TouchableOpacity>
                                    <View style={[styles.divider, { backgroundColor: isDark ? '#475569' : '#CBD5E1' }]} />
                                    <TouchableOpacity onPress={() => handleFormat('list')} style={styles.toolBtn}>
                                        <MaterialCommunityIcons name="format-list-bulleted" size={22} color={isDark ? '#CBD5E1' : '#475569'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormat('code')} style={styles.toolBtn}>
                                        <MaterialIcons name="code" size={22} color={isDark ? '#CBD5E1' : '#475569'} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Editor OR Preview */}
                            <View style={[styles.editorBody, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                                {isPreview ? (
                                    <ScrollView style={styles.previewScroll} contentContainerStyle={{ padding: 16 }}>
                                        <Markdown
                                            style={{
                                                body: { color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 16 },
                                                heading1: { color: isDark ? '#fff' : '#1E293B', fontWeight: 'bold' },
                                                heading2: { color: isDark ? '#fff' : '#1E293B', fontWeight: 'bold' },
                                                code_inline: { backgroundColor: isDark ? '#334155' : '#F1F5F9', color: '#EF4444' },
                                                item_list: { color: isDark ? '#E2E8F0' : '#1E293B' },
                                                text: { color: isDark ? '#E2E8F0' : '#1E293B' },
                                            }}
                                        >
                                            {content || '*No content to preview*'}
                                        </Markdown>
                                    </ScrollView>
                                ) : (
                                    <TextInput
                                        value={content}
                                        onChangeText={setContent}
                                        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                                        placeholder="Start writing content..."
                                        multiline
                                        numberOfLines={20}
                                        style={[styles.contentInput, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}
                                        textColor={isDark ? '#E2E8F0' : '#1E293B'}
                                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                                        underlineColor="transparent"
                                        activeUnderlineColor="transparent"
                                        selectionColor="#4F46E5"
                                    />
                                )}
                            </View>

                            <View style={[styles.footerBar, { borderTopColor: isDark ? '#334155' : '#E2E8F0' }]}>
                                <Text style={[styles.charCountText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                                    {content.length} characters
                                </Text>
                                <MaterialCommunityIcons name="language-markdown" size={20} color={isDark ? '#64748B' : '#94A3B8'} />
                            </View>
                        </Surface>

                        {/* Submit Button */}
                        <View style={styles.submitSection}>
                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#4F46E5', '#7C3AED']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.submitGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.submitText}>Publish Chapter</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                </Animated.View>
            </ScrollView>

            <SuccessModal
                visible={showSuccessModal}
                title="Chapter Published!"
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
        paddingTop: 24,
        paddingHorizontal: 16,
    },
    formContainer: {
        // Flex handled inline
    },
    card: {
        borderRadius: 16,
        paddingHorizontal: 0,
        paddingVertical: 0,
        marginBottom: 20,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    inputContainer: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textInput: {
        fontSize: 15,
        height: 50,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
    },
    chipActive: {
        // Handled inline
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Editor Styles
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderBottomWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 4,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#fff',
        elevation: 1,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    toggleTextActive: {
        fontWeight: 'bold',
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        gap: 4,
    },
    toolBtn: {
        padding: 8,
        borderRadius: 8,
    },
    divider: {
        width: 1,
        height: 20,
        marginHorizontal: 8,
    },
    editorBody: {
        minHeight: 350,
    },
    contentInput: {
        minHeight: 350,
        textAlignVertical: 'top',
        fontSize: 15,
        lineHeight: 24,
        fontFamily: 'monospace', // Better for markdown editing
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    previewScroll: {
        height: 350,
    },
    footerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
    },
    charCountText: {
        fontSize: 12,
    },

    submitSection: {
        marginTop: 8,
        marginBottom: 40,
    },
    submitButton: {
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default TeacherContentManagerScreen;
