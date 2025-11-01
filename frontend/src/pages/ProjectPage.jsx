import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import { projectApi, teamApi } from '../services/api';

export default function ProjectPage({ onLogout, navigateTo, selectedProjectId, setSelectedProjectId }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Create project UI state
  const [teams, setTeams] = useState([]);
  const [adminTeams, setAdminTeams] = useState([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectTeamId, setNewProjectTeamId] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [{ data: projRes }, { data: teamRes }] = await Promise.all([
          projectApi.getProjects(),
          teamApi.getTeams(),
        ]);
        const list = (projRes?.projects || []).map((p) => ({ _id: p._id, name: p.name, description: p.description, chats: p.chats || [] }));
        setProjects(list);
        setLoading(false);
        if (!selectedProjectId && list.length) setSelectedProjectId?.(list[0]._id);

        const teamsList = teamRes?.teams || [];
        setTeams(teamsList);
        // derive admin teams
        const userStr = localStorage.getItem('user');
        const me = userStr ? JSON.parse(userStr) : null;
        const myId = me?.id || me?._id;
        const admins = teamsList.filter(t => (t.members || []).some(m => (m.user === myId || m.user?._id === myId) && m.role === 'team_admin'));        
        setAdminTeams(admins);
        if (admins.length === 1) setNewProjectTeamId(admins[0]._id);
      } catch (e) {
        console.error('Failed to load projects/teams', e);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return setDatasets([]);
    (async () => {
      try {
        const { data } = await projectApi.listDatasets(selectedProjectId);
        setDatasets(data?.datasets || []);
      } catch (e) {
        console.error('Failed to load datasets', e);
      }
    })();
  }, [selectedProjectId]);

  const handleUpload = async (evt) => {
    const files = evt.target.files;
    if (!files || !files.length || !selectedProjectId) return;
    setError('');
    setUploading(true);
    try {
      await projectApi.uploadDatasets(selectedProjectId, files);
      const { data } = await projectApi.listDatasets(selectedProjectId);
      setDatasets(data?.datasets || []);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Upload failed.';
      setError(msg);
    } finally {
      setUploading(false);
      evt.target.value = '';
    }
  };

  const openCreateProject = () => {
    setCreateError('');
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateProject(true);
  };

  const confirmCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectTeamId) {
      setCreateError('Project name and team are required.');
      return;
    }
    try {
      setCreatingProject(true);
      setCreateError('');
      const payload = { name: newProjectName.trim(), description: newProjectDesc.trim(), team: newProjectTeamId };
      const { data } = await projectApi.createProject(payload);
      const proj = data?.project;
      if (proj?._id) {
        const newEntry = { _id: proj._id, name: proj.name, description: proj.description, chats: [] };
        setProjects(prev => [newEntry, ...prev]);
        setSelectedProjectId?.(proj._id);
      }
      setShowCreateProject(false);
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to create project.';
      setCreateError(msg);
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader onLogout={onLogout} />
      <main>
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Projects</h1>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={() => navigateTo?.('userTeam')}>Team Details</button>
              {adminTeams.length > 0 && (
                <button onClick={openCreateProject} className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Create Project</button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading projects…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Select project</label>
                  <select className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mt-1" value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId?.(e.target.value)}>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={() => navigateTo?.('userChat')} disabled={!selectedProjectId}>Open Chat</button>
                  <button className="flex-1 px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={() => navigateTo?.('datasetSelect')} disabled={!selectedProjectId}>Select Datasets</button>
                </div>
                <div className="border rounded-md p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Datasets</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <p className="mt-2 text-xs text-gray-600">Upload dataset files for this project</p>
                    <div className="mt-2">
                      <input type="file" multiple onChange={handleUpload} />
                    </div>
                    {uploading && <p className="text-xs text-blue-600 mt-2">Uploading…</p>}
                    {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 border-b">
                    <h2 className="text-sm font-semibold text-gray-700">Project datasets ({datasets.length})</h2>
                  </div>
                  <div className="max-h-[55vh] overflow-y-auto p-4 space-y-2">
                    {datasets.length ? (
                      datasets.map((d) => (
                        <div key={d._id || d.url} className="flex items-center justify-between px-3 py-2 border rounded text-sm">
                          <span className="truncate" title={d.name}>{d.name}</span>
                          <span className="text-[10px] text-gray-400">{new Date(d.uploadedAt).toLocaleDateString?.() || ''}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No datasets uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreateProject && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800">Create a new project</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project name</label>
                <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Enter project name" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
                <textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" rows={3} placeholder="Short description" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Team</label>
                {adminTeams.length <= 1 ? (
                  <input type="text" readOnly className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm" value={adminTeams[0]?.name || 'Your team'} />
                ) : (
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={newProjectTeamId} onChange={(e) => setNewProjectTeamId(e.target.value)}>
                    <option value="">Select a team…</option>
                    {adminTeams.map(t => (<option key={t._id} value={t._id}>{t.name}</option>))}
                  </select>
                )}
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50" onClick={() => setShowCreateProject(false)} disabled={creatingProject}>Cancel</button>
              <button className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={confirmCreateProject} disabled={creatingProject}>{creatingProject ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
