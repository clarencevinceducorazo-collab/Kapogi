import Link from "next/link";

export function PageFooter() {
    return (
        <footer className="text-center font-bold text-slate-800 pb-8 max-w-6xl mx-auto px-4">
            <div className="bg-white inline-block px-6 py-2 rounded-full comic-border mb-4">
                © 2026 KAPOGIAN
            </div>
            <div className="flex justify-center gap-6 text-sm">
                <Link href="#" className="hover:underline">TERMS</Link>
                <Link href="#" className="hover:underline">PRIVACY</Link>
                <Link href="#" className="hover:underline">SMART CONTRACT</Link>
            </div>
        </footer>
    );
}
