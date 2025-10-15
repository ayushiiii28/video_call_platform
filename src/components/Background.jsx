// src/components/Background.jsx

import OfficeImage from '../assets/OfficeImage.jpeg'; 
import LivingRoomImage from '../assets/LivingRoom.jpeg'; 

// 🎨 Background options list
export const BACKGROUND_OPTIONS = [
  { 
    code: "none", 
    name: "None (Real Background)", 
    className: "bg-[#1E1F21]", 
    style: {} 
  },
  { 
    code: "blur-light", 
    name: "Light Blur", 
    // 🛑 REMOVED BLUR CLASS: Now just the color
    className: "bg-[#1E1F21]", 
    style: {} 
  },
  { 
    code: "blur-heavy", 
    name: "Heavy Blur", 
    // 🛑 REMOVED BLUR CLASS: Now just the color
    className: "bg-[#1E1F21]", 
    style: {} 
  },
  {
    code: "virtual-office",
    name: "Virtual: Office",
    className: `bg-cover bg-center`,
    style: { backgroundImage: `url(${OfficeImage})` } 
  },
  {
    code: "virtual-livingroom",
    name: "Virtual: Living Room",
    className: `bg-cover bg-center`,
    style: { backgroundImage: `url(${LivingRoomImage})` }
  },
];

// ... (getSelectedBackgroundProps and isVirtualBackgroundSelected remain the same)
export const getSelectedBackgroundProps = (selectedCode) => {
    const selected = BACKGROUND_OPTIONS.find((opt) => opt.code === selectedCode);
    
    return selected 
        ? { className: selected.className, style: selected.style || {} }
        : { className: "bg-[#1E1F21]", style: {} };
};

export const isVirtualBackgroundSelected = (selectedCode) => {
  return selectedCode.startsWith("virtual-");
};