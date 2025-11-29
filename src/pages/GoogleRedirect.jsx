import React, { useEffect } from 'react'

const GoogleRedirect = () => {
  useEffect(() => {
    // Google returns id_token in the URL fragment if response_type=id_token
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const idToken = params.get('id_token') || params.get('token') || new URLSearchParams(window.location.search).get('id_token');

    // If opened as a popup, send token back to opener and close
    if (window.opener && idToken) {
      try {
        window.opener.postMessage({ type: 'google-id-token', idToken }, window.location.origin);
      } catch (err) {
        // ignore
      }
      // give the opener a moment to receive and then close
      setTimeout(() => window.close(), 500);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        <h2 className="text-xl font-semibold">Processando login com Google…</h2>
        <p className="mt-3 text-sm text-gray-600">Se esta janela não fechar automaticamente, copie o código de autenticação e cole no app.</p>
      </div>
    </div>
  )
}

export default GoogleRedirect
