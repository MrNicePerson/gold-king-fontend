
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

