import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';

const AdminSupportScreen = () => {
    const { isDark } = useAppTheme();
    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
            <Text style={{ color: isDark ? '#fff' : '#000' }}>Support Dashboard - Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AdminSupportScreen;
