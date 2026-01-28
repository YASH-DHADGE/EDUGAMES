import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/ui/GradientBackground';
import CustomCard from '../../components/ui/CustomCard';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';

const CreateInstituteScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        adminEmail: '',
        status: 'active'
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.code || !formData.adminEmail) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/admin/institute', formData);
            await api.post('/admin/institute', formData);
            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create institute');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Institute</Text>
                    <View style={{ width: 40 }} />
                </View>

                <CustomCard style={styles.formCard}>
                    <CustomInput
                        label="Institute Name *"
                        placeholder="Enter institute name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        style={styles.input}
                    />
                    <CustomInput
                        label="Institute Code *"
                        placeholder="Unique code (e.g., INST001)"
                        value={formData.code}
                        onChangeText={(text) => setFormData({ ...formData, code: text })}
                        style={styles.input}
                    />
                    <CustomInput
                        label="Admin Email *"
                        placeholder="admin@institute.com"
                        value={formData.adminEmail}
                        onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
                        keyboardType="email-address"
                        style={styles.input}
                    />
                    <CustomInput
                        label="Address"
                        placeholder="Full address"
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />

                    <Text style={styles.label}>Status</Text>
                    <View style={styles.statusContainer}>
                        <TouchableOpacity
                            style={[styles.statusButton, formData.status === 'active' && styles.activeStatus]}
                            onPress={() => setFormData({ ...formData, status: 'active' })}
                        >
                            <Text style={[styles.statusText, formData.status === 'active' && styles.activeStatusText]}>Active</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.statusButton, formData.status === 'disabled' && styles.disabledStatus]}
                            onPress={() => setFormData({ ...formData, status: 'disabled' })}
                        >
                            <Text style={[styles.statusText, formData.status === 'disabled' && styles.disabledStatusText]}>Disabled</Text>
                        </TouchableOpacity>
                    </View>

                    <CustomButton
                        onPress={handleSubmit}
                        disabled={loading}
                        style={styles.submitButton}
                    >
                        {loading ? 'Creating...' : 'Create Institute'}
                    </CustomButton>
                </CustomCard>
            </ScrollView>
            <SuccessModal
                visible={showSuccessModal}
                title="Institute Created!"
                message="New institute has been registered successfully."
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                }}
                buttonText="Back to List"
            />
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    formCard: {
        padding: 20,
    },
    input: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 10,
    },
    statusButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    activeStatus: {
        backgroundColor: '#D1FAE5',
        borderColor: '#059669',
    },
    disabledStatus: {
        backgroundColor: '#FEE2E2',
        borderColor: '#DC2626',
    },
    statusText: {
        fontWeight: '600',
        color: '#6B7280',
    },
    activeStatusText: {
        color: '#059669',
    },
    disabledStatusText: {
        color: '#DC2626',
    },
    submitButton: {
        marginTop: 10,
    },
});

export default CreateInstituteScreen;
