function SimpleApp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">ACORD</h1>
        <p className="text-gray-600">Restaurant Management System v1.2</p>
        <div className="mt-8">
          <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;