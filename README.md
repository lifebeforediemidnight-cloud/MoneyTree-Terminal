# MoneyTree Trading Terminal

A dark, high-fidelity elite trading terminal built with modern web technologies. MoneyTree Terminal seamlessly supports multi-venue equity brokers, crypto exchanges, secure credential vaulting, paper portfolios, and live simulation feeds.

## Core Features

- **Unified Trading Console**: A professional-grade, dark-themed interface for entering orders, monitoring active positions, and tracking portfolio exposure across various exchanges.
- **Multi-Venue Architecture**: Connect and trade across equity brokers (like Dhan API) and cryptocurrency exchanges through a unified pluggable adapter system (CCXT-inspired).
- **Secure Vaulting Engine**: Securely store and vault API keys and credentials entirely within a local vault architecture.
- **Paper Trading Sandbox**: Activate a risk-free execution sandbox environment outfitted with a $1,000,000 virtual balance to test strategies securely.
- **Interactive Charting Desk**: Fast and responsive SVG-based canvas charting system for visualizing direct simulated price feeds.
- **Google Drive Export Pipeline**: Utilize Google OAuth to synchronize and export transaction registries, open position snapshots, and system diagnostic logs directly into your secure Google Drive workspace.
- **Live Event Logs & Audits**: Diagnostic panel revealing background daemons, multiprocessor states, and transactional history.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS (for sharp, modular UI styling), Lucide React (Icons).
- **Backend / Persistence**: Node.js/Express, SQLite for maintaining local logs, portfolios, and orders.
- **Integrations**: Firebase Auth / Google Workspace Drive APIs for report export capabilities.
- **Design System**: A strict, polished "Cosmic Slate" themed UI adhering to terminal aesthetics—relying on monospace fonts (`JetBrains Mono`/`Inter`), tight padding, and functional data density.

## Getting Started

1. Set up the relevant environment variables in `.env` based on the `.env.example` structure.
2. Ensure Firebase/Google Auth credentials match your configured `firebase-applet-config.json` if extending the Drive integration.
3. Run the development server to test paper portfolios or connect live API gateways.
