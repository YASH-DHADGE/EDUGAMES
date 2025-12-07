import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../i18n';

const LanguageToggle = () => {
    const { language, setLanguage } = useTranslation();

    const toggleLanguage = () => {
        if (language === 'en') {
            setLanguage('hi'); // Switch to Hindi
        } else if (language === 'hi') {
            setLanguage('od'); // Switch to Odia
        } else {
            setLanguage('en'); // Switch back to English
        }
    };

    const getLanguageLabel = () => {
        switch (language) {
            case 'en': return 'EN';
            case 'hi': return 'HI';
            case 'od': return 'OD';
            default: return 'EN';
        }
    };

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={toggleLanguage}
            activeOpacity={0.7}
        >
            <MaterialCommunityIcons name="translate" size={20} color="#fff" />
            <Text style={styles.text}>{getLanguageLabel()}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        gap: 4,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    }
});

export default LanguageToggle;
