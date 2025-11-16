import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatService } from '../../services/api';
import useChat from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const MessageBubble = ({ message, isOwnMessage }) => {
    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                isOwnMessage
                ? 'bg-dortmed-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
            }`}>
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-dortmed-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};

const ChatPage = () => {
    const { conversationId } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [messageInput, setMessageInput] = useState("");
    const { messages, setMessages, sendMessage, isConnected } = useChat(conversationId);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchInitialMessages = async () => {
            setLoading(true);
            try {
                const response = await chatService.getMessages(conversationId);
                setMessages(response.data);
            } catch (error) {
                toast.error("Failed to load message history.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialMessages();
    }, [conversationId, setMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim()) {
            sendMessage(messageInput.trim());
            setMessageInput("");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
            {/* Header placeholder */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold">Conversation</h1>
                <span className={`text-xs ${isConnected ? 'text-success' : 'text-danger'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
            {/* Message Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {loading && <p>Loading history...</p>}
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === user.id} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="input-base flex-grow"
                        disabled={!isConnected}
                    />
                    <button type="submit" className="p-3 bg-dortmed-600 text-white rounded-full hover:bg-dortmed-700 disabled:opacity-50" disabled={!isConnected}>
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;