import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function JoinGroup() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining');

  useEffect(() => {
    api
      .post(`/groups/join/${token}`)
      .then((res) => {
        setStatus('success');
        setTimeout(() => navigate(`/groups/${res.data._id}`), 1500);
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-sm w-full">
        {status === 'joining' && <p className="text-gray-500">Uniéndote al grupo...</p>}
        {status === 'success' && (
          <p className="text-green-600 font-medium">¡Te uniste! Redirigiendo...</p>
        )}
        {status === 'error' && (
          <div>
            <p className="text-red-500 font-medium mb-3">Enlace inválido o expirado.</p>
            <button onClick={() => navigate('/')} className="text-sm text-indigo-600 hover:underline">
              Ir al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
