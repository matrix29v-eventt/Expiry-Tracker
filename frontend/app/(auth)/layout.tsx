"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 dark:opacity-10"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 dark:from-blue-600/20 dark:to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-400/10 to-purple-400/10 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* Global Theme Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => {
              const html = document.documentElement;
              const isDark = html.classList.contains('dark');
              if (isDark) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
              } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
              }
            }}
            className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            title="Toggle theme"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 0018 6.646l-1.647-1.647a.5.5 0 00-.708-.708L4.293 4.293a.5.5 0 00.707.293l6.646 6.647a.5.5 0 00.708.708l-1.647 1.647zm-1.646 5.646l-6.647-6.647a.5.5 0 00-.707-.293l-9-9a.5.5 0 00-.707.293L7.05 7.05a.5.5 0 00.708-.294l3 3.001a.5.5 0 00.708-.708z" />
            </svg>
          </button>
        </div>

        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
            <svg className="h-12 w-12 text-white group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="mt-8 text-4xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            ExpiryTracker
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 font-medium">
            Smart expiry date tracking with intelligent notifications
          </p>
        </div>
        
        {/* Form Container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 glass">
          {children}
        </div>
        
        {/* Trust indicators */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-6">
            <span className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 8.943 12 5.042a5 5 0 111.958 5.959 8.959 0 014-4h4v16a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium text-green-700 dark:text-green-300">Secure</span>
            </span>
            <span className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm6-6V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Reliable</span>
            </span>
            <span className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l7-3v-8z" />
                </svg>
              </div>
              <span className="font-medium text-purple-700 dark:text-purple-300">Smart</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}