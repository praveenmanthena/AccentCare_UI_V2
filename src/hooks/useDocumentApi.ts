import { useState, useEffect } from 'react';
import { Document, DocumentContent, FilesApiResponse } from '../types';
import { apiClient } from '../services/apiClient';

export const useDocumentApi = (docId: string | null) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentContent, setDocumentContent] = useState<Record<string, Record<number, DocumentContent>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async (docId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data: FilesApiResponse = await apiClient.get(`/files/${docId}`);
      
      // Transform files array to Document array
      const transformedDocuments: Document[] = data.files.map((fileName) => {
        const pageCount = Object.keys(data.presigned_urls[fileName] || {}).length;
        return {
          id: fileName,
          name: fileName,
          type: fileName.includes('485') ? 'Physician Order' : 
                fileName.includes('H&P') ? 'Assessment' :
                fileName.includes('Visit Note') ? 'Clinical Notes' :
                fileName.includes('Coordination') ? 'Care Plan' : 'Document',
          date: new Date().toLocaleDateString(), // Fallback date
          pages: pageCount
        };
      });

      // Transform presigned_urls to documentContent structure
      const transformedContent: Record<string, Record<number, DocumentContent>> = {};
      
      Object.entries(data.presigned_urls).forEach(([fileName, pages]) => {
        transformedContent[fileName] = {};
        
        Object.entries(pages).forEach(([pageNum, imageUrl]) => {
          const pageNumber = parseInt(pageNum);
          transformedContent[fileName][pageNumber] = {
            title: `${fileName} - Page ${pageNumber}`,
            imageUrl: imageUrl,
            width: 800, // Default width
            height: 1000, // Default height
            annotations: [] // Empty for now as API doesn't provide annotations
          };
        });
      });

      setDocuments(transformedDocuments);
      setDocumentContent(transformedContent);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      
      // Fallback to empty state on error
      setDocuments([]);
      setDocumentContent({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) {
      fetchDocuments(docId);
    } else {
      setDocuments([]);
      setDocumentContent({});
      setLoading(false);
      setError(null);
    }
  }, [docId]);

  return {
    documents,
    documentContent,
    loading,
    error,
    refetch: () => docId && fetchDocuments(docId)
  };
};