import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function App() {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  const [submissions, setSubmissions] = useState([])
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp'
  ]
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.bmp']
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    
    if (!selectedFile) {
      setFile(null)
      setFileName('')
      return
    }

    // Check file extension
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      setMessage('Invalid file type. Allowed: PDF, Word documents, or images (JPG, PNG, GIF, BMP)')
      setMessageType('error')
      setFile(null)
      setFileName('')
      return
    }

    // Check file size (30MB)
    if (selectedFile.size > 30 * 1024 * 1024) {
      setMessage('File size exceeds 30MB limit')
      setMessageType('error')
      setFile(null)
      setFileName('')
      return
    }

    setFile(selectedFile)
    setFileName(selectedFile.name)
    setMessage('')
    setMessageType('')
  }

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/submissions`)
      setSubmissions(response.data.submissions || [])
    } catch (error) {
      console.error('Unable to load submissions:', error)
    }
  }

  const canDownload = (value) => {
    return [true, 1, '1', 'true'].includes(value)
  }

  const [previewItem, setPreviewItem] = useState(null)

  const handlePreview = (submission) => {
    setPreviewItem(submission)
  }

  const closePreview = () => {
    setPreviewItem(null)
  }

  const downloadFile = async (submissionId, filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/download/${submissionId}`)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Failed to download file:', error)
      setMessage('Unable to download file at this time')
      setMessageType('error')
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setMessage('Please enter your name')
      setMessageType('error')
      return
    }

    if (!file) {
      setMessage('Please select a file')
      setMessageType('error')
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('file', file)

    setIsLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(percentCompleted)
          },
        }
      )

      if (response.data.status === 'success') {
        setMessage(`${response.data.message} (ID: ${response.data.submission_id})`)
        setMessageType('success')
        
        // Reset form
        setName('')
        setFile(null)
        setFileName('')
        setUploadProgress(0)
        fetchSubmissions()
      } else {
        setMessage('Upload failed. Please try again.')
        setMessageType('error')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'An error occurred during upload'
      setMessage(errorMsg)
      setMessageType('error')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const clearMessage = () => {
    setMessage('')
    setMessageType('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Center</h1>
          <p className="text-gray-600">Submit your name and document</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              disabled={isLoading}
            />
          </div>

          {/* File Input */}
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Attach Document
            </label>
            <div className="relative">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,image/bmp"
                className="hidden"
                disabled={isLoading}
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="text-center">
                  <svg
                    className="w-8 h-8 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    {fileName ? (
                      <span className="font-medium text-green-600">{fileName}</span>
                    ) : (
                      <>
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Word, or images (JPG, PNG, GIF, BMP) up to 30MB
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {message && messageType === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{message}</p>
                </div>
                <button
                  type="button"
                  onClick={clearMessage}
                  className="text-green-600 hover:text-green-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {message && messageType === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{message}</p>
                </div>
                <button
                  type="button"
                  onClick={clearMessage}
                  className="text-red-600 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !name.trim() || !file}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h6"
                  />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>Submit</span>
              </>
            )}
          </button>
        </form>

        {/* Submission Cards */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Submissions</h2>
            <button
              type="button"
              onClick={fetchSubmissions}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center text-gray-600">
              No submissions yet. Upload a file to see it listed here.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-4 bg-slate-50 border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{submission.name}</p>
                      <p className="text-sm text-gray-500">{submission.original_filename}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {submission.file_type.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">
                      <p>ID: <span className="font-medium text-gray-700">{submission.id}</span></p>
                      <p>Uploaded: <span className="font-medium text-gray-700">{new Date(submission.uploaded_at).toLocaleString()}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(submission)}
                        className="inline-flex items-center justify-center rounded-lg bg-white border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
                      >
                        Preview
                      </button>
                      {canDownload(submission.download) ? (
                        <button
                          type="button"
                          onClick={() => downloadFile(submission.id, submission.original_filename)}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Download
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-sm text-slate-500">Preview</p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {previewItem.original_filename}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                >
                  <span className="sr-only">Close preview</span>
                  ✕
                </button>
              </div>
              <div className="h-[80vh] overflow-hidden bg-slate-950">
                {previewItem.file_type === 'image' ? (
                  <img
                    src={`${API_BASE_URL}/api/preview/${previewItem.id}`}
                    alt={previewItem.original_filename}
                    className="h-full w-full object-contain bg-slate-950"
                  />
                ) : previewItem.file_type === 'pdf' ? (
                  <iframe
                    src={`${API_BASE_URL}/api/preview/${previewItem.id}`}
                    title={previewItem.original_filename}
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
                    <p className="text-lg font-semibold">Preview unavailable for this file type.</p>
                    <p className="text-sm text-slate-300 max-w-2xl">
                      The selected document cannot be rendered inside the app. You can still preview it in a new tab or download it if allowed.
                    </p>
                    <a
                      href={`${API_BASE_URL}/api/download/${previewItem.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Your data is secure and encrypted during transmission
        </p>
      </div>
    </div>
  )
}

export default App
