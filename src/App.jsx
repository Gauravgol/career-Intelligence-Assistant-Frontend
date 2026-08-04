import { useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

const PROVIDERS = [
  {
    label: 'OpenAI',
    value: 'openai',
    models: [
      'gpt-5.4-nano',
      'gpt-5.4-mini',
      'gpt-5.4',
      'gpt-5.5',
      'gpt-5.6-luna',
      'gpt-5.6-terra',
      'gpt-5.6-sol',
    ],
  },
  {
    label: 'Google Gemini',
    value: 'gemini',
    models: [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
    ],
  },
  {
    label: 'Anthropic Claude',
    value: 'claude',
    models: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-6'],
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const MAX_FILE_SIZE_MB = 3;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function isPdf(file) {
  return file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');
}

function validateFile(file, label) {
  if (!file) {
    return `${label} is required.`;
  }

  if (!isPdf(file)) {
    return `${label} must be a PDF file.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${label} must be ${MAX_FILE_SIZE_MB} MB or smaller.`;
  }

  return '';
}

function FilePicker({ file, id, label, onChange }) {
  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] ?? null;
    const error = selectedFile ? validateFile(selectedFile, label) : '';

    if (error) {
      toast.error(error);
      event.target.value = '';
      onChange(null);
      return;
    }

    onChange(selectedFile);
  }

  return (
    <label className="file-picker" htmlFor={id}>
      <span className="file-picker__label">{label}</span>
      <span className="file-picker__dropzone">
        <span>{file ? file.name : 'Choose PDF'}</span>
        <small>
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `PDF only, max ${MAX_FILE_SIZE_MB} MB`}
        </small>
      </span>
      <input
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
      />
    </label>
  );
}

function renderResult(result) {
  if (!result) {
    return 'Your analysis result will appear here after upload.';
  }

  if (typeof result === 'string') {
    return result;
  }

  return JSON.stringify(result, null, 2);
}

export default function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState(null);
  const [provider, setProvider] = useState(PROVIDERS[0].value);
  const [model, setModel] = useState(PROVIDERS[0].models[0]);
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const providerModels = useMemo(
    () => PROVIDERS.find((item) => item.value === provider)?.models ?? [],
    [provider],
  );

  function handleProviderChange(event) {
    const nextProvider = event.target.value;
    const nextModels = PROVIDERS.find((item) => item.value === nextProvider)?.models ?? [];

    setProvider(nextProvider);
    setModel(nextModels[0] ?? '');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setResult(null);

    const fileError = validateFile(resume, 'Resume') || validateFile(jobDescription, 'Job description');

    if (fileError) {
      setStatus('error');
      setMessage(fileError);
      toast.error(fileError);
      return;
    }

    if (!provider || !model || !apiKey.trim()) {
      setStatus('error');
      setMessage('Fill provider, model, and API key.');
      toast.error('Fill provider, model, and API key.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('jobDescription', jobDescription);
    formData.append('provider', provider);
    formData.append('model', model);
    formData.append('apiKey', apiKey.trim());

    try {
      setStatus('loading');
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof payload === 'string'
            ? payload
            : payload.message || payload.error || 'Analysis request failed.',
        );
      }

      setStatus('success');
      setMessage('Analysis completed successfully.');
      toast.success('Analysis completed successfully.');
      setResult(payload);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Could not connect to the analyzer API.');
      toast.error(error.message || 'Could not connect to the analyzer API.');
    }
  }

  return (
    <main className="app-shell">
      <Toaster position="top-right" />
      <header className="topbar">
        <span className="brand">Resume Match AI</span>
      </header>

      <section className="chat-layout">
        <div className="welcome">
          <p>Upload your resume and job description</p>
          <h1>Ready to analyze fit?</h1>
        </div>

        <section className="result-panel" aria-live="polite">
          <div className="assistant-row">
            <span className="assistant-avatar">AI</span>
            <div>
              <p className="assistant-name">Analyzer</p>
              <pre>{renderResult(result)}</pre>
            </div>
          </div>
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <div className="upload-grid">
            <FilePicker id="resume" label="Resume" file={resume} onChange={setResume} />
            <FilePicker
              id="job-description"
              label="Job Description"
              file={jobDescription}
              onChange={setJobDescription}
            />
          </div>

          <div className="settings-grid">
            <label className="field">
              <span>Provider</span>
              <select value={provider} onChange={handleProviderChange}>
                {PROVIDERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Model</span>
              <select value={model} onChange={(event) => setModel(event.target.value)}>
                {providerModels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--key">
              <span>API Key</span>
              <input
                type="password"
                value={apiKey}
                placeholder="Paste API key"
                autoComplete="off"
                onChange={(event) => setApiKey(event.target.value)}
              />
            </label>
          </div>

          <div className="composer-actions">
            {message && <p className={`status-message status-message--${status}`}>{message}</p>}
            <button className="submit-button" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
