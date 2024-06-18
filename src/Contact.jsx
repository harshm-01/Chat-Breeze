import React from "react";
import Avatar from "./Avatar";

export default function Contact({id, username, onClick, selected, online}) {
  return (
    <div
      key={id}
      onClick={() => onClick(id)}
      className={`border-b border-gray-100 ${
        selected ? "bg-gray-100" : ""
      } flex items-center cursor-pointer`}
    >
      {selected && (
        <div className="w-1 h-12 bg-gray-500 flex rounded-r-md"></div>
      )}
      <div className="py-2 pl-4 flex items-center gap-2">
        <Avatar online={online} username={username} userId={id} />
        <span className="text-gray-800">{username}</span>
      </div>
    </div>
  );
}
