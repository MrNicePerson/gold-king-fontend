import { useState, useEffect, useRef, useCallback } from 'react';
import { createLivePriceStream } from '../services/superAdminApi';
import { createAdminLivePriceStream } from '../services/adminApi';
import { publicAPI } from '../services/publicApi';

const RECONNECT_DELAY_MS = 5_000;
const MAX_RECONNECTS     = 10;
const POLL_INTERVAL_MS   = 30_000;

// userType: 'superAdmin', 'admin', or 'public'
export function useLivePrices(userType = 'public') {
  const [prices,      setPrices]      = useState(null);
  const [connected,   setConnected]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);

  const esRef           = useRef(null);
  const reconnectCount  = useRef(0);
  const reconnectTimer  = useRef(null);
  const pollTimer       = useRef(null);
  const unmounted       = useRef(false);

  // Fallback polling for public pages
  const startPolling = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    
    const fetchPrices = async () => {
      try {
        const res = await publicAPI.getPublicLivePrices();
        if (res.data?.success && res.data?.prices) {
          setPrices(res.data.prices);
          setLastUpdated(new Date());
          setConnected(true);
          setError(null);
        }
      } catch (err) {
        console.error('Polling failed:', err);
        setConnected(false);
      }
    };
    
    fetchPrices();
    pollTimer.current = setInterval(fetchPrices, POLL_INTERVAL_MS);
  }, []);

  const connect = useCallback(() => {
    if (unmounted.current) return;
    
    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    
    // Public pages - use public SSE
    if (userType === 'public') {
      const base = import.meta.env.VITE_API_URL || '/api';
      const es = new EventSource(`${base}/public/prices/stream`);
      esRef.current = es;
      
      es.onopen = () => {
        if (unmounted.current) return;
        console.log('✅ Public SSE connected');
        setConnected(true);
        setError(null);
        reconnectCount.current = 0;
      };
      
      es.onmessage = (event) => {
        if (unmounted.current) return;
        setConnected(true);
        reconnectCount.current = 0;
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
            return;
          }
          setPrices(data);
          setLastUpdated(new Date());
          setError(null);
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };
      
      es.onerror = () => {
        if (unmounted.current) return;
        console.error('❌ Public SSE error, falling back to polling');
        setConnected(false);
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
        
        if (reconnectCount.current < MAX_RECONNECTS) {
          reconnectCount.current += 1;
          const delay = RECONNECT_DELAY_MS * Math.min(reconnectCount.current, 4);
          reconnectTimer.current = setTimeout(connect, delay);
        } else {
          startPolling();
        }
      };
      
      return;
    }
    
    // Admin pages - use admin SSE
    if (userType === 'admin') {
      const es = createAdminLivePriceStream();
      esRef.current = es;
      
      es.onopen = () => {
        if (unmounted.current) return;
        console.log('✅ Admin SSE connected');
        setConnected(true);
        setError(null);
        reconnectCount.current = 0;
      };
      
      es.onmessage = (event) => {
        if (unmounted.current) return;
        setConnected(true);
        reconnectCount.current = 0;
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
            return;
          }
          setPrices(data);
          setLastUpdated(new Date());
          setError(null);
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };
      
      es.onerror = () => {
        if (unmounted.current) return;
        console.error('❌ Admin SSE error, falling back to polling');
        setConnected(false);
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
        
        if (reconnectCount.current < MAX_RECONNECTS) {
          reconnectCount.current += 1;
          const delay = RECONNECT_DELAY_MS * Math.min(reconnectCount.current, 4);
          reconnectTimer.current = setTimeout(connect, delay);
        } else {
          startPolling();
        }
      };
      
      return;
    }
    
    // Super Admin pages - use super admin SSE
    // If there's no token (not logged in as SA), avoid connecting with token=null
    const saToken = localStorage.getItem('goldchain_token');
    if (!saToken) {
      console.warn('No Super Admin token present — skipping SA SSE, falling back to public polling');
      startPolling();
      return;
    }

    const es = createLivePriceStream();
    esRef.current = es;

    es.onopen = () => {
      if (unmounted.current) return;
      console.log('✅ Super Admin SSE connected');
      setConnected(true);
      setError(null);
      reconnectCount.current = 0;
    };

    es.onmessage = (event) => {
      if (unmounted.current) return;
      setConnected(true);
      reconnectCount.current = 0;
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          return;
        }
        setPrices(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      if (unmounted.current) return;
      console.error('❌ Super Admin SSE error, falling back to polling');
      setConnected(false);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      if (reconnectCount.current < MAX_RECONNECTS) {
        reconnectCount.current += 1;
        const delay = RECONNECT_DELAY_MS * Math.min(reconnectCount.current, 4);
        reconnectTimer.current = setTimeout(connect, delay);
      } else {
        startPolling();
      }
    };
  }, [userType, startPolling]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      clearTimeout(reconnectTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
      esRef.current?.close();
    };
  }, [connect]);

  return { prices, connected, lastUpdated, error };
}