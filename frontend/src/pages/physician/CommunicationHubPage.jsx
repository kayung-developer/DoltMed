import React, { useState, useEffect, useCallback } from 'react';
import { chatService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useChat from '../../hooks/useChat';
import { PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/solid';

const MessageBubble = ({ message, isOwnMessage }) => { /* ... (Same as from ChatPage.jsx) ... */ };

const ChatWindow = ({ conversationId }) => {
    const { user } = useAuth();
    const [messageInput, setMessageInput] = useState("");
    const { messages, setMessages, sendMessage, isConnected } = useChat(conversationId);

    useEffect(() => { /* ... (Same effect to fetch initial messages from ChatPage.jsx) ... */ }, [conversationId, setMessages]);

    const handleSendMessage = (e) => { e.preventDefault(); if (messageInput.trim()) { sendMessage(messageInput.trim()); setMessageInput(""); } };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                 {messages.map(msg => <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === user.id} />)}
            </div>
            <div className="p-4 border-t dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                    <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..." className="input-base flex-grow" disabled={!isConnected} />
                    <button type="submit" className="p-3 bg-dortmed-600 text-white rounded-full disabled:opacity-50" disabled={!isConnected}><PaperAirplaneIcon className="w-6 h-6" /></button>
                </form>
            </div>
        </div>
    );
};


const CommunicationHubPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConvoId, setSelectedConvoId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            try {
                const response = await chatService.getConversations();
                setConversations(response.data);
                if (response.data.length > 0) {
                    setSelectedConvoId(response.data[0].id);
                }
            } catch (error) {
                toast.error("Failed to load conversations.");
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    return (
        <div className="flex h-[calc(100vh-8rem)] border dark:border-gray-700 rounded-lg overflow-hidden shadow-lg">
            {/* Conversation List Sidebar */}
            <div className="w-1/3 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700"><h2 className="text-xl font-bold">Patient Messages</h2></div>
                <ul className="overflow-y-auto flex-grow">
                    {loading ? <p>Loading...</p> : conversations.map(convo => (
                        <li key={convo.id} onClick={() => setSelectedConvoId(convo.id)} className={`p-4 cursor-pointer border-l-4 ${selectedConvoId === convo.id ? 'border-dortmed-500 bg-white dark:bg-gray-700' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                            <div className="flex items-center space-x-3">
                                <UserCircleIcon className="w-8 h-8 text-gray-400" />
                                <div>
                                    <p className="font-semibold">{convo.patient.first_name} {convo.patient.last_name}</p>
                                    <p className="text-xs text-gray-500">Click to view conversation</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chat Window */}
            <div className="w-2/3">
                {selectedConvoId ? <ChatWindow conversationId={selectedConvoId} /> : <div className="flex h-full items-center justify-center"><p>Select a conversation to begin.</p></div>}
            </div>
        </div>
    );
};

export default CommunicationHubPage;