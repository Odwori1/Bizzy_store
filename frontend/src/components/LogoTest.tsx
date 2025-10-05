import React from 'react';
import BizzyLogo from './Logo';

const LogoTest: React.FC = () => (
  <div className="p-8 bg-gray-50 min-h-screen">
    <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
      Bizzy Logo Concepts - "Your Trusted Business Eye"
    </h1>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-center max-w-6xl mx-auto">
      {/* Third Eye Business Logo - Main Concept */}
      <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <BizzyLogo variant="third-eye" size={80} />
        <p className="mt-3 font-semibold text-gray-900">Third Eye Business</p>
        <p className="text-sm text-gray-600 mt-1">Main concept - Business insight</p>
      </div>
      
      {/* Simple Logo */}
      <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <BizzyLogo variant="simple" size={80} />
        <p className="mt-3 font-semibold text-gray-900">Simple</p>
        <p className="text-sm text-gray-600 mt-1">Clean & minimal</p>
      </div>
      
      {/* Eye Chart Logo */}
      <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <BizzyLogo variant="eye" size={80} />
        <p className="mt-3 font-semibold text-gray-900">Eye Chart</p>
        <p className="text-sm text-gray-600 mt-1">Data monitoring focus</p>
      </div>
      
      {/* Abstract Logo */}
      <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <BizzyLogo variant="abstract" size={80} />
        <p className="mt-3 font-semibold text-gray-900">Abstract Business</p>
        <p className="text-sm text-gray-600 mt-1">Modern & creative</p>
      </div>
    </div>
    
    {/* Logo with text examples */}
    <div className="mt-12 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
        Logo with Text Variations
      </h2>
      <div className="space-y-6">
        <div className="flex justify-center">
          <BizzyLogo variant="third-eye" size={60} showText={true} />
        </div>
        <div className="flex justify-center">
          <BizzyLogo variant="third-eye" size={80} showText={true} />
        </div>
        <div className="flex justify-center">
          <BizzyLogo variant="third-eye" size={100} showText={true} />
        </div>
      </div>
    </div>
  </div>
);

export default LogoTest;
