import { useState, useEffect, useCallback } from 'react';
import { AITag } from '../types/content-extraction';
import { 
  getTags,
  createTag,
  updateTag,
  deleteTag
} from '../services/api';

const useTags = () => {
  const [tags, setTags] = useState<AITag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tagList = await getTags();
      setTags(tagList);
    } catch (err) {
      setError('Failed to fetch tags');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTag = useCallback(async (tagData: { tag: string; source: string }): Promise<AITag> => {
    setIsLoading(true);
    setError(null);
    try {
      const newTag = await createTag(tagData);
      await fetchTags(); // Refresh tag list
      return newTag;
    } catch (err) {
      setError('Failed to create tag');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTags]);

  const editTag = useCallback(async (tagId: number, tagData: { tag: string; source: string }): Promise<AITag> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedTag = await updateTag(tagId, tagData);
      await fetchTags(); // Refresh tag list
      return updatedTag;
    } catch (err) {
      setError('Failed to update tag');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTags]);

  const removeTag = useCallback(async (tagId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteTag(tagId);
      await fetchTags(); // Refresh tag list
    } catch (err) {
      setError('Failed to delete tag');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchTags]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    addTag,
    editTag,
    removeTag
  };
};

export default useTags;