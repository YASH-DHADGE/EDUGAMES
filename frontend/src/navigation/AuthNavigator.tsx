import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import NewLoginScreen from '../screens/NewLoginScreen';
import NewRegisterScreen from '../screens/NewRegisterScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={NewLoginScreen} />
            <Stack.Screen name="Register" component={NewRegisterScreen} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
