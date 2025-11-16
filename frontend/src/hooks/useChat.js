import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const useChat = (conversationId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const websocket = useRef(null);

    const connect = useCallback(() => {
        const token = localStorage.getItem('access_token');
        if (!token || !conversationId) return;

        // Use wss:// for secure production environments
        const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://")
                    + "localhost:8000" // Replace with your backend host in production
                    + `/api/chat/ws/${conversationId}?token=${token}`;

        websocket.current = new WebSocket(wsUrl);

        websocket.current.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        websocket.current.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);
            setMessages(prev => [...prev, newMessage]);
        };

        websocket.current.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
        };

        websocket.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            toast.error("Chat connection error.");
            setIsConnected(false);
        };

    }, [conversationId]);

    useEffect(() => {
        connect();

        return () => {
            if (websocket.current) {
                websocket.current.close();
            }
        };
    }, [connect]);

    const sendMessage = (messageContent) => {
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            websocket.current.send(messageContent);
        } else {
            toast.error("Chat is not connected.");
        }
    };

    return { messages, setMessages, sendMessage, isConnected };
};

export default useChat;