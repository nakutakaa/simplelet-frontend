// src/App.jsx
import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">SimpleLet</h1>
              <p className="text-sm text-gray-500">
                Simple property listings. No clutter.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline">Login</button>
              <button className="btn-primary">Register</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HomePage />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>
            © 2026 SimpleLet. All rights reserved. Made with ❤️ for simple
            property listings.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
