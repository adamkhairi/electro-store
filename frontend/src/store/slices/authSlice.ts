import { AuthResponse, LoginRequest, RegisterRequest, User } from '@electrostock/types';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  } | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const token = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');

const initialState: AuthState = {
  isAuthenticated: !!(token && refreshToken), // Set to true if both tokens exist
  user: null,
  token,
  refreshToken,
  loading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error?.message || 'Login failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error?.message || 'Registration failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Registration failed');
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken({ refreshToken });
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error?.message || 'Token refresh failed');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Token refresh failed');
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!token || !refreshToken) {
        return rejectWithValue('No tokens found');
      }

      // Try to get user profile to validate token
      const response = await authAPI.getProfile();
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        // Token is invalid, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return rejectWithValue('Invalid token');
      }
    } catch {
      // Token is invalid, clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return rejectWithValue('Token validation failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data.error?.message || 'Failed to get user profile');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to get user profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    clearError: state => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.token = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
  },
  extraReducers: builder => {
    // Initialize auth
    builder.addCase(initializeAuth.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload as AuthState['user'];
    });
    builder.addCase(initializeAuth.rejected, state => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
    });

    // Login
    builder.addCase(loginUser.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      const payload = action.payload as AuthResponse;
      state.loading = false;
      state.isAuthenticated = true;
      state.user = payload.user;
      state.token = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerUser.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      const payload = action.payload as AuthResponse;
      state.loading = false;
      state.isAuthenticated = true;
      state.user = payload.user;
      state.token = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      localStorage.setItem('accessToken', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Refresh token
    builder.addCase(refreshAccessToken.fulfilled, (state, action) => {
      const payload = action.payload as { accessToken: string };
      state.token = payload.accessToken;
      localStorage.setItem('accessToken', payload.accessToken);
    });
    builder.addCase(refreshAccessToken.rejected, state => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    // Get current user
    builder.addCase(getCurrentUser.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload as User;
    });
    builder.addCase(getCurrentUser.rejected, state => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });
  },
});

export const { logout, clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;
