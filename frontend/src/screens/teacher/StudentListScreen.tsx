import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/ui/GradientBackground';
import CustomCard from '../../components/ui/CustomCard';
import CustomInput from '../../components/ui/CustomInput';
import api from '../../services/api';

const StudentListScreen = () => {
    const navigation = useNavigation();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/teacher/students');
            setStudents(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Student',
            'Are you sure you want to delete this student?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/teacher/student/${id}`);
                            fetchStudents();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete student');
                        }
                    },
                },
            ]
        );
    };

    const filteredStudents = students.filter((student: any) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <CustomCard style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.grade}>Class {item.selectedClass}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'active' ? '#059669' : '#DC2626' }]}>
                        {item.status?.toUpperCase() || 'ACTIVE'}
                    </Text>
                </View>
            </View>
            {item.learnerCategory && item.learnerCategory !== 'neutral' && (
                <View style={[
                    styles.statusBadge,
                    { marginLeft: 8, backgroundColor: item.learnerCategory === 'fast' ? '#E0E7FF' : '#FFEDD5' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: item.learnerCategory === 'fast' ? '#4F46E5' : '#EA580C' }
                    ]}>
                        {item.learnerCategory.toUpperCase()} LEARNER
                    </Text>
                </View>
            )}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.analyticsButton]}
                    onPress={() => (navigation as any).navigate('StudentAnalytics', { studentId: item._id, studentName: item.name })}
                >
                    <Ionicons name="stats-chart" size={20} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => (navigation as any).navigate('EditStudent', { student: item })}
                >
                    <Ionicons name="create-outline" size={20} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item._id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </CustomCard>
    );

    return (
        <GradientBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>My Students</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => (navigation as any).navigate('CreateStudent')}
                    >
                        <Ionicons name="add" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                <CustomInput
                    label="Search"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={<Ionicons name="search" size={24} color="#6B7280" />}
                    style={styles.searchBar}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filteredStudents}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No students found</Text>
                        }
                    />
                )}
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButton: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
    },
    searchBar: {
        marginBottom: 20,
    },
    list: {
        paddingBottom: 20,
    },
    card: {
        marginBottom: 15,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    grade: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 2,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    analyticsButton: {
        backgroundColor: '#D1FAE5',
    },
    editButton: {
        backgroundColor: '#E0E7FF',
    },
    deleteButton: {
        backgroundColor: '#FEE2E2',
    },
    emptyText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default StudentListScreen;
