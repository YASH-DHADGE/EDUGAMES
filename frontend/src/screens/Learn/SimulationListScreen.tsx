import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, Platform, Image, useWindowDimensions } from 'react-native';
import { Text, Surface, useTheme, Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SimulationViewer from '../../components/learn/SimulationViewer';
import { spacing, gradients, borderRadius } from '../../theme';
import { getAllSimulations, getSimulationsBySubject, Simulation } from '../../data/phetMappings';
import Animated, { FadeInDown, FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/ScreenBackground';
import { useAppTheme } from '../../context/ThemeContext';

// --- Assets Helper (Recreating logic from HomeScreen) ---
const getSimImage = (title: string, subject: string) => {
    // You can expand this mapping as needed or import the real helper if found
    // For now, returning null will let us fallback to a gradient card if no image
    // In a real scenario, we'd import the asset map
    return null;
};

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

const ScaleButton = ({ onPress, style, children, ...props }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.95);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={[style, animatedStyle]}
            activeOpacity={0.9} // Prevent opacity flicker with reanimated
            {...props}
        >
            {children}
        </AnimatedPressable>
    );
};

const SimulationListScreen = ({ route, navigation }: any) => {
    const theme = useTheme();
    const { isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { subchapterSims } = route.params || {};

    const isDesktop = width >= 1024;
    const isTablet = width >= 768;

    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [filteredSims, setFilteredSims] = useState<Simulation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedSim, setSelectedSim] = useState<Simulation | null>(null);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSimulations();
    }, []);

    useEffect(() => {
        filterSimulations();
    }, [searchQuery, selectedSubject, simulations]);

    const loadSimulations = () => {
        setLoading(true);
        const sims = subchapterSims || getAllSimulations();
        setSimulations(sims);
        setFilteredSims(sims);
        setLoading(false);
    };

    const filterSimulations = () => {
        let filtered = simulations;
        if (selectedSubject) {
            filtered = filtered.filter(sim => sim.subject === selectedSubject);
        }
        if (searchQuery) {
            filtered = filtered.filter(sim =>
                sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sim.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredSims(filtered);
    };

    const handleSimulationPress = (sim: Simulation) => {
        setSelectedSim(sim);
        setViewerVisible(true);
    };

    const subjects = ['Physics', 'Chemistry', 'Math', 'Biology'];

    const getSubjectIcon = (subject: string) => {
        const icons: Record<string, string> = {
            'Physics': 'atom',
            'Chemistry': 'flask',
            'Math': 'calculator',
            'Biology': 'dna'
        };
        return icons[subject] || 'school';
    };

    // Card Colors & Gradients match HomeScreen logic
    const getSubjectColor = (subject: string) => {
        if (subject === 'Physics') return '#6366F1';
        if (subject === 'Chemistry') return '#10B981';
        if (subject === 'Math') return '#F59E0B';
        if (subject === 'Biology') return '#8B5CF6';
        return theme.colors.primary;
    };

    const getSubjectGradient = (subject: string) => {
        if (subject === 'Physics') return ['#6366F1', '#4F46E5'];
        if (subject === 'Chemistry') return ['#10B981', '#059669'];
        if (subject === 'Math') return ['#F59E0B', '#D97706'];
        if (subject === 'Biology') return ['#8B5CF6', '#7C3AED'];
        return ['#6366F1', '#4F46E5'];
    };


    const renderSimulationCard = (sim: Simulation, index: number) => {
        const isPhysics = sim.subject === 'Physics';
        const isChem = sim.subject === 'Chemistry';
        const subColor = getSubjectColor(sim.subject);
        const subBg = isPhysics ? 'rgba(99, 102, 241, 0.1)' : isChem ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
        const imageUrl = getSimImage(sim.title, sim.subject);
        const gradient = getSubjectGradient(sim.subject);

        return (
            <Animated.View
                key={sim.fileName}
                entering={Platform.OS === 'web' ? undefined : FadeInDown.delay(index * 50).duration(400).springify()}
                style={styles.cardWrapper}
            >
                <ScaleButton onPress={() => handleSimulationPress(sim)}>
                    <Surface style={[styles.simCardPremium, { backgroundColor: isDark ? '#1E293B' : '#fff' }]} elevation={4}>
                        {/* Preview Section */}
                        <View style={[styles.simPreviewPremium, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                            {imageUrl ? (
                                <Image
                                    source={imageUrl as any}
                                    style={styles.simImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                // Fallback Gradient Texture if no image
                                <LinearGradient
                                    colors={[gradient[0], gradient[1]] as any}
                                    style={styles.fallbackGradient}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                >
                                    <MaterialCommunityIcons name={getSubjectIcon(sim.subject) as any} size={48} color="rgba(255,255,255,0.3)" />
                                </LinearGradient>
                            )}

                            {/* Overlay Gradient (for text readability if image) */}
                            {imageUrl && (
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                                    style={styles.simImageOverlay}
                                />
                            )}

                            {/* Play Button */}
                            <View style={[styles.playOverlay, { backgroundColor: subColor }]}>
                                <MaterialCommunityIcons name="play" size={20} color="#fff" />
                            </View>
                        </View>

                        {/* Content Section */}
                        <View style={styles.simContentPremium}>
                            <View style={[styles.simBadge, { backgroundColor: subBg }]}>
                                <Text style={[styles.simSubject, { color: subColor }]}>{sim.subject}</Text>
                            </View>
                            <Text numberOfLines={2} style={[styles.simTitlePremium, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                                {sim.title}
                            </Text>

                            {/* Optional Description (truncated) */}
                            {/* <Text numberOfLines={2} style={{fontSize: 12, color: isDark ? '#94A3B8' : '#64748B', marginTop: 4}}>
                                {sim.description}
                             </Text> */}
                        </View>
                    </Surface>
                </ScaleButton>
            </Animated.View>
        );
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

                {/* Modern Header - Matching Home Screen Style */}
                <View style={[styles.headerBackground, { paddingTop: insets.top + spacing.md }]}>
                    <LinearGradient
                        colors={['rgba(30, 41, 59, 0.95)', 'rgba(30, 41, 59, 0.8)']} // Subtle dark gradient
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                    <Animated.View entering={Platform.OS === 'web' ? undefined : FadeInDown.duration(500)} style={styles.headerContent}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.headerTitleContainer}>
                                <Text variant="headlineMedium" style={styles.headerTitle}>
                                    Simulations
                                </Text>
                            </View>
                            <TouchableOpacity style={[styles.backButton, { opacity: 0 }]}>
                                <MaterialCommunityIcons name="filter" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text variant="bodyMedium" style={styles.headerSubtitle}>
                            Interactive science learning experiences
                        </Text>
                    </Animated.View>
                </View>

                <View style={styles.scrollContainer}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Centered Max Width Container */}
                        <View style={styles.contentWrapper}>

                            {/* Search & Filters */}
                            <Animated.View entering={FadeInUp.delay(200)} style={styles.controlsSection}>
                                <Searchbar
                                    placeholder="Search simulations..."
                                    onChangeText={setSearchQuery}
                                    value={searchQuery}
                                    style={[styles.searchBar, { backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#E5E7EB' }]}
                                    inputStyle={{ color: isDark ? '#fff' : '#000' }}
                                    iconColor={theme.colors.primary}
                                    placeholderTextColor={isDark ? '#94A3B8' : '#6B7280'}
                                />

                                {!subchapterSims && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.filterContainer}
                                        contentContainerStyle={styles.filterContent}
                                    >
                                        <Chip
                                            selected={selectedSubject === null}
                                            onPress={() => setSelectedSubject(null)}
                                            style={[styles.chip, selectedSubject === null && styles.selectedChip, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}
                                            textStyle={[styles.chipText, selectedSubject === null && styles.selectedChipText, { color: isDark && selectedSubject !== null ? '#CBD5E1' : (selectedSubject === null ? '#fff' : '#666') }]}
                                            showSelectedOverlay
                                            mode="flat"
                                        >
                                            All
                                        </Chip>
                                        {subjects.map(subject => (
                                            <Chip
                                                key={subject}
                                                selected={selectedSubject === subject}
                                                onPress={() => setSelectedSubject(subject)}
                                                icon={getSubjectIcon(subject)}
                                                style={[
                                                    styles.chip,
                                                    { backgroundColor: isDark ? '#334155' : '#F3F4F6' },
                                                    selectedSubject === subject && [
                                                        styles.selectedChip,
                                                        { backgroundColor: getSubjectColor(subject) }
                                                    ]
                                                ]}
                                                textStyle={[
                                                    styles.chipText,
                                                    { color: isDark ? '#CBD5E1' : '#666' },
                                                    selectedSubject === subject && styles.selectedChipText
                                                ]}
                                                showSelectedOverlay
                                                mode="flat"
                                            >
                                                {subject}
                                            </Chip>
                                        ))}
                                    </ScrollView>
                                )}
                            </Animated.View>

                            {/* Results Count */}
                            {!loading && (
                                <View style={styles.resultsHeader}>
                                    <Text style={[styles.resultsText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                                        {filteredSims.length} simulations found
                                    </Text>
                                </View>
                            )}

                            {/* Grid */}
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                </View>
                            ) : filteredSims.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="flask-empty-outline" size={64} color={isDark ? '#475569' : '#CBD5E1'} />
                                    <Text style={[styles.emptyTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>No simulations found</Text>
                                </View>
                            ) : (
                                <View style={styles.grid}>
                                    {filteredSims.map((sim, index) => renderSimulationCard(sim, index))}
                                </View>
                            )}

                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>

                {/* Simulation Viewer Modal */}
                {selectedSim && (
                    <SimulationViewer
                        visible={viewerVisible}
                        title={selectedSim.title}
                        fileName={selectedSim.fileName}
                        onClose={() => setViewerVisible(false)}
                    />
                )}
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: spacing.xl,
    },
    contentWrapper: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: Platform.OS === 'web' && Dimensions.get('window').width > 768 ? 24 : 16,
    },
    // Header
    headerBackground: {
        paddingBottom: spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        marginBottom: spacing.lg,
    },
    headerContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: '800',
        color: '#fff',
        fontSize: 24,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontSize: 14,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Controls
    controlsSection: {
        marginBottom: spacing.lg,
    },
    searchBar: {
        borderRadius: 16,
        elevation: 0,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    filterContainer: {
        marginBottom: spacing.xs,
    },
    filterContent: {
        gap: spacing.sm,
        paddingVertical: 4,
    },
    chip: {
        borderRadius: 12,
        borderWidth: 0,
        height: 36,
    },
    selectedChip: {
        // Color applied dynamically
    },
    chipText: {
        fontWeight: '600',
        fontSize: 13,
    },
    selectedChipText: {
        color: '#fff',
        fontWeight: '700',
    },
    resultsHeader: {
        marginBottom: spacing.md,
    },
    resultsText: {
        fontWeight: '600',
        fontSize: 14,
    },
    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16, // Gap between cards
        justifyContent: 'center', // Center cards
    },
    cardWrapper: {
        // No fixed width here, card itself has dimensions
    },

    // Premium Card Styles (Matching HomeScreen)
    simCardPremium: {
        width: 200, // Fixed Width
        minHeight: 220, // Fixed Min Height
        borderRadius: 20,
        overflow: 'hidden',
        margin: 0,
    },
    simPreviewPremium: {
        height: 120,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    simImage: {
        width: '100%',
        height: '100%',
    },
    simImageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    playOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        borderRadius: 20,
        padding: 6,
        elevation: 4,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    simContentPremium: {
        padding: 16,
        paddingTop: 12,
        flex: 1,
        justifyContent: 'flex-start',
    },
    simBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    simSubject: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    simTitlePremium: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
    },

    // States
    loadingContainer: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    }
});

export default SimulationListScreen;
