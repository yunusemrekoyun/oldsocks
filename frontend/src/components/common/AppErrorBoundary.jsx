import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Sayfa yüklenemedi:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12 text-gray-900">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold">Sayfa yüklenemedi</h1>
          <p className="mt-3 text-sm leading-6 text-gray-700">
            Site bu sekme açıkken güncellenmiş olabilir. Sayfayı yeniden yükleyip kaldığınız yerden devam edin.
          </p>
          <button
            type="button"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("_refresh", String(Date.now()));
              window.location.replace(url.toString());
            }}
            className="mt-6 rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Sayfayı yeniden yükle
          </button>
        </div>
      </main>
    );
  }
}
