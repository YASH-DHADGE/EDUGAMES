import React, { useState, useRef, Suspense, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Image, Text as NativeText, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Switch, useTheme } from 'react-native-paper';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, Environment, Center, Sparkles } from '@react-three/drei/native';
import * as THREE from 'three';
import GameLayout from '../../components/games/GameLayout';
import TutorialOverlay from '../../components/games/TutorialOverlay';
import { useGameProgress } from '../../hooks/useGameProgress';
import { Asset } from 'expo-asset';
import { spacing } from '../../theme';
import { soundManager } from '../../utils/soundEffects';

// Map levels to models
const LEVELS = [
    { id: 'brain', name: 'The Command Center', model: 'brain1.glb', task: 'Locate the Frontal Lobe', image: require('../../../assets/images/organs/brain.png') },
    { id: 'heart', name: 'The Pump', model: 'heart-_whole.glb', task: 'Find the Aorta', image: require('../../../assets/images/organs/heart.png') },
    { id: 'lungs', name: 'The Breathers', model: 'lungs1.glb', task: 'Clear the Airways', image: require('../../../assets/images/organs/lungs.png') }
];

// Helper to load assets
const Model = ({ url, onInteract }: { url: string, onInteract: () => void }) => {
    const { scene } = useGLTF(url);
    const meshRef = useRef<THREE.Group>(null);
    const [active, setActive] = useState(false);
    const scale = useRef(1.5);
    const time = useRef(0);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Idle rotation
            meshRef.current.rotation.y += delta * 0.1;

            // Pulse animation on click
            if (active) {
                time.current += delta * 15;
                const scaleValue = 0.8 + Math.sin(time.current) * 0.2; // Pulse base scale 0.8
                meshRef.current.scale.set(scaleValue, scaleValue, scaleValue);

                // Stop animating after one pulse cycle roughly
                if (time.current > Math.PI) {
                    setActive(false);
                    time.current = 0;
                    meshRef.current.scale.set(0.8, 0.8, 0.8);
                    onInteract(); // Trigger success action
                }
            }
        }
    });

    return (
        <group
            ref={meshRef}
            dispose={null}
            scale={0.8}
            onClick={(e) => {
                e.stopPropagation();
                setActive(true);
            }}
        >
            <primitive object={scene} />
        </group>
    );
};

const OrganOdysseyScreen = () => {
    const theme = useTheme();
    const { score, level, addScore, endGame, lives, loseLife } = useGameProgress('organ_odyssey');
    const [showTutorial, setShowTutorial] = useState(true);
    const [is3DMode, setIs3DMode] = useState(true);
    const [loading, setLoading] = useState(true);
    const [modelUri, setModelUri] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentLevelIndex = (level - 1) % LEVELS.length;
    const currentLevel = LEVELS[currentLevelIndex];

    useEffect(() => {
        loadModelAsset();
    }, [currentLevel]);

    const loadModelAsset = async () => {
        try {
            setLoading(true);
            let assetSource;
            switch (currentLevel.model) {
                case 'brain1.glb': assetSource = require('../../../assets/models/brain1.glb'); break;
                case 'heart-_whole.glb': assetSource = require('../../../assets/models/heart-_whole.glb'); break;
                case 'lungs1.glb': assetSource = require('../../../assets/models/lungs1.glb'); break;
                default: assetSource = null;
            }

            if (assetSource) {
                const asset = Asset.fromModule(assetSource);
                await asset.downloadAsync();
                setModelUri(asset.uri);
            }
        } catch (e) {
            console.error("Failed to load 3D model", e);
            setIs3DMode(false); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const handleObjectTap = () => {
        soundManager.playCorrect();
        setShowSuccess(true);

        // Delay ending game to show effect
        setTimeout(() => {
            addScore(100);
            setShowSuccess(false);
            endGame();
        }, 1500);
    };

    return (
        <GameLayout
            title="Organ Odyssey"
            lives={lives}
            score={score}
        >
            <View style={styles.container}>
                {/* Mode Toggle */}
                <View style={styles.toggleRow}>
                    <Text style={{ color: '#fff', marginRight: 8 }}>2D</Text>
                    <Switch value={is3DMode} onValueChange={setIs3DMode} color={theme.colors.primary} />
                    <Text style={{ color: '#fff', marginLeft: 8 }}>3D</Text>
                </View>

                {/* Task Badge */}
                <Surface style={styles.taskBadge} elevation={2}>
                    <Text style={styles.taskTitle}>Mission: {currentLevel.task}</Text>
                </Surface>

                <View style={styles.gameArea}>
                    {is3DMode && modelUri ? (
                        <Canvas style={{ flex: 1 }} camera={{ position: [0, 0, 12], fov: 50 }}>
                            <ambientLight intensity={1.5} />
                            <pointLight position={[10, 10, 10]} intensity={2} />
                            <pointLight position={[-10, -10, -10]} intensity={1} />
                            <Suspense fallback={null}>
                                <Center>
                                    <Model url={modelUri} onInteract={handleObjectTap} />
                                </Center>
                                {showSuccess && (
                                    <Sparkles
                                        count={50}
                                        scale={8}
                                        size={4}
                                        speed={0.4}
                                        opacity={1}
                                        color="#FFD700"
                                    />
                                )}
                                <Environment preset="city" />
                            </Suspense>
                            <OrbitControls
                                enableZoom={true}
                                minDistance={5}
                                maxDistance={20}
                                autoRotate={!showSuccess}
                                autoRotateSpeed={2}
                            />
                        </Canvas>
                    ) : (
                        <View style={styles.fallbackContainer}>
                            <Image
                                source={currentLevel.image}
                                style={styles.fallbackImage}
                                resizeMode="contain"
                            />
                            <TouchableOpacity style={styles.hotspot} onPress={handleObjectTap} />
                            <Text style={{ color: '#fff', marginTop: 20 }}>Tap the Organ to Repair</Text>
                        </View>
                    )}

                    {loading && (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={{ color: '#fff', marginTop: 10 }}>Loading Model...</Text>
                        </View>
                    )}
                </View>
            </View>

            <TutorialOverlay
                visible={showTutorial}
                title="Welcome to Organ Odyssey"
                instructions={[
                    "Explore the 3D human body models.",
                    "Rotate to find the infected or damaged area.",
                    "Tap to repair the organ and earn XP!"
                ]}
                onStart={() => setShowTutorial(false)}
            />
        </GameLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        marginTop: 60, // Clear header
    },
    taskBadge: {
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        marginBottom: spacing.md,
    },
    taskTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    gameArea: {
        flex: 1,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackImage: {
        width: '80%',
        height: '60%',
    },
    hotspot: {
        position: 'absolute',
        width: 100,
        height: 100,
        backgroundColor: 'rgba(255,0,0,0.3)', // Debug visible, make transparent later
        borderRadius: 50,
    },
});

export default OrganOdysseyScreen;
