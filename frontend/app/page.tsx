import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 font-sans">
      <main className="w-full max-w-6xl flex flex-col gap-16 items-center justify-center pt-20 pb-16 px-4 md:px-12">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-20 w-full">
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg mb-6 ring-1 ring-blue-600/20 dark:ring-blue-400/20">
              <span className="text-lg mr-2">🕒</span>
              ExpiryTracker
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight lg:leading-tight">
              Never Miss
              <span className="block text-blue-600 dark:text-blue-400">Expiry Dates Again</span>
            </h1>

            {/* Description */}
            <p className="text-slate-600 dark:text-slate-300 text-lg lg:text-xl max-w-2xl mb-8 leading-relaxed">
              Track, organize, and get notified before your products expire.
              We&apos;ll send a single alert to your <strong>email or WhatsApp</strong> on the day
              it matters most — so nothing goes to waste.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center lg:justify-start">
              <Link
                href="/register"
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold text-lg shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Sign In
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Completely free · No credit card required
            </p>
          </div>

          {/* Hero Image */}
          <div className="flex-1 flex items-center justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/20 dark:to-indigo-600/20 rounded-3xl blur-3xl"></div>
              <Image
                src="/window.svg"
                width={400}
                height={400}
                alt="Expiry Tracker app"
                className="relative drop-shadow-2xl rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
              Get set up in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: "📸", title: "Add your products", desc: "Enter the name and expiry date, or scan a label with smart OCR." },
              { step: "2", icon: "🔔", title: "Choose your alert channel", desc: "Get notified by email, WhatsApp, or right in the app — your choice." },
              { step: "3", icon: "✅", title: "Never waste again", desc: "On expiry day we send one clear reminder. Use it, donate it, or toss it in time." },
            ].map((s) => (
              <div key={s.step} className="group relative overflow-hidden rounded-2xl glass card-hover p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="absolute top-4 right-4 text-5xl font-black text-slate-200/60 dark:text-slate-700/40 group-hover:text-blue-200/60 dark:group-hover:text-blue-800/40 transition-colors">
                  {s.step}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Track Expiry Dates
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
              Powerful features designed to make expiry date tracking effortless and reliable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature icon="📷" title="Smart OCR" description="Scan receipts or labels and auto-read expiry dates with advanced AI" />
            <Feature icon="📧" title="Email Alerts" description="A single reminder lands in your inbox on the day a product expires" />
            <Feature icon="💬" title="WhatsApp Alerts" description="Get a WhatsApp message on expiry day — no app needed to receive it" />
            <Feature icon="📊" title="Smart Analytics" description="See expiring, expired, and healthy products at a glance" />
            <Feature icon="📱" title="Mobile First" description="Works perfectly on any device with responsive design and PWA support" />
            <Feature icon="🔍" title="Advanced Search" description="Instant search, filters, and sorting across every product you track" />
            <Feature icon="☁️" title="Cloud Backup" description="Export, import, and restore your data anytime as CSV or JSON" />
            <Feature icon="⚡" title="Lightning Fast" description="Modern, intuitive interface with instant search and filtering" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <Stat number="99.9%" label="OCR Accuracy" />
            <Stat number="24/7" label="Monitoring" />
            <Stat number="∞" label="Products" />
            <Stat number="0" label="Missed Dates" />
          </div>
        </div>

        {/* Trust Section */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "💰", title: "100% Free", desc: "No hidden charges, no credit card needed. Everything is free while we grow." },
              { icon: "🔒", title: "Your Data, Your Control", desc: "Export, backup, or delete your data anytime. We never sell your information." },
              { icon: "🚀", title: "Built for Scale", desc: "Unlimited products, unlimited lists. No artificial caps — just a tool that works." },
            ].map((item) => (
              <div key={item.title} className="group relative overflow-hidden rounded-2xl glass card-hover p-6 border border-slate-200/50 dark:border-slate-700/50 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg mx-auto">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="w-full text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to stop wasting food and money?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join ExpiryTracker today and get your first reminder on the next expiry day.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-4 rounded-xl bg-white text-blue-700 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Create Your Free Account
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl glass card-hover p-6 border border-slate-200/50 dark:border-slate-700/50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-2xl">
          {icon}
        </div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">{description}</p>
      </div>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{number}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</div>
    </div>
  );
}
