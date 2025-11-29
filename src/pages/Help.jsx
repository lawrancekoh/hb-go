function Help() {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Help & Instructions</h2>

      <div className="prose text-gray-700">
        <h3 className="text-lg font-bold mb-2">How to Sync</h3>
        <ol className="list-decimal list-inside space-y-2 mb-4">
          <li><strong>Export:</strong> Tap "Export CSV" from the Inbox and save the file.</li>
          <li><strong>Import:</strong> In HomeBank Desktop, go to <code>File &gt; Import</code>. Select the downloaded CSV.</li>
          <li><strong>Assign Account:</strong> Select the account (e.g., Wallet, Checking) these receipts belong to.</li>
        </ol>

        <h3 className="text-lg font-bold mb-2">Tips</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Import your <code>.xhb</code> file in Settings to load your existing categories.</li>
          <li>Use the camera button to snap a receipt. The app will attempt to read the details.</li>
          <li>Verify the extracted data before saving.</li>
        </ul>
      </div>
    </div>
  );
}

export default Help;
