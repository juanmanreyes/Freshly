import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Trash2, 
  CheckCircle2, 
  ChefHat, 
  AlertCircle, 
  Plus, 
  X, 
  Moon, 
  Sun,
  ChevronRight,
  Loader2,
  UtensilsCrossed,
  Mail,
  Lock,
  Chrome,
  User,
  Refrigerator,
  Scan,
  Apple,
  Clock,
  Zap,
  ClipboardList,
  ListChecks,
  Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Markdown from 'react-markdown';
import { useInventory } from './hooks/useInventory';
import { get, set } from 'idb-keyval';
import { analyzeFoodImage, generateRecipe, FoodItem, generateIndividualIcon, generateOnboardingImage, type Recipe } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 to-transparent opacity-60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1.05 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-[#00C88C] rounded-[32px] flex items-center justify-center shadow-2xl shadow-[#00C88C]/20">
          <Refrigerator size={48} className="text-white" />
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-[32px] font-bold tracking-tight text-slate-900"
        >
          Freshly
        </motion.h1>
      </motion.div>
    </motion.div>
  );
};

const Onboarding = ({ onFinish }: { onFinish: () => void }) => {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

  const steps = [
    {
      title: "Say goodbye to waste,\nhello to savings.",
      desc: "Transform what you have into delicious meals and never waste a single ingredient.",
      prompt: "Generate a hyperrealistic 3D illustration of a modern, sleek double-door refrigerator. The fridge should be fully stocked with neatly organized fresh groceries in clear containers, fruits, and vegetables. One of the bottom crisper drawers should have a subtle green glow emanating from the vegetables. Soft studio lighting, Octane Render style, front 3/4 view, pure white background."
    },
    {
      title: "Your kitchen, now with\nsuperpowers.",
      desc: "Organize your fridge, predict expiration dates, and keep your monthly spending to a minimum.",
      prompt: "Generate a hyperrealistic 3D illustration of a hand holding a modern smartphone. The phone screen displays an open camera app interface, actively scanning a bunch of fresh spinach and a half-cut avocado on a light wooden surface. A clean, minimalist UI overlay with a green scanning box and subtle text 'Spinach - Fresh' and '8 days' should be visible. Soft studio lighting, Octane Render style, eye-level perspective, pure white background."
    },
    {
      title: "Get inspired by what\nyou already have.",
      desc: "We suggest delicious recipes based on the ingredients that are about to expire.",
      prompt: "Generate a hyperrealistic 3D illustration of a simple, elegant bowl of spaghetti with red sauce and fresh basil on top, placed slightly off-center. Around the bowl, various 3D ingredients like a red tomato, basil leaves, orecchiette pasta, and other small pasta shapes should be gently floating. In the background, a modern smartphone is levitating, displaying a recipe app interface with '5 Steps' visible. Soft studio lighting, Octane Render style, slightly elevated perspective, pure white background."
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  useEffect(() => {
    const fetchImage = async () => {
      if (images[step]) return;

      // Check IndexedDB first
      try {
        const cached = await get(`onboarding_img_${step}`);
        if (cached) {
          setImages(prev => ({ ...prev, [step]: cached as string }));
          return;
        }
      } catch (e) {
        console.warn("IDB error", e);
      }

      if (loadingImages[step]) return;

      setLoadingImages(prev => ({ ...prev, [step]: true }));
      try {
        const url = await generateOnboardingImage(steps[step].prompt);
        if (url) {
          setImages(prev => ({ ...prev, [step]: url }));
          await set(`onboarding_img_${step}`, url);
        }
      } catch (error) {
        console.error("Error fetching onboarding image:", error);
      } finally {
        setLoadingImages(prev => ({ ...prev, [step]: false }));
      }
    };

    fetchImage();
  }, [step]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col p-8 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-between py-12 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) handleNext();
              else if (info.offset.x > 50) handlePrev();
            }}
            className="flex flex-col items-center text-center cursor-grab active:cursor-grabbing w-full"
          >
            <h2 className="text-[28px] font-bold leading-tight text-slate-900 mb-12 whitespace-pre-line pointer-events-none">
              {steps[step].title}
            </h2>

            <div className="relative w-full aspect-square flex items-center justify-center mb-12 pointer-events-none">
              <div className="absolute inset-0 bg-white rounded-full scale-90" />
              {loadingImages[step] ? (
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-medium animate-pulse">Generating 3D illustration...</p>
                </div>
              ) : images[step] ? (
                <motion.img 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={images[step]} 
                  alt={steps[step].title}
                  className="relative z-10 w-full h-full object-contain"
                />
              ) : (
                <div className="relative z-10 w-full h-full flex items-center justify-center bg-slate-100 rounded-3xl">
                  <Refrigerator size={64} className="text-slate-300" />
                </div>
              )}
            </div>

            <p className="text-slate-500 text-lg leading-relaxed px-4 pointer-events-none">
              {steps[step].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-12 w-full">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <motion.div 
                key={i} 
                initial={false}
                animate={{ 
                  width: step === i ? 32 : 8,
                  backgroundColor: step === i ? "#10b981" : "#e2e8f0" 
                }}
                className="h-2 rounded-full cursor-pointer"
                onClick={() => setStep(i)}
              />
            ))}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/20"
          >
            {step === 2 ? "Get Started" : "Next"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const Auth = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col p-8 overflow-y-auto">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        className="flex-1 flex flex-col max-w-sm mx-auto w-full justify-center"
      >
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          <div className="w-14 h-14 bg-[#00C88C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C88C]/20">
            <Refrigerator size={28} className="text-white" />
          </div>
          <h1 className="text-[40px] font-bold text-slate-900">Freshly</h1>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="space-y-6 mb-8"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                className="w-full pl-14 pr-6 py-4 rounded-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C88C] transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                className="w-full pl-14 pr-6 py-4 rounded-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C88C] transition-all"
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <button className="text-sm font-bold text-[#00C88C] hover:underline">Forgot password?</button>
          </div>
        </motion.div>

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="flex flex-col gap-4 mt-8"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onLogin}
            className="w-full py-4 rounded-2xl bg-[#00C88C] text-white font-bold text-lg shadow-xl shadow-[#00C88C]/20"
          >
            Log in
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-white border-2 border-slate-100 text-[#00C88C] font-bold text-lg"
          >
            Create an account
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- Constants & Data ---

const FOOD_CATEGORIES = [
  { id: 'lacteos', name: 'Dairy', icon: '🥛', items: [
    { name: 'Milk', shelfLife: 7 },
    { name: 'Yogurt', shelfLife: 14 },
    { name: 'Cheese', shelfLife: 21 },
    { name: 'Butter', shelfLife: 60 },
    { name: 'Eggs', shelfLife: 30 },
  ]},
  { id: 'frutas', name: 'Fruits', icon: '🍎', items: [
    { name: 'Apples', shelfLife: 14 },
    { name: 'Bananas', shelfLife: 5 },
    { name: 'Strawberries', shelfLife: 3 },
    { name: 'Oranges', shelfLife: 14 },
    { name: 'Grapes', shelfLife: 7 },
  ]},
  { id: 'granos', name: 'Grains', icon: '🌾', items: [
    { name: 'Rice', shelfLife: 365 },
    { name: 'Lentils', shelfLife: 365 },
    { name: 'Beans', shelfLife: 365 },
    { name: 'Pasta', shelfLife: 365 },
    { name: 'Oats', shelfLife: 180 },
  ]},
  { id: 'proteinas', name: 'Proteins', icon: '🍗', items: [
    { name: 'Chicken', shelfLife: 3 },
    { name: 'Beef', shelfLife: 3 },
    { name: 'Fish', shelfLife: 2 },
    { name: 'Pork', shelfLife: 3 },
    { name: 'Tofu', shelfLife: 7 },
  ]},
  { id: 'verduras', name: 'Vegetables', icon: '🥦', items: [
    { name: 'Spinach', shelfLife: 5 },
    { name: 'Tomatoes', shelfLife: 7 },
    { name: 'Carrots', shelfLife: 21 },
    { name: 'Broccoli', shelfLife: 7 },
    { name: 'Onions', shelfLife: 30 },
  ]},
];

const CATEGORY_MAP: Record<string, string> = {
  'grains': 'granos',
  'vegetables': 'verduras',
  'fruits': 'frutas',
  'dairy': 'lacteos',
  'proteins': 'proteinas',
  'granos': 'granos',
  'verduras': 'verduras',
  'frutas': 'frutas',
  'lácteos': 'lacteos',
  'lacteos': 'lacteos',
  'proteínas': 'proteinas',
  'proteinas': 'proteinas',
  'meat': 'proteinas',
  'fruit': 'frutas',
  'pantry': 'granos'
};

const getCategoryKey = (cat: string) => CATEGORY_MAP[cat.toLowerCase()] || cat.toLowerCase();

const getExpiryStatus = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 2) return { label: 'Urgent', category: 'Urgent', daysLeft, color: 'bg-orange-500', shadow: 'shadow-orange-500/20' };
  if (daysLeft <= 5) return { label: 'Soon', category: 'Soon', daysLeft, color: 'bg-amber-400', shadow: 'shadow-amber-400/20' };
  return { label: 'Fresh', category: 'Fresh', daysLeft, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' };
};

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<'splash' | 'onboarding' | 'auth' | 'app'>('splash');
  const { items, loading, addItem, removeItem } = useInventory();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes'>('inventory');
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [filter, setFilter] = useState<'All' | 'Urgent' | 'Soon' | 'Fresh'>('All');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [itemIcons, setItemIcons] = useState<Record<string, string>>({});
  const [emptyStates, setEmptyStates] = useState<Record<string, string>>({});
  const [loadingEmptyStates, setLoadingEmptyStates] = useState<Record<string, boolean>>({});

  // New states for Add Food flow
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [manualAddStep, setManualAddStep] = useState<'categories' | 'items' | 'congrats' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof FOOD_CATEGORIES[0] | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ name: string, shelfLife: number }[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll detection for Nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Fetch Category Icons
  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const savedIcons = await get('categoryIcons');
        if (savedIcons) {
          setCategoryIcons(savedIcons as Record<string, string>);
          return;
        }
      } catch (e) {
        console.error("Error reading from IndexedDB", e);
      }

      const icons: Record<string, string> = {};
      const categories = [
        { id: 'granos', name: 'a bowl of rice', cat: 'Grains' },
        { id: 'verduras', name: 'fresh broccoli', cat: 'Vegetables' },
        { id: 'frutas', name: 'a red apple', cat: 'Fruits' },
        { id: 'lacteos', name: 'a bottle of milk', cat: 'Dairy' },
        { id: 'proteinas', name: 'a beef steak', cat: 'Proteins' }
      ];

      for (const cat of categories) {
        const iconUrl = await generateIndividualIcon(cat.name, cat.cat);
        if (iconUrl) {
          icons[cat.id] = iconUrl;
          setCategoryIcons(prev => ({ ...prev, [cat.id]: iconUrl }));
          // Wait 3 seconds between generations to avoid 429
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      try {
        await set('categoryIcons', icons);
      } catch (e) {
        console.error("Error saving to IndexedDB", e);
      }
    };

    fetchIcons();
  }, []);

  // Fetch Item Icons when category is selected
  useEffect(() => {
    if (!selectedCategory || manualAddStep !== 'items') return;

    const fetchItemIcons = async () => {
      const newIcons: Record<string, string> = { ...itemIcons };
      let changed = false;

      for (const item of selectedCategory.items) {
        if (newIcons[item.name]) continue;

        try {
          const cached = await get(`item_icon_${item.name}`);
          if (cached) {
            newIcons[item.name] = cached as string;
            changed = true;
            continue;
          }

          const url = await generateIndividualIcon(item.name, selectedCategory.name);
          if (url) {
            newIcons[item.name] = url;
            await set(`item_icon_${item.name}`, url);
            changed = true;
            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (e) {
          console.error(`Error fetching icon for ${item.name}`, e);
        }
      }

      if (changed) {
        setItemIcons(newIcons);
      }
    };

    fetchItemIcons();
  }, [selectedCategory, manualAddStep]);
  // Fetch Empty State Images
  useEffect(() => {
    const fetchEmptyStates = async () => {
      const states = [
        { 
          id: 'inventory', 
          prompt: "3D hyperrealistic render of a modern, sleek, empty double-door refrigerator with glass doors, white frame, bright internal LED lighting, isolated on a pure white background, high-end appliance, minimalist style." 
        },
        { 
          id: 'recipes', 
          prompt: "3D hyperrealistic render of a rustic ceramic bowl on a circular wooden board. Floating above the bowl are fresh culinary ingredients: a ripe red tomato, fresh green basil leaves, sliced red onion rings, sprigs of rosemary, and scattered black peppercorns. Pure white background, soft studio lighting, vibrant and appetizing colors." 
        }
      ];

      for (const state of states) {
        try {
          const cached = await get(`empty_state_${state.id}`);
          if (cached) {
            setEmptyStates(prev => ({ ...prev, [state.id]: cached as string }));
            continue;
          }

          setLoadingEmptyStates(prev => ({ ...prev, [state.id]: true }));
          const url = await generateOnboardingImage(state.prompt);
          if (url) {
            setEmptyStates(prev => ({ ...prev, [state.id]: url }));
            await set(`empty_state_${state.id}`, url);
          }
        } catch (e) {
          console.error(`Error fetching empty state ${state.id}`, e);
        } finally {
          setLoadingEmptyStates(prev => ({ ...prev, [state.id]: false }));
        }
      }
    };

    fetchEmptyStates();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const filteredItems = items.filter(item => {
    if (filter === 'All') return true;
    const status = getExpiryStatus(item.expiry_date);
    return status.category === filter;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'app' || activeTab !== 'inventory' || filteredItems.length === 0 || isAddSheetOpen || isCameraOpen) return;
      if (e.key === 'ArrowRight') {
        setCarouselIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowLeft') {
        setCarouselIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, activeTab, filteredItems.length, isAddSheetOpen, isCameraOpen]);

  const expiringCount = items.filter(i => {
    const status = getExpiryStatus(i.expiry_date);
    return status.category === 'Hoy';
  }).length;

  const categoriesWithItems = new Set(items.map(item => getExpiryStatus(item.expiry_date).category));
  const showChips = categoriesWithItems.size >= 2;

  const startCamera = async () => {
    setIsAddSheetOpen(false);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleProcessImage = async () => {
    if (!capturedImage) return;
    setIsScanning(true);
    try {
      const analyzed = await analyzeFoodImage(capturedImage);
      await addItem({
        ...analyzed as FoodItem,
        image_url: capturedImage
      });
      setCapturedImage(null);
      setIsCameraOpen(false);
      setActiveTab('inventory');
      setManualAddStep('congrats');
    } catch (err) {
      console.error("Error processing image:", err);
      alert("Error processing image with AI.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualAdd = async () => {
    if (selectedItems.length === 0) return;

    for (const food of selectedItems) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + food.shelfLife);
      
      await addItem({
        name: food.name,
        category: selectedCategory?.name || 'Other',
        expiry_date: expiryDate.toISOString(),
        status: food.shelfLife > 3 ? 'fresh' : 'warning',
      });
    }

    setSelectedItems([]);
    setManualAddStep('congrats');
  };

  const toggleItemSelection = (food: { name: string, shelfLife: number }) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.name === food.name);
      if (exists) {
        return prev.filter(i => i.name !== food.name);
      } else {
        return [...prev, food];
      }
    });
  };

  const handleConsume = (id: number) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#fbbf24', '#f43f5e']
    });
    removeItem(id);
  };

  const handleGetRecipe = async () => {
    setIsRecipeLoading(true);
    setRecipe(null);
    try {
      const res = await generateRecipe(items);
      setRecipe(res);
    } catch (err) {
      console.error("Error generating recipe:", err);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {view === 'splash' && (
          <SplashScreen key="splash" onFinish={() => setView('onboarding')} />
        )}

        {view === 'onboarding' && (
          <Onboarding key="onboarding" onFinish={() => setView('auth')} />
        )}

        {view === 'auth' && (
          <Auth key="auth" onLogin={() => setView('app')} />
        )}

        {view === 'app' && (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-32"
          >
            {/* Header */}
            <header className="p-8 pt-12 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00C88C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C88C]/20">
                    <ChefHat size={24} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Freshly
                  </h1>
                </div>
                <button className="p-2 text-slate-400">
                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
                    <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
                    <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
                  </div>
                </button>
              </div>

              {items.length > 0 && (
                <>
                  <div className="mb-12">
                    <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
                      Hello! you have {items.length} items
                    </h2>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex justify-between items-center mb-16 px-2">
                    {['All', 'Urgent', 'Soon', 'Fresh'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setFilter(cat as any); setCarouselIndex(0); }}
                        className={cn(
                          "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                          filter === cat 
                            ? "bg-emerald-500 text-white" 
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'inventory' ? (
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                          <Loader2 className="animate-spin text-emerald-500" size={40} />
                        </div>
                      ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                          <div className="relative w-[320px] h-[320px] mb-8 flex items-center justify-center">
                            {loadingEmptyStates['inventory'] ? (
                              <div className="flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-emerald-500" size={40} />
                                <p className="text-xs text-slate-400 font-medium animate-pulse">Generating 3D fridge...</p>
                              </div>
                            ) : emptyStates['inventory'] ? (
                              <motion.img 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={emptyStates['inventory']} 
                                alt="Empty Fridge"
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center">
                                <ChefHat size={80} className="text-slate-200" />
                              </div>
                            )}
                          </div>
                          <h3 className="text-[28px] font-bold text-slate-900 dark:text-white mb-4">
                            Ready to save?
                          </h3>
                          <p className="text-slate-500 text-lg leading-relaxed max-w-[280px]">
                            Adding your groceries to track freshness and discover new recipes.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          {(() => {
                            if (filteredItems.length === 0) {
                              return (
                                <div className="text-center py-16 text-slate-400">
                                  <p className="font-bold">No items in this category.</p>
                                </div>
                              );
                            }

                            const currentItem = filteredItems[carouselIndex % filteredItems.length];
                            const status = getExpiryStatus(currentItem.expiry_date);
                            const progressWidth = Math.min(100, Math.max(5, (status.daysLeft / 10) * 100));

                            return (
                              <div className="flex flex-col items-center w-full max-w-sm mx-auto">
                                <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-8">
                                  <AnimatePresence mode="wait">
                                    <motion.div
                                      key={currentItem.id}
                                      initial={{ opacity: 0, scale: 0.8, x: 100 }}
                                      animate={{ opacity: 1, scale: 1, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.8, x: -100 }}
                                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                      drag="x"
                                      dragConstraints={{ left: 0, right: 0 }}
                                      dragElastic={0.2}
                                      onDragEnd={(_, info) => {
                                        if (info.offset.x < -50) {
                                          setCarouselIndex(prev => (prev + 1) % filteredItems.length);
                                        } else if (info.offset.x > 50) {
                                          setCarouselIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                                        }
                                      }}
                                      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                                    >
                                      <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
                                        {currentItem.image_url ? (
                                          <img 
                                            src={currentItem.image_url} 
                                            alt={currentItem.name} 
                                            className="w-full h-full object-contain" 
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            {categoryIcons[getCategoryKey(currentItem.category)] ? (
                                              <img 
                                                src={categoryIcons[getCategoryKey(currentItem.category)]} 
                                                alt={currentItem.category} 
                                                className="w-full h-full object-contain scale-125" 
                                              />
                                            ) : (
                                              <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="animate-spin text-emerald-500" size={40} />
                                                <p className="text-xs text-slate-400 font-medium animate-pulse">Loading image...</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </AnimatePresence>
                                </div>

                                <div className="w-full px-4 relative z-10">
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                          {currentItem.name}
                                        </h3>
                                        <button 
                                          onClick={() => handleConsume(currentItem.id!)}
                                          className="p-1.5 rounded-full bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors"
                                          title="Mark as used"
                                        >
                                          <CheckCircle2 size={20} />
                                        </button>
                                      </div>
                                      <p className="text-lg text-slate-400 font-medium">
                                        {currentItem.category}
                                      </p>
                                    </div>
                                    <div className={cn(status.color, "px-4 py-1.5 rounded-full shadow-lg", status.shadow)}>
                                      <span className="text-xs font-bold text-white">
                                        {status.daysLeft} days left
                                      </span>
                                    </div>
                                  </div>

                                  <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progressWidth}%` }}
                                      className={cn("h-full transition-all duration-1000", status.color)}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="recipes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center justify-center py-12 px-8 text-center"
                  >
                    <div className="relative w-[320px] h-[320px] mb-8 flex items-center justify-center">
                      {loadingEmptyStates['recipes'] ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="animate-spin text-emerald-500" size={40} />
                          <p className="text-xs text-slate-400 font-medium animate-pulse">Generating 3D kitchen...</p>
                        </div>
                      ) : emptyStates['recipes'] ? (
                        <motion.img 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={emptyStates['recipes']} 
                          alt="Chef Illustration"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center">
                          <ChefHat size={80} className="text-slate-200" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-[28px] font-bold text-slate-900 dark:text-white mb-4">
                      Unleash your inner chef
                    </h3>
                    <p className="text-slate-500 text-lg leading-relaxed max-w-[300px] mb-12">
                      Intelligent recipes based on the food who will expired soon.
                    </p>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGetRecipe}
                      disabled={isRecipeLoading}
                      className="w-full py-5 bg-[#00C88C] text-white font-bold rounded-[24px] shadow-xl shadow-[#00C88C]/20 flex items-center justify-center gap-3"
                    >
                      {isRecipeLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={24} />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create a recipe</span>
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* Camera Modal */}
            <AnimatePresence>
              {isCameraOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black flex flex-col"
                >
                  <div className="relative flex-1">
                    {!capturedImage ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                          <div className="w-full h-full border-2 border-white/50 rounded-[32px]" />
                        </div>
                      </>
                    ) : (
                      <div className="relative w-full h-full">
                        <img src={capturedImage} className="w-full h-full object-cover" />
                        {isScanning && (
                          <motion.div 
                            initial={{ top: '0%' }}
                            animate={{ top: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] z-10"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-10 bg-black flex justify-between items-center">
                    <button onClick={() => { stopCamera(); setIsCameraOpen(false); setCapturedImage(null); }} className="p-4 rounded-full bg-white/10 text-white"><X size={24} /></button>
                    {!capturedImage ? (
                      <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"><div className="w-full h-full bg-white rounded-full" /></button>
                    ) : (
                      <button onClick={handleProcessImage} disabled={isScanning} className="px-10 py-5 rounded-[24px] gradient-fresh text-white font-bold flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                        {isScanning ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                        {isScanning ? "ANALYZING..." : "CONFIRM"}
                      </button>
                    )}
                    <div className="w-12" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Tab Bar */}
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: showNav ? 0 : 120 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="fixed bottom-10 left-6 right-6 z-40 flex justify-center"
            >
              <div className="relative w-full max-w-sm h-[64px] bg-white dark:bg-slate-900 rounded-full flex items-center justify-between px-10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800">
                
                {/* Inventory Tab */}
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="relative flex flex-col items-center justify-center py-2"
                >
                  <span className={cn(
                    "font-bold text-[15px] transition-colors",
                    activeTab === 'inventory' ? "text-[#00C88C]" : "text-[#94A3B8]"
                  )}>
                    Groceries
                  </span>
                  {activeTab === 'inventory' && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute -bottom-1"
                    >
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#00C88C]" />
                    </motion.div>
                  )}
                </button>

                {/* Main Plus Button */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsAddSheetOpen(true)}
                    className="w-20 h-20 bg-[#00C88C] rounded-full flex items-center justify-center text-white shadow-[0_8px_25px_rgba(0,200,140,0.3)]"
                  >
                    <Plus size={36} strokeWidth={3} />
                  </motion.button>
                </div>

                {/* Recipes Tab */}
                <button 
                  onClick={() => setActiveTab('recipes')}
                  className="relative flex flex-col items-center justify-center py-2"
                >
                  <span className={cn(
                    "font-bold text-[15px] transition-colors",
                    activeTab === 'recipes' ? "text-[#00C88C]" : "text-[#94A3B8]"
                  )}>
                    Recipes
                  </span>
                  {activeTab === 'recipes' && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute -bottom-1"
                    >
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#00C88C]" />
                    </motion.div>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Add Food Bottom Sheet */}
            <AnimatePresence>
              {isAddSheetOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsAddSheetOpen(false)}
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden shadow-2xl"
                  >
                    {/* Handle */}
                    <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-3 mb-6" />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 mb-8">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select an option</h3>
                      <button 
                        onClick={() => setIsAddSheetOpen(false)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Options */}
                    <div className="px-6 pb-12 space-y-4">
                      <button 
                        onClick={startCamera}
                        className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#E6F9F4] dark:bg-emerald-500/10 flex items-center justify-center text-[#00C88C]">
                          <Scan size={28} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-slate-900 dark:text-white">Scan items</p>
                          <p className="text-slate-500 dark:text-slate-400">Snap a photo of your groceries.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setIsAddSheetOpen(false); setManualAddStep('categories'); }}
                        className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                          <Apple size={28} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-slate-900 dark:text-white">Add manually</p>
                          <p className="text-slate-500 dark:text-slate-400">Search and select from our list.</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Recipe Detail Modal */}
            <AnimatePresence>
              {recipe && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 overflow-y-auto"
                >
                  {/* Hero Image */}
                  <div className="relative w-full h-[40vh]">
                    <img 
                      src={recipe.imageUrl || "https://picsum.photos/seed/food/800/600"} 
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => setRecipe(null)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-900 dark:text-white shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-8 py-10 -mt-8 relative z-10 bg-white dark:bg-slate-950 rounded-t-[32px]">
                    <div className="flex items-center gap-3 text-[#00C88C] mb-4">
                      <Utensils size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                      {recipe.title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                      {recipe.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex gap-8 mb-12">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-[#00C88C]">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Time</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{recipe.prepTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-[#00C88C]">
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Difficulty</p>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{recipe.difficulty}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <ClipboardList className="text-[#00C88C]" size={24} />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingredients</h3>
                      </div>
                      <ul className="space-y-4">
                        {recipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Steps */}
                    <div className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <ListChecks className="text-[#00C88C]" size={24} />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Step by step</h3>
                      </div>
                      <div className="space-y-8">
                        {recipe.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <span className="font-bold text-[#00C88C] text-lg">{idx + 1}.</span>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleGetRecipe}
                      disabled={isRecipeLoading}
                      className="w-full py-5 bg-[#00C88C] text-white font-bold rounded-[24px] shadow-xl shadow-[#00C88C]/20 flex items-center justify-center gap-3 mb-10"
                    >
                      {isRecipeLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={24} />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Try another recipe</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {manualAddStep === 'categories' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[80] bg-white dark:bg-slate-950 flex flex-col p-8"
                >
                  <div className="flex justify-between items-center mb-12">
                    <button onClick={() => setManualAddStep(null)} className="p-3 rounded-2xl text-slate-600 dark:text-slate-400">
                      <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <button onClick={() => { setManualAddStep(null); setIsAddSheetOpen(false); }} className="p-3 rounded-2xl text-slate-600 dark:text-slate-400">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Browse by category</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Select a group by food type</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pb-8 px-2">
                    {FOOD_CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat); setSelectedItems([]); setManualAddStep('items'); }}
                        className="w-full flex items-center justify-between p-4 rounded-[24px] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-[20px] bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm overflow-hidden p-2">
                            {categoryIcons[cat.id] ? (
                              <img src={categoryIcons[cat.id]} alt={cat.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-2xl">{cat.icon}</span>
                            )}
                          </div>
                          <span className="font-bold text-xl text-slate-900 dark:text-white">{cat.name}</span>
                        </div>
                        <ChevronRight className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" size={20} />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {manualAddStep === 'items' && selectedCategory && (
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="fixed inset-0 z-[80] bg-white dark:bg-slate-950 flex flex-col p-8"
                >
                  <div className="flex justify-between items-center mb-12">
                    <button onClick={() => setManualAddStep('categories')} className="p-3 rounded-2xl text-slate-600 dark:text-slate-400">
                      <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCategory.name}</h2>
                    <button onClick={() => { setManualAddStep(null); setIsAddSheetOpen(false); }} className="p-3 rounded-2xl text-slate-600 dark:text-slate-400">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pb-32">
                    <div className="grid grid-cols-2 gap-6">
                      {selectedCategory.items.map(food => {
                        const isSelected = selectedItems.some(i => i.name === food.name);
                        return (
                          <button 
                            key={food.name}
                            onClick={() => toggleItemSelection(food)}
                            className={cn(
                              "relative flex flex-col items-center p-6 rounded-[32px] transition-all duration-300 border-2",
                              isSelected 
                                ? "bg-white dark:bg-slate-900 border-[#00C88C] shadow-lg shadow-[#00C88C]/10" 
                                : "bg-slate-50/50 dark:bg-slate-900/50 border-transparent"
                            )}
                          >
                            {isSelected && (
                              <div className="absolute top-4 right-4 w-6 h-6 bg-[#00C88C] rounded-full flex items-center justify-center text-white">
                                <CheckCircle2 size={14} strokeWidth={3} />
                              </div>
                            )}
                            <div className="w-24 h-24 flex items-center justify-center mb-4">
                              {itemIcons[food.name] ? (
                                <img src={itemIcons[food.name]} alt={food.name} className="w-full h-full object-contain" />
                              ) : categoryIcons[selectedCategory.id] ? (
                                <img src={categoryIcons[selectedCategory.id]} alt={selectedCategory.name} className="w-full h-full object-contain opacity-20" />
                              ) : (
                                <span className="text-4xl">{selectedCategory.icon}</span>
                              )}
                            </div>
                            <span className="font-bold text-lg text-slate-900 dark:text-white mb-2">{food.name}</span>
                            <div className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 shadow-sm">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{food.shelfLife} days</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="fixed bottom-10 left-8 right-8 z-[90]">
                      <motion.button
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleManualAdd}
                        className="w-full py-5 bg-[#00C88C] text-white font-bold text-xl rounded-[24px] shadow-2xl shadow-[#00C88C]/30"
                      >
                        Add item ({selectedItems.length})
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}

              {manualAddStep === 'congrats' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] bg-emerald-500 flex flex-col items-center justify-center p-8 text-white text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-emerald-500 mb-8 shadow-2xl"
                  >
                    <CheckCircle2 size={64} />
                  </motion.div>
                  <h2 className="text-4xl font-bold tracking-tight mb-4">Excellent!</h2>
                  <p className="text-emerald-50 text-lg mb-12">Your food has been successfully registered.</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setManualAddStep(null); setActiveTab('inventory'); }}
                    className="px-12 py-5 bg-white text-emerald-600 font-bold rounded-[24px] shadow-xl"
                  >
                    View Inventory
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}



