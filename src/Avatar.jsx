import React from "react";

export default function Avatar({ userId, username, online }) {
  const colors = [
    "bg-red-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-purple-200",
    "bg-blue-200",
    "bg-teal-200",
  ];
  const userIdBase10 = parseInt(userId, 16);
  const colorInd = userIdBase10 % colors.length;
  return (
    <div
      className={`w-8 h-8 ${colors[colorInd]} relative rounded-full flex items-center p-0 m-0`}
    >
      <div className="w-full text-center opacity-70 p-0 m-0">
        {username[0].toUpperCase()}
      </div>
      {online && (
        <div className="absolute w-2.5 h-2.5 bg-green-400 rounded-full bottom-0 right-0 border border-white"></div>
      )}
      {!online && (
        <div className="absolute w-2.5 h-2.5 bg-gray-400 rounded-full bottom-0 right-0 border border-white"></div>
      )}
    </div>
  );
}
