import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { Text, Surface, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../../../context/ThemeContext';
import { CASES } from '../../../data/algebraHeistData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '../../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AlgebraHeistMapScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();

    // State
    const [unlockedStars, setUnlockedStars] = useState(0);
    const [completedCases, setCompletedCases] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadProgress();
        }
    }, [isFocused]);

    const loadProgress = async () => {
        try {
            setLoading(true);
            const savedData = await AsyncStorage.getItem('algebraHeist_progress');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setUnlockedStars(parsed.totalStars || 0);
                setCompletedCases(parsed.completedCases || []);
            }
        } catch (error) {
            console.error("Failed to load progress", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCasePress = (caseItem: any) => {
        if (unlockedStars >= caseItem.requiredStarsToUnlock) {
            (navigation as any).navigate('AlgebraHeistCase', { caseId: caseItem.id });
        } else {
            Alert.alert(
                "Locked Case",
                `You need ${caseItem.requiredStarsToUnlock} stars to unlock this case. Solve previous cases to earn stars!`
            );
        }
    };

    const styles = createStyles(isDark);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <IconButton icon="arrow-left" iconColor="#fff" onPress={() => navigation.goBack()} />
                <View style={styles.headerTitle}>
                    <Text variant="titleLarge" style={{ color: '#fff', fontWeight: 'bold' }}>Detective Map</Text>
                    <View style={styles.starBadge}>
                        <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginLeft: 4 }}>{unlockedStars}</Text>
                    </View>
                </View>
                <IconButton icon="refresh" iconColor="#fff" onPress={loadProgress} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.mapScroll} horizontal={true} maximumZoomScale={2} minimumZoomScale={0.5}>
                    <ImageBackground
                        source={{ uri: 'https://img.freepik.com/free-vector/city-map-navigation-interface_23-2148045667.jpg' }} // Placeholder map bg
                        style={styles.mapBackground}
                        imageStyle={{ opacity: 0.4 }}
                    >
                        {CASES.map((c) => {
                            const isUnlocked = unlockedStars >= c.requiredStarsToUnlock;
                            const isCompleted = completedCases.includes(c.id);

                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[
                                        styles.node,
                                        { left: `${c.location.x}%`, top: `${c.location.y}%` },
                                        isUnlocked ? styles.nodeUnlocked : styles.nodeLocked,
                                        isCompleted && styles.nodeCompleted
                                    ]}
                                    onPress={() => handleCasePress(c)}
                                >
                                    <MaterialCommunityIcons
                                        name={isCompleted ? "check-bold" : isUnlocked ? "map-marker" : "lock"}
                                        size={24}
                                        color="#fff"
                                    />
                                    {isUnlocked && (
                                        <Surface style={styles.nodeLabel} elevation={2}>
                                            <Text variant="labelSmall" style={styles.nodeLabelText}>{c.title}</Text>
                                        </Surface>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ImageBackground>
                </ScrollView>
            )}
        </View>
    );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1E1E1E'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#263238',
        paddingHorizontal: 8,
        paddingBottom: 12,
        zIndex: 10
    },
    headerTitle: {
        alignItems: 'center'
    },
    starBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    mapScroll: {
        width: 1000, // Large scrollable area
        height: 1000,
    },
    mapBackground: {
        width: '100%',
        height: '100%',
        backgroundColor: '#263238'
    },
    node: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        zIndex: 2,
        transform: [{ translateX: -22 }, { translateY: -22 }] // Center anchor
    },
    nodeLocked: {
        backgroundColor: '#546E7A',
        borderColor: '#37474F'
    },
    nodeUnlocked: {
        backgroundColor: '#FFA000',
        borderColor: '#FFECB3'
    },
    nodeCompleted: {
        backgroundColor: '#43A047',
        borderColor: '#C8E6C9'
    },
    nodeLabel: {
        position: 'absolute',
        bottom: -24,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        minWidth: 80,
        alignItems: 'center'
    },
    nodeLabelText: {
        color: '#fff',
        fontSize: 10
    }
});

export default AlgebraHeistMapScreen;
