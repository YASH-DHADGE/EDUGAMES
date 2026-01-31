import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import { theme } from '../../theme';
import { fetchClassrooms, createClassroom, Classroom, deleteClassroom } from '../../services/teacherService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const TeacherClassroomListScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [classNumber, setClassNumber] = useState('');
    const [section, setSection] = useState('');
    const [room, setRoom] = useState('');
    const [autoEnroll, setAutoEnroll] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadClassrooms();
        }, [])
    );

    const loadClassrooms = async () => {
        try {
            const data = await fetchClassrooms();
            setClassrooms(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!title || !subject || !classNumber) {
            Alert.alert('Error', 'Please fill in Title, Subject and Class');
            return;
        }

        try {
            setCreating(true);
            await createClassroom({
                title,
                subject,
                classNumber: parseInt(classNumber),
                section,
                room,
                autoEnroll,
                gradient: getRandomGradient() // Assign random gradient
            });
            setModalVisible(false);
            resetForm();
            loadClassrooms(); // Refresh
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create classroom');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Classroom",
            "Are you sure? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteClassroom(id);
                            loadClassrooms();
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setTitle('');
        setSubject('');
        setClassNumber('');
        setSection('');
        setRoom('');
    };

    const getRandomGradient = () => {
        const gradients = [
            ['#6366F1', '#4F46E5'], // Violet
            ['#0EA5E9', '#0284C7'], // Sky
            ['#10B981', '#059669'], // Emerald
            ['#F59E0B', '#D97706'], // Amber
            ['#EC4899', '#BE185D'], // Rose
            ['#8B5CF6', '#7C3AED'], // Purple
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    };

    const renderClassCard = (item: Classroom, index: number) => {
        return (
            <Animated.View
                key={item._id}
                entering={FadeInDown.delay(index * 100)}
                style={styles.cardContainer}
            >
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('TeacherClassroom', { classroom: item })}
                    onLongPress={() => handleDelete(item._id)}
                >
                    <LinearGradient
                        colors={(item.gradient || ['#6366F1', '#4F46E5']) as any}
                        style={styles.cardHeader}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.titleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item._id)}>
                                <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>
                            {item.section ? `${item.classNumber}${item.section}` : `Class ${item.classNumber}`}
                            {item.room ? ` • Room ${item.room}` : ''}
                        </Text>
                        <Text style={styles.subjectName} numberOfLines={1}>{item.subject}</Text>
                    </LinearGradient>

                    <View style={styles.cardBody}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Students</Text>
                            <Text style={styles.statValue}>{item.students?.length || 0}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <ScreenBackground style={styles.container}>
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                {/* Navbar */}
                <View style={styles.navBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#5f6368" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>My Classrooms</Text>
                    <Image
                        source={{ uri: 'https://ui-avatars.com/api/?name=Teacher&background=random' }}
                        style={styles.userAvatar}
                    />
                </View>

                {/* Content */}
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                    ) : classrooms.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="google-classroom" size={80} color="rgba(255,255,255,0.5)" style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyText, { color: 'rgba(255,255,255,0.8)' }]}>No classrooms yet</Text>
                            <Text style={[styles.emptySubText, { color: 'rgba(255,255,255,0.6)' }]}>Create a class to get started</Text>
                        </View>

                    ) : (
                        <View style={styles.grid}>
                            {classrooms.map((item, index) => renderClassCard(item, index))}
                        </View>
                    )}
                </ScrollView>

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Create Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Create Classroom</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Class Name (e.g. 10th Grade Math)"
                                value={title}
                                onChangeText={setTitle}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Subject"
                                value={subject}
                                onChangeText={setSubject}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Class Number (e.g. 10)"
                                value={classNumber}
                                onChangeText={setClassNumber}
                                keyboardType="numeric"
                            />
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                                    placeholder="Section (opt)"
                                    value={section}
                                    onChangeText={setSection}
                                />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Room (opt)"
                                    value={room}
                                    onChangeText={setRoom}
                                />
                            </View>

                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setAutoEnroll(!autoEnroll)}
                                >
                                    <View style={[styles.checkboxInner, autoEnroll && styles.checkboxChecked]}>
                                        {autoEnroll && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                                <Pressable onPress={() => setAutoEnroll(!autoEnroll)}>
                                    <View>
                                        <Text style={styles.checkboxLabel}>Auto-enroll students from Class {classNumber || '...'}</Text>
                                        <Text style={styles.checkboxSubLabel}>Adds all existing students of this class</Text>
                                    </View>
                                </Pressable>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCreate} style={styles.createBtn} disabled={creating}>
                                    {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View >
        </ScreenBackground >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    navButton: {
        padding: 4,
    },
    navTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#5f6368',
        marginLeft: 16,
        flex: 1,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    listContent: {
        padding: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 360,
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#dadce0',
        overflow: 'hidden',
        height: 160,
        elevation: 2,
    },
    cardHeader: {
        height: 100,
        padding: 16,
        position: 'relative',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 4,
        flex: 1,
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
    },
    subjectName: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        position: 'absolute',
        bottom: 12,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    cardBody: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        justifyContent: 'center'
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    statLabel: {
        color: '#5f6368',
        fontSize: 14
    },
    statValue: {
        color: '#3c4043',
        fontWeight: '500'
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#5f6368',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#5f6368',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1967d2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '500',
        marginBottom: 24,
        color: '#202124',
    },
    input: {
        borderWidth: 1,
        borderColor: '#dadce0',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
        marginTop: 16,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelText: {
        color: '#5f6368',
        fontSize: 14,
        fontWeight: '500',
    },
    createBtn: {
        backgroundColor: '#1a73e8',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    createText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
        marginTop: 8,
    },
    checkbox: {
        marginRight: 12,
        marginTop: 2,
    },
    checkboxInner: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#5f6368',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#1a73e8',
        borderColor: '#1a73e8',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#202124',
        fontWeight: '500',
    },
    checkboxSubLabel: {
        fontSize: 12,
        color: '#5f6368',
        marginTop: 2,
    },
});

export default TeacherClassroomListScreen;
