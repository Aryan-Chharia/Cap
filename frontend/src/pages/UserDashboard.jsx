import React, { useState, useEffect, useRef } from 'react';
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

// --- Main Dashboard Component ---
export default function UserDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader onLogout={onLogout} />
      <main>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Header */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user.name}!
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
  const [files, setFiles] = useState([
    { id: 1, name: 'Q4_Earnings_Report.pdf', size: 12.5 },
    { id: 2, name: 'Market_Analysis_v3.docx', size: 2.1 },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! Upload your files and ask me anything about them.' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file "upload"
  const handleFileUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    // --- FAKE UPLOAD ---
    // Simulating a file upload delay
    setTimeout(() => {
      const newFile = {
        id: files.length + 1,
        name: `new_document_${files.length + 1}.pdf`,
        size: (Math.random() * 10 + 1).toFixed(1),
      };
      setFiles([...files, newFile]);
      setIsUploading(false);
      setMessages(prev => [...prev, { from: 'bot', text: `Successfully uploaded ${newFile.name}!` }]);
    }, 1500);
  };

  // Handle file "removal"
  const handleRemoveFile = (fileId) => {
    const fileName = files.find(f => f.id === fileId)?.name;
    setFiles(files.filter(f => f.id !== fileId));
    setMessages(prev => [...prev, { from: 'bot', text: `Removed ${fileName}.` }]);
  };

  // Handle sending a chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // --- FAKE BACKEND/LLM CALL ---
    // Simulating a bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: 'Processing your request... ' }]);
    }, 1000);

    setTimeout(() => {
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove "Processing" message
        { from: 'bot', text: `Based on your documents, the answer to "${userMessage.text}" is... [mock data].` }
      ]);
    }, 2500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-[75vh]">
      
      {/* Left Side: File Management */}
      <div className="p-6 border-r border-gray-200 flex flex-col">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Files</h2>
        
        {/* File Upload Area */}
        <div 
          onDrop={handleFileUpload}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6"
        >
          <IconUploadCloud className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop files here, or
            <button 
              onClick={handleFileUpload}
              className="font-semibold text-blue-600 hover:text-blue-500 ml-1"
            >
              click to upload
            </button>
          </p>
          {isUploading && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
        </div>

        {/* File List */}
        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center min-w-0">
                <IconFile className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.size} MB</p>
                </div>
              </div>
              <button onClick={() => handleRemoveFile(file.id)} className="text-gray-400 hover:text-red-500 ml-4">
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
          {files.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No files uploaded yet.</p>
          )}
        </div>
      </div>

      {/* Right Side: Chatbot */}
      <div className="p-6 flex flex-col h-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat with your Data</h2>
        
        {/* Chat Messages */}
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

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your files..."
            className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-5 py-3 flex items-center justify-center font-semibold hover:bg-blue-700 transition-colors"
          >
            <IconSend className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Team Tab ---
function TeamTab() {
  const teamMembers = [
    { id: 1, name: 'Alice Johnson', role: 'Project Manager', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', role: 'Lead Developer', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Brown', role: 'UX Designer', email: 'charlie@example.com' },
    { id: 4, name: 'David Lee', role: 'Data Analyst', email: 'david@example.com' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Team Members</h2>
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
    </div>
  );
}
