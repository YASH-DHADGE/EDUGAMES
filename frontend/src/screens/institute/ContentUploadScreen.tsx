import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../components/ui/GradientBackground';
import CustomCard from '../../components/ui/CustomCard';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';

const ContentUploadScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        classNumber: '',
        subject: '',
        chapter: '',
        body: '', // For now, just text content or URL
        contentType: 'note'
    });

    const handleSubmit = async () => {
        if (!formData.title || !formData.classNumber || !formData.subject || !formData.body) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/institute/content', formData);
            await api.post('/institute/content', formData);
            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to upload content');
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
                    <Text style={styles.title}>Upload Content</Text>
                    <View style={{ width: 40 }} />
                </View>

                <CustomCard style={styles.formCard}>
                    <CustomInput
                        label="Content Title *"
                        placeholder="e.g. Chapter 1 Summary"
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                        style={styles.input}
                    />
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <CustomInput
                                label="Class *"
                                placeholder="e.g. 10"
                                value={formData.classNumber}
                                onChangeText={(text) => setFormData({ ...formData, classNumber: text })}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <CustomInput
                                label="Subject *"
                                placeholder="e.g. Math"
                                value={formData.subject}
                                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                                style={styles.input}
                            />
                        </View>
                    </View>
                    <CustomInput
                        label="Chapter *"
                        placeholder="e.g. Algebra"
                        value={formData.chapter}
                        onChangeText={(text) => setFormData({ ...formData, chapter: text })}
                        style={styles.input}
                    />

                    <Text style={styles.label}>Content Type</Text>
                    <View style={styles.typeContainer}>
                        {['note', 'pdf', 'link'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeButton, formData.contentType === type && styles.activeType]}
                                onPress={() => setFormData({ ...formData, contentType: type })}
                            >
                                <Text style={[styles.typeText, formData.contentType === type && styles.activeTypeText]}>
                                    {type.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <CustomInput
                        label="Content Body / URL *"
                        placeholder="Enter text or paste link..."
                        value={formData.body}
                        onChangeText={(text) => setFormData({ ...formData, body: text })}
                        multiline
                        numberOfLines={4}
                        style={[styles.input, styles.textArea]}
                    />

                    <CustomButton
                        onPress={handleSubmit}
                        disabled={loading}
                        style={styles.submitButton}
                    >
                        {loading ? 'Uploading...' : 'Upload Content'}
                    </CustomButton>
                </CustomCard>
            </ScrollView>
            <SuccessModal
                visible={showSuccessModal}
                title="Content Uploaded!"
                message="Your content has been added successfully."
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                }}
                buttonText="Done"
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    halfInput: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    activeType: {
        backgroundColor: '#E0E7FF',
        borderColor: '#4F46E5',
    },
    typeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTypeText: {
        color: '#4F46E5',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: 10,
    },
});

export default ContentUploadScreen;
