import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { FiArrowLeft, FiExternalLink, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { documentsAPI } from '../services/api';

const DocumentViewer = () => {
  const { id, documentId } = useParams();
  const docId = id || documentId;
  const navigate = useNavigate();
  const [url, setUrl] = useState(null);
  const [mime, setMime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setError('No document ID provided');
      setLoading(false);
      return;
    }

    let objectUrl = null;
    const fetchDoc = async () => {
      try {
        setLoading(true);
        const res = await documentsAPI.viewDocument(docId);
        const contentType = (res.headers['content-type'] || '').toLowerCase();
        
        // If server returned JSON/text instead of a blob (likely an error message)
        if (!contentType || contentType.includes('application/json') || contentType.includes('text/')) {
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(res.data);
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || json.message || 'Failed to open document');
          } catch {
            throw new Error(text || 'Failed to open document');
          }
        }
        
        const blob = new Blob([res.data], { type: contentType || 'application/octet-stream' });
        objectUrl = window.URL.createObjectURL(blob);
        setUrl(objectUrl);
        setMime(contentType);
      } catch (err) {
        console.error('Document View Error:', err);
        
        let errorMessage = 'Failed to open document.';
        
        // Handle Blob error response from server
        if (err.response?.data instanceof Blob) {
          try {
            const blobText = await err.response.data.text();
            const errorJson = JSON.parse(blobText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch (e) {
            console.error('Error decoding blob error:', e);
            errorMessage = `Server Error (${err.response.status})`;
          }
        } else {
          errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || errorMessage;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
        toast.dismiss();
      }
    };
    toast.loading('Loading document...');
    fetchDoc();
    return () => {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [id, documentId]);

  const openNewTab = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFallback = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${docId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const isPdf = mime && mime.toLowerCase().includes('pdf');
  const isImage = mime && mime.toLowerCase().startsWith('image/');

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="light" onClick={() => navigate(-1)} className="d-inline-flex align-items-center">
          <FiArrowLeft className="me-2" /> Back
        </Button>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={openNewTab} disabled={!url}>
            <FiExternalLink className="me-2" /> Open in new tab
          </Button>
          <Button variant="outline-secondary" onClick={downloadFallback} disabled={!url}>
            <FiDownload className="me-2" /> Download
          </Button>
        </div>
      </div>

      {loading && (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
          <Spinner animation="border" />
        </div>
      )}

      {!loading && error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {!loading && url && (
        <div className="border rounded shadow-sm" style={{ minHeight: '70vh', background: '#fff' }}>
          {isPdf && (
            <iframe title="Document Preview" src={url} style={{ width: '100%', height: '80vh', border: 'none' }} />
          )}
          {isImage && (
            <div className="d-flex justify-content-center bg-light">
              <img src={url} alt="Document" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="p-4">
              <Alert variant="warning" className="mb-3">
                Preview not supported for this file type ({mime || 'unknown'}). Use the buttons above to open in a new tab or download.
              </Alert>
              <iframe title="Document" src={url} style={{ width: '100%', height: '80vh', border: 'none' }} />
            </div>
          )}
        </div>
      )}
    </Container>
  );
};

export default DocumentViewer;
