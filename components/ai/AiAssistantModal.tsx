import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext.ts';
import { chatWithAssistant } from '../../services/geminiService.ts';
import { generateId } from '../../utils/idUtils.ts';
import { AiSparkleIcon } from '../shared/Icons.tsx';

const AiAssistantModal = ({ isOpen, onClose }) => {
    const context = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: 'initial', sender: 'ai', text: 'سلام! من دستیار هوشمند شما هستم. چطور می‌توانم کمکتان کنم؟' }
            ]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !context) return;
        const userInput = { id: generateId('chat'), sender: 'user', text: input };
        const loadingMessage = { id: generateId('chat'), sender: 'ai', text: '...', isLoading: true };

        setMessages(prev => [...prev, userInput, loadingMessage]);
        setInput('');

        const { orders, products, workflows, proformas } = context;
        const aiResponse = await chatWithAssistant(input, { orders, products, workflows, proformas });

        const finalAiMessage = {
            id: loadingMessage.id, // Replace the loading message
            sender: 'ai',
            text: aiResponse.text || 'خطایی رخ داد.',
            actions: aiResponse.actions,
        };
        
        setMessages(prev => prev.map(msg => msg.id === loadingMessage.id ? finalAiMessage : msg));
    };

    const handleActionClick = (action) => {
        if (action.action_type === 'navigation' && context) {
            context.setActiveView(action.payload.view);
            onClose();
        }
    };

    if (!context) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center sm:justify-end ai-chat-modal ${isOpen ? 'open' : 'closed'}`}>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <AiSparkleIcon className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-800">دستیار هوشمند</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">&times;</button>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'ai-message-user rounded-br-lg' : 'ai-message-ai rounded-bl-lg'}`}>
                                {msg.isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>
                             {msg.actions && (
                                <div className="mt-2 flex gap-2">
                                    {msg.actions.map((action, index) => (
                                        <button key={index} onClick={() => handleActionClick(action)} className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors">
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="پیام خود را بنویسید..."
                            className="w-full p-3 pr-12 border rounded-full bg-gray-100 focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleSend} className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3.105 3.105a.75.75 0 01.99 0L19.5 17.575a.75.75 0 01-1.06 1.06L3.105 4.165a.75.75 0 010-1.06z" /><path d="M19.5 3.525a.75.75 0 010 1.06l-14.47 14.47a.75.75 0 01-1.06-1.06L18.44 3.525a.75.75 0 011.06 0z" transform="rotate(-90 12 12)" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiAssistantModal;