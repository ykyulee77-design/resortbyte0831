import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: '안녕하세요! 리조트바이트에 오신 것을 환영합니다.', sender: 'system', timestamp: new Date() },
    { id: 2, text: '채팅 기능이 곧 업데이트될 예정입니다.', sender: 'system', timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-resort-600 text-white px-6 py-4 rounded-t-lg">
          <h1 className="text-xl font-semibold">채팅</h1>
          <p className="text-resort-100 text-sm">실시간 메시징</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-resort-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <button className="p-2 text-gray-500 hover:text-resort-600">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-resort-600">
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-resort-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-resort-600 text-white p-2 rounded-lg hover:bg-resort-700"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 