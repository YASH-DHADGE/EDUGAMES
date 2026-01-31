import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Button } from 'react-native-paper';
import ScreenBackground from '../components/ScreenBackground';
import { theme, spacing, borderRadius, shadows } from '../theme';
import { fetchClassroomsList, ClassroomListItem } from '../services/studentService';
import Animated, { FadeInDown } from 'react-native-reanimated';

const ClassroomListScreen = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [classrooms, setClassrooms] = useState<ClassroomListItem[]>([]);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classroomCode, setClassroomCode] = useState('');
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        loadClassrooms();
    }, []);

    const loadClassrooms = async () => {
        try {
            const data = await fetchClassroomsList();
            setClassrooms(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClassroom = async () => {
        if (!classroomCode.trim()) {
            Alert.alert('Error', 'Please enter a classroom code');
            return;
        }

        setJoining(true);
        try {
            // TODO: implement join classroom API call
            // await joinClassroom(classroomCode.trim());
            Alert.alert('Success', 'Joined classroom successfully!');
            setClassroomCode('');
            setShowJoinModal(false);
            await loadClassrooms();
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to join classroom');
        } finally {
            setJoining(false);
        }
    };

    const handleClassroomPress = (params: any) => {
        navigation.navigate('Classroom', params);
    };

    const renderClassCard = (item: ClassroomListItem, index: number) => {
        return (
            <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 100)}
                style={styles.cardContainer}
            >
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => handleClassroomPress({ subject: item.subject })}
                >
                    {/* Header Banner */}
                    <View style={[styles.cardHeader, { backgroundColor: '#' + item.startColor }]}>
                        <View style={styles.headerContent}>
                            <View style={styles.titleRow}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
                                <TouchableOpacity>
                                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.cardSubtitle} numberOfLines={1}>{item.className}</Text>
                            <Text style={styles.teacherName} numberOfLines={1}>{item.teacher}</Text>
                        </View>
                        <Image source={{ uri: item.teacherAvatar }} style={styles.teacherAvatar} />
                    </View>

                    {/* Body */}
                    <View style={styles.cardBody} />

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#5f6368" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <MaterialCommunityIcons name="folder-outline" size={24} color="#5f6368" />
                        </TouchableOpacity>
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
                    <Text style={styles.navTitle}>Google Classroom</Text>
                    <Image
                        source={{ uri: 'https://ui-avatars.com/api/?name=User&background=random' }}
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
                            <Image
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2997/2997255.png' }}
                                style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 16 }}
                            />
                            <Text style={styles.emptyText}>Don't see your existing classes?</Text>
                            <TouchableOpacity onPress={() => setShowJoinModal(true)}>
                                <Text style={styles.linkText}>Join with code</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {classrooms.map((item, index) => renderClassCard(item, index))}
                        </View>
                    )}
                </ScrollView>

                {/* FAB - Join Classroom */}
                <TouchableOpacity style={styles.fab} onPress={() => setShowJoinModal(true)}>
                    <MaterialCommunityIcons name="plus" size={24} color="#1967d2" />
                </TouchableOpacity>
            </View>

            {/* Join Classroom Modal */}
            <Modal
                visible={showJoinModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowJoinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Join Classroom</Text>
                            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#5f6368" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Ask your teacher for the class code, then enter it here.
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Classroom Code"
                            value={classroomCode}
                            onChangeText={setClassroomCode}
                            placeholder="e.g. ABC123"
                            autoCapitalize="characters"
                            maxLength={8}
                            style={styles.input}
                        />

                        <View style={styles.modalActions}>
                            <Button
                                mode="text"
                                onPress={() => setShowJoinModal(false)}
                                textColor="#5f6368"
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleJoinClassroom}
                                loading={joining}
                                disabled={!classroomCode.trim() || joining}
                                buttonColor="#1967d2"
                            >
                                Join
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenBackground>
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
        height: 290,
    },
    cardHeader: {
        height: 100,
        padding: 16,
        position: 'relative',
    },
    headerContent: {
        marginRight: 40,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '400',
        color: '#fff',
        marginBottom: 4,
        flex: 1,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 20,
    },
    teacherName: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.9,
    },
    teacherAvatar: {
        position: 'absolute',
        right: 16,
        top: 70,
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 0,
    },
    cardBody: {
        flex: 1,
        backgroundColor: '#fff',
    },
    cardFooter: {
        height: 50,
        borderTopWidth: 1,
        borderTopColor: '#dadce0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 8,
    },
    iconButton: {
        padding: 10,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#5f6368',
        marginBottom: 8,
    },
    linkText: {
        color: '#1967d2',
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#202124',
    },
    modalDescription: {
        fontSize: 14,
        color: '#5f6368',
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
});

export default ClassroomListScreen;
