import { useState, useEffect } from 'react';
import { API } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');

  useEffect(() => {
    API.verifyAuth().then((res) => {
      if (res.authenticated && res.user) {
        setUser(res.user);
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await API.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      chrome.runtime.sendMessage({ type: 'LS_FORCE_SYNC' });
    } else {
      setLoginErr(res.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await API.clearAuth();
    setUser(null);
  };

  return {
    user,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    loginErr,
    handleLogin,
    handleLogout,
  };
}
