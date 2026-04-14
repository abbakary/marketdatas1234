import React, { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import logo from "../assets/logo1.png";
import banner1 from "../assets/banner1.png";
import icon12 from "../assets/icon12.png";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import {
  Box, Typography, TextField, Button, Checkbox, FormControlLabel,
  Link, IconButton, InputAdornment, Divider, Paper,
} from "@mui/material";

import { getDashboardPath } from "../utils/roleRedirect";
import { validateMockCredentials } from "../utils/mockCredentials";
import { useThemeColors } from "../utils/useThemeColors";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000";
const TOKEN_KEY = "dali-token";
const USER_KEY = "dali-user";

const api = axios.create({ baseURL: API_BASE, headers: { "Content-Type": "application/json", Accept: "application/json" } });

const toast = (icon, title) => Swal.fire({ toast: true, position: "top-end", icon, title, timer: 3000, showConfirmButton: false });

const DEMO_ACCOUNTS = [
  { label: "Viewer",  email: "viewer@demo.com" },
  { label: "Buyer",   email: "buyer@demo.com" },
  { label: "Seller",  email: "seller@demo.com" },
  { label: "Editor",  email: "editor@demo.com" },
  { label: "Admin",   email: "admin@demo.com" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { isDarkMode, bg, text, textMuted, border, orange, teal, darkBg } = useThemeColors();

  const ACCENT = teal;
  const cardBg = isDarkMode ? "rgba(7,26,41,0.86)" : "rgba(255,255,255,0.92)";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.10)";
  const cardText = isDarkMode ? "#fff" : text;
  const cardMuted = isDarkMode ? "rgba(255,255,255,0.72)" : textMuted;
  const inputBg = isDarkMode ? "rgba(4,18,29,0.85)" : "#fff";
  const inputText = isDarkMode ? "#fff" : text;
  const inputLabel = isDarkMode ? "rgba(255,255,255,0.85)" : textMuted;
  const inputBorder = isDarkMode ? "rgba(255,255,255,0.22)" : border;

  const textFieldSx = {
    "& .MuiInputLabel-root": { color: inputLabel },
    "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
    "& .MuiOutlinedInput-root": {
      color: inputText,
      borderRadius: 2,
      backgroundColor: inputBg,
      "& input": { color: inputText },
      "& fieldset": { borderColor: inputBorder },
      "&:hover fieldset": { borderColor: "rgba(94,196,195,0.70)" },
      "&.Mui-focused fieldset": { borderColor: ACCENT },
    },
    "& .MuiFormHelperText-root": { color: cardMuted },
  };

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const user  = localStorage.getItem(USER_KEY)  || sessionStorage.getItem(USER_KEY);
    if (!token || !user) return;
    try { navigate(getDashboardPath(JSON.parse(user)?.role), { replace: true }); } catch {}
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const clearStoredAuth = () => {
    [TOKEN_KEY, USER_KEY].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  };

  const validateForm = () => {
    if (!form.email.trim())    { toast("error", "Email is required"); return false; }
    if (!form.password.trim()) { toast("error", "Password is required"); return false; }
    if (form.password.length < 6)  { toast("error", "Password must be at least 6 characters"); return false; }
    if (form.password.length > 72) { toast("error", "Password must not exceed 72 characters"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      const email = form.email.trim().toLowerCase();
      const mockUser = validateMockCredentials(email, form.password);
      if (mockUser) {
        clearStoredAuth();
        const storage = form.remember ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, `mock_token_${Date.now()}`);
        storage.setItem(USER_KEY, JSON.stringify(mockUser));
        window.dispatchEvent(new Event("auth:updated"));
        toast("success", `Welcome ${mockUser.name}! (${mockUser.role})`);
        navigate(getDashboardPath(mockUser?.role), { replace: true });
        return;
      }
      const { data } = await api.post("/auth/login", { email, password: form.password });
      const token = data?.access_token;
      if (!token) throw new Error("No access token returned");
      clearStoredAuth();
      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, token);
      let meData = null;
      try {
        const me = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        meData = me?.data || null;
      } catch {
        meData = { email, role: "viewer", status: "pending" };
      }
      storage.setItem(USER_KEY, JSON.stringify(meData));
      window.dispatchEvent(new Event("auth:updated"));
      toast("success", "Welcome to DALI Data Portal");
      navigate(getDashboardPath(meData?.role), { replace: true });
    } catch (err) {
      toast("error", err?.response?.data?.detail || err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: darkBg, fontFamily: "'Poppins', sans-serif",
      "@keyframes fadeUp": { "0%": { opacity: 0, transform: "translateY(28px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      "@keyframes fadeIn": { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
      "@keyframes floatSoft": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
    }}>
      {/* Background image must remain */}
      <Box sx={{ position: "fixed", inset: 0, backgroundImage: `url(${banner1})`, backgroundSize: "cover", backgroundPosition: "center", transform: "scale(1.03)" }} />
      <Box sx={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(4,18,29,0.58), rgba(4,18,29,0.90))" }} />

      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: { xs: 2, sm: 3 },
          animation: "fadeIn 0.5s ease",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 4,
            p: { xs: 2.5, sm: 3 },
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDarkMode ? "0 24px 60px rgba(0,0,0,0.55)" : "0 24px 60px rgba(0,0,0,0.25)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              mb: 2.5,
              opacity: 0,
              animation: "fadeUp 0.7s ease forwards",
              animationDelay: "0.06s",
            }}
          >
            {/* Logo #1 (existing) centered */}
            <Box
              component="img"
              src={logo}
              alt="Dali Data"
              sx={{
                height: 46,
                objectFit: "contain",
                mb: 1,
                filter: isDarkMode ? "drop-shadow(0 10px 22px rgba(0,0,0,0.35))" : "drop-shadow(0 10px 22px rgba(0,0,0,0.20))",
              }}
            />
            <Typography sx={{ color: cardText, fontSize: 20, fontWeight: 950, lineHeight: 1.15 }}>
              Sign in
            </Typography>
            <Typography sx={{ color: cardMuted, fontSize: 12.5, mt: 0.6 }}>
              Access your DALI account to manage datasets, subscriptions, and requests.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)", mb: 2 }} />

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              opacity: 0,
              animation: "fadeUp 0.7s ease forwards",
              animationDelay: "0.14s",
            }}
          >
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={18} color={ACCENT} /></InputAdornment> }}
              sx={textFieldSx}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              helperText={null}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock size={18} color={ACCENT} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((p) => !p)} edge="end" sx={{ color: ACCENT }}>
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.2, gap: 1, flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Checkbox checked={form.remember} onChange={handleChange} name="remember" sx={{ color: cardMuted, "&.Mui-checked": { color: ACCENT } }} />}
                label={<Typography sx={{ fontSize: 13.5, opacity: 0.95, color: cardText }}>Remember me</Typography>}
              />
              <Link component={RouterLink} to="/forgot-password" underline="none" sx={{ color: ACCENT, fontWeight: 900, fontSize: 14 }}>
                Forgot?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                mt: 1,
                height: 46,
                borderRadius: 2.5,
                fontWeight: 950,
                textTransform: "none",
                bgcolor: ACCENT,
                color: "#04121D",
                boxShadow: "0 16px 30px rgba(94,196,195,0.20)",
                "&:hover": { bgcolor: "#49b2b1" },
                "&.Mui-disabled": { bgcolor: "rgba(94,196,195,0.5)", color: "#04121D" },
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            {/* Logo #2 (icon12) below Sign in button */}
            <Box
              sx={{
                mt: 1.3,
                display: "flex",
                justifyContent: "center",
                opacity: 0,
                animation: "fadeUp 0.7s ease forwards",
                animationDelay: "0.26s",
              }}
            >
              <Box
                component="img"
                src={icon12}
                alt="Dali icon"
                sx={{
                  height: 36,
                  width: "auto",
                  objectFit: "contain",
                  animation: "floatSoft 2.4s ease-in-out infinite",
                  filter: isDarkMode ? "drop-shadow(0 10px 22px rgba(0,0,0,0.35))" : "drop-shadow(0 10px 22px rgba(0,0,0,0.20))",
                }}
              />
            </Box>

            <Typography sx={{ textAlign: "center", mt: 1.2, fontSize: 11.5, opacity: 0.75, color: cardMuted }}>
              © {new Date().getFullYear()} Dali Data Portal
            </Typography>

            <Divider sx={{ borderColor: isDarkMode ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)", my: 1 }} />

            <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: cardMuted, textTransform: "uppercase", mb: 0.4, letterSpacing: "0.5px" }}>
              Demo Credentials
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              {DEMO_ACCOUNTS.map(({ label, email }, i) => (
                <Box
                  key={email}
                  onClick={() => setForm({ email, password: "demo123", remember: true })}
                  sx={{
                    px: 1.1,
                    py: 0.6,
                    borderRadius: 2,
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: cardText,
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(2,6,23,0.04)",
                    border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(15,23,42,0.10)",
                    transition: "all 0.2s ease",
                    opacity: 0,
                    animation: "fadeUp 0.6s ease forwards",
                    animationDelay: `${0.30 + i * 0.04}s`,
                    "&:hover": {
                      transform: "translateY(-1px)",
                      borderColor: "rgba(97,197,195,0.60)",
                      backgroundColor: isDarkMode ? "rgba(97,197,195,0.14)" : "rgba(97,197,195,0.10)",
                    },
                  }}
                  title={email}
                >
                  {label}
                </Box>
              ))}
            </Box>

            <Typography sx={{ fontSize: 9.5, color: cardMuted, mt: 0.8, textAlign: "center" }}>
              Password: <b>demo123</b> (for all demo accounts)
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
