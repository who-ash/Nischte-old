import React from "react";

interface ShopBannerProps {
  shopName: string;
  phoneNumber: string;
  address: string;
  imageUrl: string;
}

const ShopBanner: React.FC<ShopBannerProps> = ({ shopName, phoneNumber, address, imageUrl }) => {
    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 h-52 md:h-auto">
          <img 
            src={imageUrl || "/placeholder.svg"} 
            alt={shopName} 
            className="w-full h-full object-cover object-center max-h-80" 
          />
        </div>
        <div className="w-full md:w-2/3 p-5 flex flex-col justify-center text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{shopName}</h1>
          <p className="text-lg text-gray-600 mb-1">{phoneNumber}</p>
          <p className="text-lg text-gray-600">{address}</p>
        </div>
      </div>
    );
  };
  

export default ShopBanner;
