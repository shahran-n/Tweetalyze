import React from 'react';

function useHashQueryParam(name) {
  const [value, setValue] = React.useState('');
  React.useEffect(() => {
    const parse = () => {
      const hash = window.location.hash || '';
      const idx = hash.indexOf('?');
      if (idx === -1) return setValue('');
      const qs = new URLSearchParams(hash.substring(idx + 1));
      setValue(qs.get(name) || '');
    };
    parse();
    window.addEventListener('hashchange', parse);
    return () => window.removeEventListener('hashchange', parse);
  }, [name]);
  return value;
}

export default function Search() {
  const q = useHashQueryParam('q');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    if (!q) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(JSON.stringify(json));
        return json;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div>
      <h2 style={{ margin: 0, padding: '8px 0 16px 0', color: '#1f2a56' }}>Search</h2>
      <div style={{ background: '#fff', border: '1px solid #eef2f7', borderRadius: 10, padding: 16 }}>
        {!q && <div>Enter a handle or query and press Enter.</div>}
        {q && <div style={{ marginBottom: 8 }}><strong>Query:</strong> {q}</div>}
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: '#ef4444' }}>{error}</div>}
        {data && (
          <div>
            <div style={{ marginBottom: 8 }}><strong>Results:</strong> {Array.isArray(data.data) ? data.data.length : 0}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
              {(data.data || []).map(t => (
                <li key={t.id} style={{ border: '1px solid #eef2f7', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{t.id}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{t.text}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


