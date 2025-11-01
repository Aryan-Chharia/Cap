import React, { useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader.jsx';
import { projectApi } from '../services/api';

export default function DatasetSelectionPage({ onLogout, navigateTo, selectedProjectId, setSelectedProjectId }) {
  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await projectApi.getProjects();
        const list = (data?.projects || []).map((p) => ({ _id: p._id, name: p.name }));
        setProjects(list);
        if (!selectedProjectId && list.length) setSelectedProjectId?.(list[0]._id);
      } catch (e) {
        console.error('Failed to load projects', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) { setDatasets([]); setSelected([]); return; }
    (async () => {
      try {
        const { data } = await projectApi.listDatasets(selectedProjectId);
        const ds = data?.datasets || [];
        setDatasets(ds);
        const dsKey = `selectedDatasets:${selectedProjectId}`;
        try {
          const stored = localStorage.getItem(dsKey);
          setSelected(stored ? JSON.parse(stored) : []);
        } catch (_) {
          setSelected([]);
        }
      } catch (e) {
        console.error('Failed to load datasets', e);
      }
    })();
  }, [selectedProjectId]);

  const toggle = (id, checked) => {
    setSelected((prev) => {
      if (checked) return [...new Set([...prev, id])];
      return prev.filter((x) => x !== id);
    });
  };

  const saveSelection = () => {
    if (!selectedProjectId) return;
    const dsKey = `selectedDatasets:${selectedProjectId}`;
    localStorage.setItem(dsKey, JSON.stringify(selected));
    navigateTo?.('userChat');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader onLogout={onLogout} />
      <main>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-4">Select datasets</h1>

          <div className="mb-4">
            <label className="text-sm text-gray-600">Project</label>
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

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <p className="text-sm text-gray-700">Choose one or more datasets that the assistant should use.</p>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {datasets.length ? (
                datasets.map((d) => (
                  <label key={d._id || d.url} className="flex items-center gap-2 text-sm border rounded p-2">
                    <input type="checkbox" checked={selected.includes(d._id)} onChange={(e) => toggle(d._id, e.target.checked)} />
                    <span className="truncate" title={d.name}>{d.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No datasets available for this project. You can still chat.</p>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button className="px-4 py-2 text-sm rounded border hover:bg-gray-50" onClick={() => navigateTo?.('userProjects')}>Back</button>
              <button className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" onClick={saveSelection} disabled={!selectedProjectId}>Save & Continue</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
