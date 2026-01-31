import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import CompactHeader from '../../components/ui/CompactHeader';
import { useAppTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import CustomInput from '../../components/ui/CustomInput';
import api from '../../services/api';
import SuccessModal from '../../components/ui/SuccessModal';
import { LinearGradient } from 'expo-linear-gradient';

const CreateStudentScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();
    const { containerStyle, isMobile } = useResponsive();

    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        grade: '',
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.grade) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/teacher/student', formData);
            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenBackground style={styles.container}>
            <CompactHeader
                title="Add Student"
                subtitle="Create a new learner account"
                onBack={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={[styles.content, containerStyle]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <View style={styles.iconHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF' }]}>
                                <MaterialCommunityIcons name="account-plus" size={32} color="#4F46E5" />
                            </View>
                            <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#1E293B' }]}>Student Details</Text>
                            <Text style={[styles.cardSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                Fill in the information below to add a new student to your class.
                            </Text>
                        </View>

                        <View style={styles.formSection}>
                            <CustomInput
                                label="Full Name"
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                                icon={<MaterialCommunityIcons name="account" size={20} color="#94A3B8" />}
                                style={styles.input}
                            />

                            <CustomInput
                                label="Email Address"
                                placeholder="student@school.com"
                                value={formData.email}
                                onChangeText={(text: string) => setFormData({ ...formData, email: text })}
                                keyboardType="email-address"
                                icon={<MaterialCommunityIcons name="email" size={20} color="#94A3B8" />}
                                style={styles.input}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <CustomInput
                                        label="Grade / Class"
                                        placeholder="e.g. 10"
                                        value={formData.grade}
                                        onChangeText={(text: string) => setFormData({ ...formData, grade: text })}
                                        keyboardType="numeric"
                                        icon={<MaterialCommunityIcons name="school" size={20} color="#94A3B8" />}
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            <CustomInput
                                label="Password"
                                placeholder="Create a temporary password"
                                value={formData.password}
                                onChangeText={(text: string) => setFormData({ ...formData, password: text })}
                                secureTextEntry
                                icon={<MaterialCommunityIcons name="lock" size={20} color="#94A3B8" />}
                                style={styles.input}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#4F46E5', '#7C3AED']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <Text style={styles.buttonText}>Creating...</Text>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                        <Text style={styles.buttonText}>Create Account</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={showSuccessModal}
                title="Student Added!"
                message={`${formData.name} has been successfully added to your class.`}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigation.goBack();
                }}
                buttonText="Back to Students"
            />
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    formCard: {
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    iconHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    formSection: {
        gap: 16,
        marginBottom: 32,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    input: {
        backgroundColor: 'transparent',
    },
    createButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonGradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreateStudentScreen;
