async function parseJsonOrThrow(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function analyzePdf(file, wcagLevel) {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('wcagLevel', wcagLevel);

  const response = await fetch('/api/analyze', { method: 'POST', body: formData });
  return parseJsonOrThrow(response);
}

export async function remediatePdf(jobId, autoFix = true) {
  const response = await fetch(`/api/remediate/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoFix }),
  });
  return parseJsonOrThrow(response);
}

export function reportUrl(jobId) {
  return `/reports/${jobId}-report.html`;
}

export function downloadUrl(jobId) {
  return `/api/download/${jobId}`;
}
