
// ============================================================
// frontend/src/contexts/AuthContext.jsx
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { authAPI } from '../services/authApi';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'goldchain_last_activity';

// ============================================================
// AUTH CONTEXT
// ============================================================

const AuthContext = createContext(null);


// ============================================================
// USE AUTH
// ============================================================

export const useAuth = () => {
  return useContext(AuthContext);
};


// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({ children }) => {

  // ==========================================================
  // STATE
  // ==========================================================

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() =>
    localStorage.getItem('goldchain_token')
  );

  const [loading, setLoading] = useState(true);


  // ==========================================================
  // CLEAR LOCAL AUTH
  // ==========================================================

  const clearLocalAuth = useCallback(() => {
    localStorage.removeItem('goldchain_token');
    localStorage.removeItem('goldchain_user');
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    setToken(null);
    setUser(null);
  }, []);


  // ==========================================================
  // VERIFY USER WITH BACKEND
  // ==========================================================

  const verifyUserWithBackend = useCallback(
    async () => {
      try {
        const storedToken =
          localStorage.getItem('goldchain_token');

        if (!storedToken) {
          clearLocalAuth();
          return;
        }

        const res = await authAPI.getMe();

        const userData = {
          ...res.data.user,
          role: res.data.role,
        };

        setUser(userData);
        setToken(storedToken);

        localStorage.setItem(
          'goldchain_user',
          JSON.stringify(userData)
        );

      } catch (error) {
        console.error(
          'Session verification failed:',
          error
        );

        // ----------------------------------------------------
        // Session is invalid / expired / revoked
        // ----------------------------------------------------

        if (error.response?.status === 401) {
          clearLocalAuth();
        }

      } finally {
        setLoading(false);
      }
    },
    [clearLocalAuth]
  );


  // ==========================================================
  // RESTORE USER WHEN APP STARTS
  // ==========================================================

  useEffect(() => {
    const storedToken =
      localStorage.getItem('goldchain_token');

    const storedUser =
      localStorage.getItem('goldchain_user');


    // --------------------------------------------------------
    // No token
    // --------------------------------------------------------

    if (!storedToken) {
      clearLocalAuth();
      setLoading(false);
      return;
    }


    // --------------------------------------------------------
    // Restore cached user immediately
    // --------------------------------------------------------

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setToken(storedToken);

      } catch (error) {
        console.error(
          'Failed to parse stored user:',
          error
        );

        localStorage.removeItem('goldchain_user');
      }
    }


    // --------------------------------------------------------
    // Verify the session with backend
    // --------------------------------------------------------

    verifyUserWithBackend();

  }, [
    clearLocalAuth,
    verifyUserWithBackend,
  ]);


  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (number, password) => {
    try {

      const res = await authAPI.login({
        number,
        password,
      });

      const {
        token: newToken,
        user: newUser,
      } = res.data;


      // ------------------------------------------------------
      // Validate backend response
      // ------------------------------------------------------

      if (!newToken || !newUser) {
        throw new Error(
          'Invalid login response from server.'
        );
      }


      // ------------------------------------------------------
      // Save token
      // ------------------------------------------------------

      localStorage.setItem(
        'goldchain_token',
        newToken
      );
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));


      // ------------------------------------------------------
      // Save user
      // ------------------------------------------------------

      localStorage.setItem(
        'goldchain_user',
        JSON.stringify(newUser)
      );


      // ------------------------------------------------------
      // Update React state
      // ------------------------------------------------------

      setToken(newToken);
      setUser(newUser);


      return newUser;

    } catch (error) {

      console.error(
        'Login failed:',
        error
      );

      throw error;
    }
  };


  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const handleSetUser = useCallback((updater) => {

    setUser((previousUser) => {

      const nextUser =
        typeof updater === 'function'
          ? updater(previousUser)
          : updater;


      // ------------------------------------------------------
      // User exists
      // ------------------------------------------------------

      if (nextUser) {

        localStorage.setItem(
          'goldchain_user',
          JSON.stringify(nextUser)
        );

      }

      // ------------------------------------------------------
      // User removed
      // ------------------------------------------------------

      else {

        localStorage.removeItem(
          'goldchain_user'
        );
      }


      return nextUser;
    });

  }, []);


  // ==========================================================
  // LOGOUT
  // ==========================================================
  //
  // IMPORTANT:
  //
  // 1. Call backend logout
  // 2. Backend clears activeSessionId
  // 3. Clear localStorage
  // 4. Clear React state
  //
  // After activeSessionId becomes null, another device/browser
  // can login to this account.
  // ==========================================================

  const logout = useCallback(async () => {

    try {

      const currentToken =
        localStorage.getItem('goldchain_token');


      // ------------------------------------------------------
      // Call backend logout
      // ------------------------------------------------------

      if (currentToken) {

        try {

          await authAPI.logout();

        } catch (error) {

          console.error(
            'Backend logout failed:',
            error
          );

          // We still clear the local session below.
        }
      }

    } finally {

      // ------------------------------------------------------
      // Always clear local authentication
      // ------------------------------------------------------

      clearLocalAuth();
    }

  }, [clearLocalAuth]);


  // ==========================================================
  // LOG OUT AFTER ONE HOUR WITHOUT USER ACTIVITY
  // ==========================================================

  useEffect(() => {
    if (loading || !token || !user) return undefined;

    let lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
      lastActivityAt = Date.now();
      localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivityAt));
    }

    let timer;
    let lastPersistedAt = lastActivityAt;
    let isLoggingOut = false;

    const checkInactivity = () => {
      if (isLoggingOut) return;

      const sharedActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
      lastActivityAt = Math.max(lastActivityAt, sharedActivityAt);
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityAt);

      if (remaining <= 0) {
        isLoggingOut = true;
        logout();
        return;
      }

      timer = window.setTimeout(checkInactivity, remaining);
    };

    const recordActivity = () => {
      if (isLoggingOut) return;

      // A delayed browser timer must not let the first interaction after an
      // hour of inactivity extend an already expired session.
      const sharedActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
      lastActivityAt = Math.max(lastActivityAt, sharedActivityAt);
      if (Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
        checkInactivity();
        return;
      }

      lastActivityAt = Date.now();
      // Throttle writes from frequent pointer/scroll events while keeping
      // activity synchronized across tabs.
      if (lastActivityAt - lastPersistedAt >= 1000) {
        lastPersistedAt = lastActivityAt;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivityAt));
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(checkInactivity, IDLE_TIMEOUT_MS);
    };

    const syncActivity = (event) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) return;
      const sharedActivityAt = Number(event.newValue);
      if (Number.isFinite(sharedActivityAt) && sharedActivityAt > lastActivityAt) {
        lastActivityAt = sharedActivityAt;
        window.clearTimeout(timer);
        timer = window.setTimeout(checkInactivity, IDLE_TIMEOUT_MS);
      }
    };

    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener('storage', syncActivity);

    checkInactivity();

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      window.removeEventListener('storage', syncActivity);
    };
  }, [loading, token, user, logout]);


  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    user,
    setUser: handleSetUser,
    token,
    loading,
    login,
    logout,
  };


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
