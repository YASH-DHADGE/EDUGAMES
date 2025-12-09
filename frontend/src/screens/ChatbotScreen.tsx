import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { searchOffline } from '../utils/offlineSearch';
import { useAuth } from '../context/AuthContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

const ChatbotScreen = () => {
    const navigation = useNavigation();
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your AI Tutor. Ask me anything about your Science lessons or the app!",
            sender: 'bot',
            timestamp: Date.now()
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOffline(!state.isConnected);
        });
        return unsubscribe;
    }, []);

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: query,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            let botResponse = '';

            // 1. Search Local Context
            const localContext = searchOffline(userMsg.text);

            // 2. Decide: Online or Offline response
            if (isOffline) {
                // OFFLINE MODE
                if (localContext.length > 0) {
                    botResponse = "Here's what I found in your offline lessons:\n\n";
                    localContext.forEach((item: any) => {
                        botResponse += `• *${item.title}*: ${item.text}\n\n`;
                    });
                } else {
                    botResponse = "I couldn't find anything in your offline lessons that matches that. Please try connecting to the internet for a better answer.";
                }
            } else {
                // ONLINE MODE
                try {
                    const mode = localContext.some((c: any) => c.type === 'help') ? 'app_help' : 'student_doubt';

                    const response = await api.post('/ai/chat', {
                        query: userMsg.text,
                        context: localContext,
                        mode: mode
                    });
                    botResponse = response.data.answer;
                } catch (apiError: any) {
                    console.error("AI API Error:", apiError);

                    const isModelError = apiError.response?.status === 404 || apiError.message?.includes('404');
                    const isRateLimit = apiError.response?.status === 429 || apiError.message?.includes('429');

                    let errorPrefix = "⚠️ *Connection Error*";
                    if (isModelError) {
                        errorPrefix = "⚠️ *System Error (404)*";
                    } else if (isRateLimit) {
                        errorPrefix = "⚠️ *High Traffic (Rate Limit)*";
                    }

                    if (localContext.length > 0) {
                        botResponse = `${errorPrefix} - Showing Offline Results\n\n`;
                        localContext.forEach((item: any) => {
                            botResponse += `• *${item.title}*: ${item.text}\n\n`;
                        });
                    } else {
                        if (isModelError) {
                            botResponse = `${errorPrefix}: The AI model is currently unavailable. Please contact support.`;
                        } else if (isRateLimit) {
                            botResponse = `${errorPrefix}: The AI brain is busy. Please try again in 5-10 seconds.`;
                        } else {
                            botResponse = `${errorPrefix}: I couldn't connect to the server and I couldn't find this on your offline lessons.\n\nTry asking about topics like 'Photosynthesis', 'Food', or 'Fibre'.`;
                        }
                    }
                }
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.botMessage
            ]}>
                <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Tutor {isOffline ? '(Offline)' : ''}</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                style={styles.list}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask a doubt..."
                        placeholderTextColor="#666"
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity onPress={handleSend} disabled={loading} style={styles.sendButton}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 20
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#4A90E2',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: '#FFF'
    },
    botText: {
        color: '#333'
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        alignItems: 'center'
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        marginRight: 12,
        color: '#333'
    },
    sendButton: {
        backgroundColor: '#4A90E2',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default ChatbotScreen;
