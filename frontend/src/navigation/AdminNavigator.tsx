import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminInstituteManagerScreen from '../screens/admin/AdminInstituteManagerScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import GlobalAnalyticsScreen from '../screens/admin/GlobalAnalyticsScreen';
import GlobalSyllabusManagerScreen from '../screens/admin/GlobalSyllabusManagerScreen';
import QuizBankManagerScreen from '../screens/admin/QuizBankManagerScreen';
import AdminMapScreen from '../screens/admin/AdminMapScreen';
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createNativeStackNavigator();

const AdminNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
            <Stack.Screen name="AdminInstituteManager" component={AdminInstituteManagerScreen} />
            <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="GlobalAnalytics" component={GlobalAnalyticsScreen} />
            <Stack.Screen name="GlobalSyllabusManager" component={GlobalSyllabusManagerScreen} />
            <Stack.Screen name="QuizBankManager" component={QuizBankManagerScreen} />
            <Stack.Screen name="AdminMap" component={AdminMapScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="AdminFeedback" component={require('../screens/admin/AdminFeedbackScreen').default} />

            {/* New Placeholder Screens */}
            <Stack.Screen name="AdminSettings" component={require('../screens/admin/AdminSettingsScreen').default} />
            <Stack.Screen name="AdminLogs" component={require('../screens/admin/AdminLogsScreen').default} />
            <Stack.Screen name="AdminSupport" component={require('../screens/admin/AdminSupportScreen').default} />
        </Stack.Navigator>
    );
};

export default AdminNavigator;
