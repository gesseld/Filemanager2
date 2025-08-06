import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AITag } from '../types/content-extraction';
import { getTags, createTag, updateTag, deleteTag } from '../services/api';

const TagManagementScreen: React.FC = () => {
  const [tags, setTags] = useState<AITag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<AITag | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsData = await getTags();
        setTags(tagsData);
      } catch (err) {
        setError('Failed to load tags');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const createdTag = await createTag({
        tag: newTagName.trim(),
        source: 'manual'
      });
      setTags([...tags, createdTag]);
      setNewTagName('');
    } catch (err) {
      setError('Failed to create tag');
      console.error(err);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    
    try {
      const updatedTag = await updateTag(editingTag.id, {
        tag: editingTag.tag,
        source: editingTag.source
      });
      setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t));
      setEditingTag(null);
    } catch (err) {
      setError('Failed to update tag');
      console.error(err);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      await deleteTag(tagId);
      setTags(tags.filter(t => t.id !== tagId));
    } catch (err) {
      setError('Failed to delete tag');
      console.error(err);
    }
  };

  if (loading) return <div>Loading tags...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="tag-management">
      <h1>Tag Management</h1>
      
      <div className="tag-creation">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name"
        />
        <button onClick={handleCreateTag}>Create Tag</button>
      </div>

      {editingTag && (
        <div className="tag-editing">
          <input
            type="text"
            value={editingTag.tag}
            onChange={(e) => setEditingTag({...editingTag, tag: e.target.value})}
          />
          <button onClick={handleUpdateTag}>Save</button>
          <button onClick={() => setEditingTag(null)}>Cancel</button>
        </div>
      )}

      <div className="tags-list">
        <h2>Existing Tags</h2>
        <ul>
          {tags.map(tag => (
            <li key={tag.id}>
              <span>{tag.tag}</span>
              <span>({tag.source})</span>
              <button onClick={() => setEditingTag(tag)}>Edit</button>
              <button onClick={() => handleDeleteTag(tag.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TagManagementScreen;