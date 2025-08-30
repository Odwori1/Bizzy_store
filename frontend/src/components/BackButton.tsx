import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  text?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  text = "Back", 
  className = "" 
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`flex items-center text-indigo-600 hover:text-indigo-800 transition-colors ${className}`}
    >
      <span className="mr-1">←</span>
      <span>{text}</span>
    </button>
  );
};

export default BackButton;
