import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader.jsx';
import { 
  IconUsers, 
  IconFolder, 
  IconUploadCloud, 
  IconFile, 
  IconSend, 
  IconBot,
  IconTrash
} from '../components/Icons.jsx'; // Make sure to import all new icons
import { projectApi, chatApi, teamApi } from '../services/api';

// --- Main Dashboard Component ---
export default function UserDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('projects');
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader onLogout={onLogout} />
      <main>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Header */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.name || user?.email}!
            </h1>
            <p className="text-lg text-gray-600">
              This is your personal <span className="font-semibold text-blue-600">User Dashboard</span>.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-4" aria-label="Tabs">
              <TabButton
                label="Projects & Chat"
                icon={<IconFolder />}
                isActive={activeTab === 'projects'}
                onClick={() => setActiveTab('projects')}
              />
              <TabButton
                label="Team Details"
                icon={<IconUsers />}
                isActive={activeTab === 'team'}
                onClick={() => setActiveTab('team')}
              />
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {activeTab === 'projects' && <ProjectsTab />}
            {activeTab === 'team' && <TeamTab />}
          </div>
          
        </div>
      </main>
    </div>
  );
}

// --- Tab Button Component ---
function TabButton({ label, icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800'}
        flex items-center px-4 py-3 font-medium text-sm rounded-lg shadow-sm transition-all duration-200
      `}
    >
      {React.cloneElement(icon, { className: 'h-5 w-5 mr-2' })}
      {label}
    </button>
  );
}

// --- Projects & Chat Tab ---
function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDatasets, setProjectDatasets] = useState([]);
  const [uploadingDatasets, setUploadingDatasets] = useState(false);
  const [datasetError, setDatasetError] = useState('');

  const [showDatasetPicker, setShowDatasetPicker] = useState(false);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState([]);

  const [projectChats, setProjectChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { _id }
  const [messages, setMessages] = useState([]); // { from: 'user'|'bot', text }
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
          description: p.description,
          teamName: p.team?.name,
          chats: p.chats || [],
        }));
        setProjects(list);
        setLoadingProjects(false);
      } catch (e) {
        console.error('Failed to load projects', e);
        setLoadingProjects(false);
      }
    })();
  }, []);

  // Auto-select first project
  useEffect(() => {
    if (!selectedProjectId && projects.length) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  // Load datasets and chats when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      try {
        const [dsRes, projRes] = await Promise.all([
          projectApi.listDatasets(selectedProjectId),
          projectApi.getProject(selectedProjectId),
        ]);
        const datasets = dsRes?.data?.datasets || [];
        setProjectDatasets(datasets);
        const chats = projRes?.data?.project?.chats || [];
        setProjectChats(chats);
      } catch (e) {
        console.error('Failed to load project data', e);
      }
    })();
  }, [selectedProjectId]);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDatasetUpload = async (evt) => {
    const files = evt.target.files;
    if (!files || !files.length || !selectedProjectId) return;
    setDatasetError('');
    setUploadingDatasets(true);
    try {
      await projectApi.uploadDatasets(selectedProjectId, files);
      // Reload datasets
      const { data } = await projectApi.listDatasets(selectedProjectId);
      setProjectDatasets(data?.datasets || []);
    } catch (e) {
      console.error('Upload failed', e);
      const msg = e?.response?.data?.error || 'Upload failed. Only team admins can upload datasets.';
      setDatasetError(msg);
    } finally {
      setUploadingDatasets(false);
      evt.target.value = '';
    }
  };

  const openStartChat = () => {
    if (!selectedProjectId) return;
    // Reset picker selection
    setSelectedDatasetIds([]);
    setShowDatasetPicker(true);
  };

  const confirmStartChat = async () => {
    if (!selectedProjectId) return;
    try {
      const { data } = await chatApi.createEmptyChat(selectedProjectId);
      const chat = data?.chat;
      if (chat?._id) {
        setActiveChat(chat);
        // reflect new chat in list
        setProjectChats((prev) => [...prev, chat]);
        setMessages([{ from: 'bot', text: 'Chat created. Ask anything about your selected datasets.' }]);
      }
    } catch (e) {
      console.error('Failed to create chat', e);
    } finally {
      setShowDatasetPicker(false);
    }
  };

  const loadChatHistory = async (projectId, chatId) => {
    try {
      const { data } = await chatApi.getChatHistory(projectId, chatId);
      const chat = data?.chat;
      const msgs = (chat?.messages || []).map((m) => ({
        from: m.sender === 'chatbot' ? 'bot' : 'user',
        text: m.content || '',
      }));
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load chat history', e);
      setMessages([]);
    }
  };

  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    if (selectedProjectId && chat?._id) {
      await loadChatHistory(selectedProjectId, chat._id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedProjectId || !activeChat?._id) return;

    const userMessage = { from: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentText = input;
    setInput('');

    try {
      // Send user message with selected datasets (include on every message to keep context)
      const { data: sendRes } = await chatApi.sendUserMessage({
        projectId: selectedProjectId,
        chatId: activeChat._id,
        content: currentText,
        files: [],
        selectedDatasetIds,
      });

      // If backend returns a chatId (safety), ensure activeChat is synced
      if (sendRes?.chatId && sendRes.chatId !== activeChat._id) {
        setActiveChat((prev) => ({ ...(prev || {}), _id: sendRes.chatId }));
      }

      // Ask AI to reply
      const { data } = await chatApi.aiReply({ projectId: selectedProjectId, chatId: activeChat._id, content: currentText });
      const botText = data?.botReply || 'Received.';
      setMessages((prev) => [...prev, { from: 'bot', text: botText }]);
    } catch (e) {
      console.error('Message send failed', e);
      setMessages((prev) => [...prev, { from: 'bot', text: 'There was an error processing your message.' }]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-[75vh]">
      {/* Left: Projects, Datasets, Chats */}
      <div className="p-6 border-r border-gray-200 flex flex-col">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Projects</h2>

        {loadingProjects ? (
          <p className="text-sm text-gray-500">Loading projects…</p>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2">
            {/* Project selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Select project:</label>
              <select
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Dataset upload */}
            <div className="mt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Datasets</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <IconUploadCloud className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-xs text-gray-600">Upload dataset files for this project</p>
                <div className="mt-2">
                  <input type="file" multiple onChange={handleDatasetUpload} />
                </div>
                {uploadingDatasets && (
                  <p className="text-xs text-blue-600 mt-2">Uploading…</p>
                )}
                {datasetError && (
                  <p className="text-xs text-red-600 mt-2">{datasetError}</p>
                )}
              </div>

              <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                {projectDatasets?.length ? (
                  projectDatasets.map((d) => (
                    <div key={d._id || d.url} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="flex items-center min-w-0">
                        <IconFile className="h-4 w-4 text-blue-500 mr-2" />
                        <p className="text-xs text-gray-700 truncate" title={d.name}>{d.name}</p>
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(d.uploadedAt).toLocaleDateString?.() || ''}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No datasets uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Start Chat */}
            <div className="mt-4">
              <button
                onClick={openStartChat}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-blue-700"
              >
                Start Chat
              </button>
            </div>

            {/* Chats list */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Chats</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projectChats?.length ? (
                  projectChats.map((c, idx) => (
                    <button
                      key={c._id || idx}
                      className={`w-full text-left px-3 py-2 border rounded text-sm ${activeChat?._id === c._id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      onClick={() => handleSelectChat(c)}
                    >
                      Chat {idx + 1}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No chats created yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Chat panel */}
      <div className="p-6 flex flex-col h-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat with your Data</h2>

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 bg-gray-50 rounded-md">
            Select or start a chat to begin.
          </div>
        ) : (
          <>
            <div className="flex-grow bg-gray-50 rounded-lg p-4 space-y-4 overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-start gap-2 max-w-xs md:max-w-md">
                    {msg.from === 'bot' && (
                      <div className="bg-gray-200 p-2 rounded-full flex-shrink-0">
                        <IconBot className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <div
                      className={`
                        py-2 px-4 rounded-xl text-sm
                        ${msg.from === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}
                      `}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your selected datasets…"
                className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-5 py-3 flex items-center justify-center font-semibold hover:bg-blue-700 transition-colors"
              >
                <IconSend className="h-5 w-5" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* Dataset selection modal */}
      {showDatasetPicker && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800">Select datasets for this chat</h3>
            <p className="text-xs text-gray-500 mb-3">Choose one or more datasets that the assistant should use.</p>
            <div className="max-h-60 overflow-y-auto border rounded p-3 space-y-2">
              {projectDatasets?.length ? (
                projectDatasets.map((d) => (
                  <label key={d._id || d.url} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDatasetIds.includes(d._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedDatasetIds((prev) =>
                          checked ? [...prev, d._id] : prev.filter((id) => id !== d._id)
                        );
                      }}
                    />
                    <span className="truncate" title={d.name}>{d.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-gray-500">No datasets available for this project. You can still start a chat.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                onClick={() => setShowDatasetPicker(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={confirmStartChat}
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Team Tab ---
function TeamTab() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Get teams the authenticated user belongs to
        const { data: teamsRes } = await teamApi.getTeams();
        const firstTeamId = teamsRes?.teams?.[0]?._id;
        if (!firstTeamId) {
          setTeamMembers([]);
          setLoading(false);
          return;
        }

        // Fetch team details with populated members
        const { data: teamRes } = await teamApi.getTeam(firstTeamId);
        const members = (teamRes?.team?.members || []).map((m) => ({
          id: m?.user?._id || m?.user,
          name: m?.user?.name || 'Unnamed',
          // Show team-specific role (member | team_admin)
          role: m?.role || 'member',
          email: m?.user?.email || '',
        }));
        setTeamMembers(members);
      } catch (e) {
        console.error('Failed to load team members', e);
        setError('Failed to load team members.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Team Members</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading team members…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : teamMembers.length === 0 ? (
        <p className="text-sm text-gray-500">No team members found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((person) => (
                <tr key={person.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{person.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{person.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{person.email}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
