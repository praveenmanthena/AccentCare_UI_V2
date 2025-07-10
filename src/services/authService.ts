import { AuthResponse, LoginRequest } from "../types";

const TOKEN_KEY = "penguinai_access_token";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://acc-icdbackend-dev.penguinai.co";

export const authService = {
  // Login function that calls the API and stores the token
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Authentication failed: ${response.status} ${errorText}`
        );
      }

      const authResponse: AuthResponse = await response.json();

      // Store the token in localStorage
      localStorage.setItem(TOKEN_KEY, authResponse.access_token);

      return authResponse;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Clear stored token
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },
};
