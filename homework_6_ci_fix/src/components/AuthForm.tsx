import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/supabase/useAuth";

type AuthMode = "signIn" | "signUp";

/**
 * AuthForm handles email/password sign-in and registration.
 * Shows a confirmation message when the user must verify their email.
 */
export default function AuthForm() {
  const { signUp, signIn, isEmailUnconfirmed, error, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  const switchMode = useCallback(() => {
    setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
    setFormError("");
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError("");

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        setFormError("Введите корректный email");
        emailRef.current?.focus();
        return;
      }
      if (password.length < 6) {
        setFormError("Пароль должен содержать не менее 6 символов");
        return;
      }

      setIsSubmitting(true);
      try {
        if (mode === "signUp") {
          await signUp(trimmedEmail, password, fullName.trim() || undefined);
        } else {
          await signIn(trimmedEmail, password);
        }
      } catch {
        // Error already set in auth context
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, fullName, mode, signUp, signIn]
  );

  // Email confirmation state
  if (isEmailUnconfirmed) {
    return (
      <div className="min-h-screen bg-steel-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-navy-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-navy-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-navy-800 mb-2">
            Проверьте вашу почту
          </h2>
          <p className="text-sm text-steel-600 mb-6">
            Мы отправили ссылку для подтверждения на {email.trim()}. Перейдите
            по ссылке из письма, чтобы завершить регистрацию.
          </p>
          <button
            onClick={() => {
              setFormError("");
              clearError();
            }}
            className="px-4 py-2 text-sm font-medium text-navy-700 border border-steel-200 rounded-lg hover:bg-steel-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-navy-800">
            {mode === "signIn" ? "Вход" : "Регистрация"}
          </h1>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signUp" && (
            <div>
              <label
                htmlFor="auth-full-name"
                className="block text-sm font-medium text-steel-700 mb-1.5"
              >
                Имя (необязательно)
              </label>
              <input
                id="auth-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-steel-200 bg-white outline-none transition-all focus:border-navy-500 focus:ring-1 focus:ring-navy-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-steel-700 mb-1.5"
            >
              Email
            </label>
            <input
              ref={emailRef}
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white outline-none transition-all ${
                formError && !email.includes("@")
                  ? "border-red-400 focus:border-red-500"
                  : "border-steel-200 focus:border-navy-500 focus:ring-1 focus:ring-navy-100"
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-medium text-steel-700 mb-1.5"
            >
              Пароль
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "signIn" ? "Введите пароль" : "Не менее 6 символов"
              }
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white outline-none transition-all ${
                formError && password.length > 0 && password.length < 6
                  ? "border-red-400 focus:border-red-500"
                  : "border-steel-200 focus:border-navy-500 focus:ring-1 focus:ring-navy-100"
              }`}
            />
          </div>

          {formError && (
            <p role="alert" className="text-xs text-red-600 font-medium">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 text-sm font-semibold rounded-lg text-white bg-navy-700 hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Подождите..."
              : mode === "signIn"
                ? "Войти"
                : "Зарегистрироваться"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-navy-600 hover:text-navy-800 transition-colors"
          >
            {mode === "signIn"
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}
