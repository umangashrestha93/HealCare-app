import { useCallback, useEffect, useMemo, useState } from 'react';
import adminApi from '../services/adminApi';

const normalizePractitioner = (practitioner) => {
  const user = practitioner.userId || {};
  return {
    ...practitioner,
    id: practitioner._id,
    user,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed practitioner',
    email: user.email || 'No email on file',
    location: user.location || 'Remote / not provided',
    status: practitioner.verificationStatus || 'pending',
    documents: Array.isArray(practitioner.complianceDocs) ? practitioner.complianceDocs : [],
  };
};

export const usePractitioners = (status = 'pending', options = {}) => {
  const { pollInterval = 15000 } = options;
  const [practitioners, setPractitioners] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPractitioners = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await adminApi.getPractitioners({ status });
      setPractitioners((response.data || []).map(normalizePractitioner));
      setCounts(response.counts || { pending: 0, approved: 0, rejected: 0 });
      setPagination(response.pagination || { total: response.total || 0, page: 1, pages: 1 });
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load practitioners');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  const approvePractitioner = useCallback(async (id) => {
    await adminApi.approvePractitioner(id);
    await fetchPractitioners({ silent: true });
  }, [fetchPractitioners]);

  const rejectPractitioner = useCallback(async (id, reason) => {
    await adminApi.rejectPractitioner(id, reason);
    await fetchPractitioners({ silent: true });
  }, [fetchPractitioners]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      fetchPractitioners();
    }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchPractitioners]);

  useEffect(() => {
    if (!pollInterval) return undefined;
    const intervalId = window.setInterval(() => {
      fetchPractitioners({ silent: true });
    }, pollInterval);
    return () => window.clearInterval(intervalId);
  }, [fetchPractitioners, pollInterval]);

  return useMemo(() => ({
    practitioners,
    counts,
    pagination,
    loading,
    refreshing,
    error,
    refetch: fetchPractitioners,
    approvePractitioner,
    rejectPractitioner,
  }), [
    practitioners,
    counts,
    pagination,
    loading,
    refreshing,
    error,
    fetchPractitioners,
    approvePractitioner,
    rejectPractitioner,
  ]);
};

export default usePractitioners;
