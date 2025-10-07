// /src/components/market/PortfolioTracker.tsx
'use client';

import { useEffect, useState } from 'react';

interface PortfolioItem {
  id: string;
  coin: string;
  amount: number;
  price: number;
  timestamp: string;
}

interface TaxInfo {
  countryCode: string;
  taxRate: number;
  taxDueDate: string;
  calculatedTax: number;
  profit: number;
}

const PortfolioTracker = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newCoin, setNewCoin] = useState({ coin: '', amount: '', price: '' });
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!localStorage.getItem('isLoggedIn'); // Mock auth check
  const isPremium = !!localStorage.getItem('isPremium'); // Mock premium check
  const maxFreeTokens = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Terminate after 2 seconds

      try {
        const response = await fetch('https://api.coindaily.online/mock-portfolio', {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch portfolio');
        const data = await response.json();
        setPortfolio(data);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching portfolio:`, error);
        setPortfolio([]);
        alert('Failed to load portfolio. Please try again.');
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchPortfolio();

    const interval = setInterval(fetchPortfolio, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const addToPortfolio = () => {
    if (!isAuthenticated) {
      alert('Please log in to manage your portfolio.');
      return;
    }
    if (!newCoin.coin || !newCoin.amount || !newCoin.price) {
      alert('Please fill all fields.');
      return;
    }
    if (!isPremium && portfolio.length >= maxFreeTokens) {
      alert(`Free users are limited to ${maxFreeTokens} tokens. Upgrade to premium for unlimited portfolios!`);
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      coin: newCoin.coin,
      amount: parseFloat(newCoin.amount),
      price: parseFloat(newCoin.price),
      timestamp: new Date().toISOString(),
    };
    setPortfolio((prev) => [...prev, newItem]);
    setNewCoin({ coin: '', amount: '', price: '' });
    alert('Coin added to portfolio (mock action)');
  };

  const removeFromPortfolio = (id: string) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
    alert('Coin removed from portfolio (mock action)');
  };

  const calculateTaxAndProfit = () => {
    if (!isPremium) {
      alert('Tax management is available only for premium users. Upgrade now!');
      return;
    }
    const totalValue = portfolio.reduce((sum, item) => sum + item.amount * item.price, 0);
    const profit = totalValue - portfolio.reduce((sum, item) => sum + item.amount * 10, 0); // Mock initial cost
    const taxRate = taxInfo?.taxRate || 0.2; // Default 20% if not set
    const calculatedTax = profit * taxRate;
    setTaxInfo({
      countryCode: taxInfo?.countryCode || 'US',
      taxRate,
      taxDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      calculatedTax,
      profit,
    });
    checkTaxReminder();
  };

  const checkTaxReminder = () => {
    if (taxInfo?.taxDueDate) {
      const dueDate = new Date(taxInfo.taxDueDate).getTime();
      const now = Date.now();
      if (dueDate - now < 7 * 24 * 60 * 60 * 1000) { // 7 days before due
        alert(`Tax due on ${taxInfo.taxDueDate}! Prepare your documents.`);
      }
    }
  };

  const exportToPDF = async () => {
    if (!isPremium || !taxInfo) {
      alert('PDF export is available only for premium users with tax info. Upgrade now!');
      return;
    }

    const latexContent = `
      \\documentclass{article}
      \\usepackage[utf8]{inputenc}
      \\usepackage{geometry}
      \\geometry{a4paper, margin=1in}
      \\usepackage{amsmath}
      \\usepackage{booktabs}
      \\usepackage{longtable}

      \\begin{document}

      \\section*{Portfolio and Tax Report}
      \\textbf{User Portfolio} as of ${new Date().toISOString().split('T')[0]}

      \\begin{longtable}{lcc}
      \\toprule
      Coin & Amount & Price (\\$) \\\\
      \\midrule
      ${portfolio.map(item => `${item.coin} & ${item.amount} & ${item.price.toFixed(2)} \\\\`).join('\n')}
      \\bottomrule
      \\end{longtable}

      \\section*{Tax Information}
      \\textbf{Country Code}: ${taxInfo.countryCode} \\
      \\textbf{Tax Rate}: ${taxInfo.taxRate * 100}\\% \\
      \\textbf{Profit}: \\$${taxInfo.profit.toFixed(2)} \\
      \\textbf{Calculated Tax}: \\$${taxInfo.calculatedTax.toFixed(2)} \\
      \\textbf{Tax Due Date}: ${taxInfo.taxDueDate}

      \\end{document}
    `;

    try {
      // Simulate PDF generation (in production, use server-side PDF generation)
      const pdfContent = `Portfolio Tax Report\n\n${latexContent}`;
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'portfolio-tax-report.txt';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error generating PDF:`, error);
      alert('Failed to generate PDF. Please try again or contact support.');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading portfolio...</div>;
  if (!isAuthenticated) return <div className="p-4 text-center">Please log in to view or manage your portfolio.</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold text-gray-900">Portfolio Tracker 💼</h2>
      {isAuthenticated && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            value={newCoin.coin}
            onChange={(e) => setNewCoin({ ...newCoin, coin: e.target.value })}
            placeholder="Coin (e.g., DOGE)"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            value={newCoin.amount}
            onChange={(e) => setNewCoin({ ...newCoin, amount: e.target.value })}
            placeholder="Amount"
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            value={newCoin.price}
            onChange={(e) => setNewCoin({ ...newCoin, price: e.target.value })}
            placeholder="Price ($)"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={addToPortfolio}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
          >
            Add to Portfolio
          </button>
          {!isPremium && portfolio.length >= maxFreeTokens && (
            <p className="text-yellow-600 mt-2">Upgrade to premium for unlimited portfolios!</p>
          )}
        </div>
      )}
      {portfolio.length > 0 && (
        <ul className="mt-4 space-y-2">
          {portfolio.map((item) => (
            <li key={item.id} className="p-2 bg-gray-50 rounded">
              <p><strong>Coin:</strong> {item.coin}</p>
              <p><strong>Amount:</strong> {item.amount}</p>
              <p><strong>Price:</strong> ${item.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Added: {new Date(item.timestamp).toLocaleTimeString()}</p>
              <button
                onClick={() => removeFromPortfolio(item.id)}
                className="mt-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {isPremium && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-900">Tax Management</h3>
          <input
            type="text"
            value={taxInfo?.countryCode || ''}
            onChange={(e) => setTaxInfo({ ...taxInfo, countryCode: e.target.value } as TaxInfo)}
            placeholder="Country Code (e.g., US)"
            className="w-full p-2 border rounded mb-2"
          />
          <button
            onClick={calculateTaxAndProfit}
            className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 mb-2"
          >
            Calculate Tax & Profit
          </button>
          {taxInfo && (
            <div className="p-2 bg-gray-50 rounded">
              <p><strong>Profit:</strong> ${taxInfo.profit.toFixed(2)}</p>
              <p><strong>Tax:</strong> ${taxInfo.calculatedTax.toFixed(2)}</p>
              <p><strong>Due Date:</strong> {taxInfo.taxDueDate}</p>
              <button
                onClick={exportToPDF}
                className="mt-2 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                Export to PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioTracker;