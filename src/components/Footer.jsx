export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 text-sm text-neutral-400 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          © {new Date().getFullYear()} FinScribe.ai — Build faster financial narratives and ops.
        </div>
        <div className="flex items-center gap-4">
          <a className="hover:text-white transition" href="#">Privacy</a>
          <a className="hover:text-white transition" href="#">Terms</a>
          <a className="hover:text-white transition" href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
