export const csvService = {
  generateCSV: (transactions) => {
    // CSV Header (HomeBank CSV format usually doesn't strictly require a header if mapped manually,
    // but a header helps. HomeBank documentation specifies CSV format)
    // Format: date;mode;info;payee;memo;amount;category;tags
    // Mode: 0=None, 1=Credit Card, 2=Check, 3=Cash, 4=Transfer, 5=Internal Transfer, 6=Debit Card, 7=Standing order, 8=Electronic payment, 9=Deposit, 10=FI fee, 11=Direct Debit

    // We will assume Mode 0 or 8 for now.

    const header = 'date;mode;info;payee;memo;amount;category;tags\n';

    const rows = transactions.map(t => {
      // Amount: HomeBank expects negative for expense, positive for income
      // Our App likely captures absolute amount. We assume expense by default unless specified otherwise?
      // For now, let's assume everything is an expense if it's a receipt.
      const amount = -Math.abs(parseFloat(t.amount || 0));

      // Memo: Add time if available
      let memo = t.memo || '';
      if (t.time) {
        const timeTag = `[${t.time}]`;
        if (!memo.startsWith(timeTag)) {
          memo = `${timeTag} ${memo}`;
        }
      }

      // Escape semicolons in fields
      const escape = (str) => (str || '').replace(/;/g, ',');

      return [
        t.date, // YYYY-MM-DD
        '0', // Mode (0=None)
        '', // Info
        escape(t.payee),
        escape(memo),
        amount.toFixed(2),
        escape(t.category),
        escape(t.tags)
      ].join(';');
    });

    return header + rows.join('\n');
  },

  downloadCSV: (csvContent, filename = 'export.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
