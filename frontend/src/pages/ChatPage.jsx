import React, { useEffect, useRef, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import { chatApi, projectApi } from '../services/api';
import { IconSend, IconBot } from '../components/Icons.jsx';

export default function ChatPage({ onLogout, navigateTo, selectedProjectId, setSelectedProjectId }) {
  const [projects, setProjects] = useState([]);
  const [projectChats, setProjectChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Load projects on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await projectApi.getProjects();
        const list = (data?.projects || []).map((p) => ({
          _id: p._id,
          name: p.name,
          chats: p.chats || [],
        }));
        setProjects(list);
        // Initialize selected project
        if (!selectedProjectId && list.length) {
          setSelectedProjectId?.(list[0]._id);
        }
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    })();
  }, []);

  // Load chats when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      try {
        const { data } = await projectApi.getProject(selectedProjectId);
        const chats = data?.project?.chats || [];
        setProjectChats(chats);
        setActiveChat(null);
        setMessages([]);
      } catch (e) {
        console.error('Failed to load project', e);
      }
    })();
  }, [selectedProjectId]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const newChat = async () => {
    if (!selectedProjectId) return;
    try {
      const { data } = await chatApi.createEmptyChat(selectedProjectId);
      const chat = data?.chat;
      if (chat?._id) {
        setProjectChats((prev) => [...prev, chat]);
        setActiveChat(chat);
        setMessages([{ from: 'bot', text: 'New chat created. Ask your question to begin.' }]);
      }
    } catch (e) {
      console.error('Failed to create chat', e);
    }
  };

  const openChat = async (chat) => {
    setActiveChat(chat);
    try {
      const { data } = await chatApi.getChatHistory(selectedProjectId, chat._id);
      const msgs = (data?.chat?.messages || []).map((m) => ({
        from: m.sender === 'chatbot' ? 'bot' : 'user',
        text: m.content || '',
      }));
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load chat history', e);
      setMessages([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedProjectId || !activeChat?._id) return;
    const currentText = input;
    setInput('');
    setMessages((prev) => [...prev, { from: 'user', text: currentText }]);

    // Retrieve dataset selection stored for the project
    const dsKey = `selectedDatasets:${selectedProjectId}`;
    let selectedDatasetIds = [];
    try {
      const stored = localStorage.getItem(dsKey);
      if (stored) selectedDatasetIds = JSON.parse(stored);
    } catch (_) {}

    try {
      await chatApi.sendUserMessage({
        projectId: selectedProjectId,
        chatId: activeChat._id,
        content: currentText,
        files: [],
        selectedDatasetIds,
      });

      const { data } = await chatApi.aiReply({ projectId: selectedProjectId, chatId: activeChat._id, content: currentText });
      const botText = data?.botReply || 'Received.';
      setMessages((prev) => [...prev, { from: 'bot', text: botText }]);
    } catch (e) {
      console.error('Message send failed', e);
      setMessages((prev) => [...prev, { from: 'bot', text: 'There was an error processing your message.' }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <AppHeader onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (ChatGPT-like) */}
        <div className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col">
          <div className="mb-3">
            <label className="text-xs text-gray-600">Project</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId?.(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={newChat}
            className="mb-3 w-full text-left px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + New chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1">
            {projectChats?.length ? (
              projectChats.map((c, idx) => (
                <button
                  key={c._id || idx}
                  onClick={() => openChat(c)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${activeChat?._id === c._id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                >
                  Chat {idx + 1}
                </button>
              ))
            ) : (
              <p className="text-xs text-gray-500">No chats yet.</p>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
            <button
              className="w-full text-left px-3 py-2 rounded border text-sm hover:bg-gray-50"
              onClick={() => navigateTo?.('userProjects')}
            >
              ← Projects
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded border text-sm hover:bg-gray-50"
              onClick={() => navigateTo?.('datasetSelect')}
              disabled={!selectedProjectId}
            >
              Select datasets
            </button>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-start gap-2 max-w-[80%]">
                    {msg.from === 'bot' && (
                      <div className="bg-gray-200 p-2 rounded-full flex-shrink-0">
                        <IconBot className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div className={`${msg.from === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none'} py-2 px-4 text-sm`} style={{ wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-5 py-3 flex items-center justify-center font-semibold hover:bg-blue-700">
                <IconSend className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
