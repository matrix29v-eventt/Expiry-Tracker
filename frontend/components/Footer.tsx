export default function Footer() {
  return (
    <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/10 mt-auto">
      © {new Date().getFullYear()} Expiry Tracker
    </footer>
  );
}
