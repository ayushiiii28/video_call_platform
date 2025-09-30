import React from "react";

export default function PermissionOverlay({ missingPermissions, onRetry }) {
  if (!missingPermissions || missingPermissions.length === 0) return null;

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-70 z-50 p-6 text-center text-white">
      <h2 className="text-2xl font-bold mb-4">Permissions Required</h2>
      <p className="mb-4">The following permissions are required to use this meeting room:</p>
      <ul className="mb-6 list-disc list-inside">
        {missingPermissions.map((perm) => (
          <li key={perm} className="text-lg">{perm}</li>
        ))}
      </ul>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
      >
        Retry Permissions
      </button>
    </div>
  );
}
