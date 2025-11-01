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
  const [attachFiles, setAttachFiles] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalDatasets, setModalDatasets] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState([]);
  const [modalUploading, setModalUploading] = useState(false);
  const [modalError, setModalError] = useState('');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const openNewChat = async () => {
    if (!selectedProjectId) return;
    try {
      const { data } = await projectApi.listDatasets(selectedProjectId);
      setModalDatasets(data?.datasets || []);
      setModalSelectedIds([]);
      setModalError('');
      setShowNewChatModal(true);
    } catch (e) {
      console.error('Failed to load datasets for new chat', e);
      setModalDatasets([]);
      setModalSelectedIds([]);
      setShowNewChatModal(true);
    }
  };

  const handleModalUpload = async (evt) => {
    const files = evt.target.files;
    if (!files || !files.length || !selectedProjectId) return;
    setModalError('');
    setModalUploading(true);
    try {
      await projectApi.uploadDatasets(selectedProjectId, files);
      const { data } = await projectApi.listDatasets(selectedProjectId);
      setModalDatasets(data?.datasets || []);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Upload failed.';
      setModalError(msg);
    } finally {
      setModalUploading(false);
      evt.target.value = '';
    }
  };

  const confirmCreateChat = async () => {
    if (!selectedProjectId) return;
    try {
      const { data } = await chatApi.createEmptyChat(selectedProjectId);
      const chat = data?.chat;
      if (chat?._id) {
        // Persist selected datasets for this chat only
        const key = `selectedDatasets:${chat._id}`;
        localStorage.setItem(key, JSON.stringify(modalSelectedIds));
        setProjectChats((prev) => [...prev, chat]);
        setActiveChat(chat);
        setMessages([{ from: 'bot', text: 'New chat created. Ask your question to begin.' }]);
      }
    } catch (e) {
      console.error('Failed to create chat', e);
    } finally {
      setShowNewChatModal(false);
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
    if (!selectedProjectId || !activeChat?._id) return;
    const typed = input.trim();
    const hasFiles = (attachFiles && attachFiles.length > 0);
    // Retrieve dataset selection stored for this chat
    const dsKey = `selectedDatasets:${activeChat._id}`;
    let selectedDatasetIds = [];
    try {
      const stored = localStorage.getItem(dsKey);
      if (stored) selectedDatasetIds = JSON.parse(stored);
    } catch (_) {}
    const hasSelection = Array.isArray(selectedDatasetIds) && selectedDatasetIds.length > 0;

    // If user didn't type anything but has datasets or files, auto-use "Analyze these"
    if (!typed && !(hasSelection || hasFiles)) {
      // No datasets selected and no files => no answer per new flow
      return;
    }
    const currentText = typed || 'Analyze these';
    setInput('');
    // Show the user's message (including the auto text)
    setMessages((prev) => [...prev, { from: 'user', text: currentText }]);

    try {
      await chatApi.sendUserMessage({
        projectId: selectedProjectId,
        chatId: activeChat._id,
        content: currentText,
        files: (attachFiles || []),
        selectedDatasetIds,
      });
      // During chat, if the user sent a message (typed or auto 'Analyze these'), always ask AI to reply
      const { data } = await chatApi.aiReply({ projectId: selectedProjectId, chatId: activeChat._id, content: currentText });
      const botText = data?.botReply;
      if (botText) {
        setMessages((prev) => [...prev, { from: 'bot', text: botText }]);
      }
    } catch (e) {
      console.error('Message send failed', e);
      setMessages((prev) => [...prev, { from: 'bot', text: 'There was an error processing your message.' }]);
    }
    setAttachFiles([]);
    // Reset the file input so selecting the same file again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            onClick={openNewChat}
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
                  {c.title || `Chat ${idx + 1}`}
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
            {/* Dataset selection is only offered at new chat creation time */}
            <button
              className="w-full text-left px-3 py-2 rounded border text-sm hover:bg-gray-50 disabled:opacity-50"
              onClick={async () => {
                if (!activeChat?._id || !selectedProjectId) return;
                const current = projectChats.find((c) => c._id === activeChat._id);
                const proposed = window.prompt('Rename chat', current?.title || '');
                const title = (proposed || '').trim();
                if (!title) return;
                try {
                  const { data } = await chatApi.renameChat({ projectId: selectedProjectId, chatId: activeChat._id, title });
                  const updated = data?.chat;
                  if (updated?._id) {
                    setProjectChats((prev) => prev.map((c) => (c._id === updated._id ? { ...c, title: updated.title } : c)));
                    setActiveChat((prev) => (prev && prev._id === updated._id ? { ...prev, title: updated.title } : prev));
                  }
                } catch (e) {
                  console.error('Rename failed', e);
                }
              }}
              disabled={!activeChat?._id}
            >
              Rename current chat
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
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => setAttachFiles(Array.from(e.target.files || []))}
                title="Attach files (chat-only; not saved to project)"
              />
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-5 py-3 flex items-center justify-center font-semibold hover:bg-blue-700">
                <IconSend className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Chat modal: upload/select datasets only at creation time */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800">Start a new chat</h3>
            <p className="text-xs text-gray-500 mb-3">Optionally upload datasets to the project and select which ones this chat should use.</p>

            <div className="border rounded p-3 mb-3">
              <p className="text-sm font-medium text-gray-700">Upload datasets to project</p>
              <input type="file" multiple onChange={handleModalUpload} className="mt-2" />
              {modalUploading && <p className="text-xs text-blue-600 mt-2">Uploading…</p>}
              {modalError && <p className="text-xs text-red-600 mt-2">{modalError}</p>}
            </div>

            <div className="border rounded p-3 mb-3 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">Select datasets for this chat</p>
              {modalDatasets.length ? (
                modalDatasets.map((d) => (
                  <label key={d._id || d.url} className="flex items-center gap-2 text-sm py-1">
                    <input
                      type="checkbox"
                      checked={modalSelectedIds.includes(d._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setModalSelectedIds((prev) =>
                          checked ? [...prev, d._id] : prev.filter((id) => id !== d._id)
                        );
                      }}
                    />
                    <span className="truncate" title={d.name}>{d.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-gray-500">No datasets uploaded yet.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 text-sm rounded border hover:bg-gray-50" onClick={() => setShowNewChatModal(false)}>Cancel</button>
              <button className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" onClick={confirmCreateChat} disabled={!selectedProjectId}>Create chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
