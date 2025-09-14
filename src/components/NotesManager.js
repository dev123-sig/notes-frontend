import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import NoteForm from './NoteForm';
import FormattedText from './FormattedText';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const NotesManager = ({ tenantStats, onStatsUpdate }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch notes when debounced search term changes
  useEffect(() => {
    fetchNotes();
  }, [debouncedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = debouncedSearchTerm ? { search: debouncedSearchTerm } : {};
      const response = await api.getNotes(params);
      
      if (response.success) {
        setNotes(response.data.notes);
      }
    } catch (error) {
      showError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    if (tenantStats?.tenant.plan === 'free' && tenantStats?.noteCount >= 3) {
      showError('Note limit reached. Upgrade to Pro plan for unlimited notes.');
      return;
    }
    setEditingNote(null);
    setShowForm(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleFormSubmit = async (noteData) => {
    try {
      let response;
      if (editingNote) {
        response = await api.updateNote(editingNote._id, noteData);
        showSuccess('Note updated successfully');
      } else {
        response = await api.createNote(noteData);
        showSuccess('Note created successfully');
      }
      
      if (response.success) {
        fetchNotes();
        onStatsUpdate && onStatsUpdate();
        setShowForm(false);
        setEditingNote(null);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save note';
      showError(message);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await api.deleteNote(noteId);
      if (response.success) {
        showSuccess('Note deleted successfully');
        fetchNotes();
        onStatsUpdate && onStatsUpdate();
        setDeletingNote(null);
      }
    } catch (error) {
      showError('Failed to delete note');
    }
  };

  const isAtLimit = tenantStats?.tenant.plan === 'free' && tenantStats?.noteCount >= 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Your Notes</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {tenantStats && (
              <>
                {tenantStats.noteCount} of {tenantStats.noteLimit || '∞'} notes used
                {isAtLimit && (
                  <span className="ml-2 font-medium" style={{ color: 'var(--accent-error)' }}>
                    • Limit reached
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        
        <button
          onClick={handleCreateNote}
          disabled={isAtLimit}
          className={`btn-primary glow-hover ${isAtLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Note
        </button>
      </div>

      {/* Upgrade warning for free plan */}
      {isAtLimit && (
        <div className="notification scale-in" style={{ 
          borderColor: 'var(--accent-warning)', 
          background: 'rgba(245, 158, 11, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5" style={{ color: 'var(--accent-warning)' }} />
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{ color: 'var(--accent-warning)' }}>
                Note limit reached
              </h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                You've reached the maximum of 3 notes on the Free plan. 
                {user?.role === 'admin' ? (
                  <span> Upgrade to Pro for unlimited notes.</span>
                ) : (
                  <span> Contact your admin to upgrade to Pro plan.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
        </div>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10 glow-hover"
        />
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }} />
          <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No notes found</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm ? 'Try a different search term.' : 'Get started by creating a new note.'}
          </p>
          {!searchTerm && !isAtLimit && (
            <div className="mt-6">
              <button onClick={handleCreateNote} className="btn-primary glow-hover">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Note
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div key={note._id} className="card glow-hover h-80 flex flex-col fade-in">
              <div className="flex items-start justify-between flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {note.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Created by {note.userId.email}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingNote(note)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex-1 overflow-y-auto">
                <FormattedText 
                  text={note.content}
                  className="text-sm text-gray-600"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Form Modal */}
      {showForm && (
        <NoteForm
          note={editingNote}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingNote(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Note</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete "{deletingNote.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setDeletingNote(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNote(deletingNote._id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesManager;
