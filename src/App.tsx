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
  Refrigerator
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Markdown from 'react-markdown';
import { useInventory } from './hooks/useInventory';
import { get, set } from 'idb-keyval';
import { analyzeFoodImage, generateRecipe, FoodItem, generateIndividualIcon, generateOnboardingImage } from './services/geminiService';
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
    <div className="fixed inset-0 bg-white flex flex-col p-8">
      <div className="flex-1 flex flex-col items-center justify-between py-12 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center"
          >
            <h2 className="text-[28px] font-bold leading-tight text-slate-900 mb-12 whitespace-pre-line">
              {steps[step].title}
            </h2>

            <div className="relative w-full aspect-square flex items-center justify-center mb-12">
              <div className="absolute inset-0 bg-white rounded-full scale-90" />
              {loadingImages[step] ? (
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-medium animate-pulse">Generando ilustración 3D...</p>
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

            <p className="text-slate-500 text-lg leading-relaxed px-4">
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
                className="h-2 rounded-full"
              />
            ))}
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => step < 2 ? setStep(step + 1) : onFinish()}
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
  { id: 'granos', name: 'Granos', icon: '🌾', items: [
    { name: 'Arroz', shelfLife: 365 },
    { name: 'Lentejas', shelfLife: 365 },
    { name: 'Frijoles', shelfLife: 365 },
    { name: 'Pasta', shelfLife: 365 },
    { name: 'Avena', shelfLife: 180 },
  ]},
  { id: 'verduras', name: 'Verduras', icon: '🥦', items: [
    { name: 'Espinacas', shelfLife: 5 },
    { name: 'Tomates', shelfLife: 7 },
    { name: 'Zanahorias', shelfLife: 21 },
    { name: 'Brócoli', shelfLife: 7 },
    { name: 'Cebollas', shelfLife: 30 },
  ]},
  { id: 'frutas', name: 'Frutas', icon: '🍎', items: [
    { name: 'Manzanas', shelfLife: 14 },
    { name: 'Plátanos', shelfLife: 5 },
    { name: 'Fresas', shelfLife: 3 },
    { name: 'Naranjas', shelfLife: 14 },
    { name: 'Uvas', shelfLife: 7 },
  ]},
  { id: 'lacteos', name: 'Lácteos', icon: '🥛', items: [
    { name: 'Leche', shelfLife: 7 },
    { name: 'Yogur', shelfLife: 14 },
    { name: 'Queso', shelfLife: 21 },
    { name: 'Mantequilla', shelfLife: 60 },
    { name: 'Huevo', shelfLife: 30 },
  ]},
  { id: 'proteinas', name: 'Proteínas', icon: '🍗', items: [
    { name: 'Pollo', shelfLife: 3 },
    { name: 'Carne de Res', shelfLife: 3 },
    { name: 'Pescado', shelfLife: 2 },
    { name: 'Cerdo', shelfLife: 3 },
    { name: 'Tofu', shelfLife: 7 },
  ]},
];

const CATEGORY_MAP: Record<string, string> = {
  'granos': 'granos',
  'verduras': 'verduras',
  'frutas': 'frutas',
  'lácteos': 'lacteos',
  'lacteos': 'lacteos',
  'proteínas': 'proteinas',
  'proteinas': 'proteinas',
  'dairy': 'lacteos',
  'meat': 'proteinas',
  'vegetables': 'verduras',
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
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes'>('inventory');
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [filter, setFilter] = useState<'All' | 'Urgent' | 'Soon' | 'Fresh'>('All');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});

  // New states for Add Food flow
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [manualAddStep, setManualAddStep] = useState<'categories' | 'items' | 'congrats' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof FOOD_CATEGORIES[0] | null>(null);
  
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
        { id: 'granos', name: 'un tazón de arroz', cat: 'Granos' },
        { id: 'verduras', name: 'un brócoli fresco', cat: 'Verduras' },
        { id: 'frutas', name: 'una manzana roja', cat: 'Frutas' },
        { id: 'lacteos', name: 'una botella de leche', cat: 'Lácteos' },
        { id: 'proteinas', name: 'un filete de carne', cat: 'Proteínas' }
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
      if (view !== 'app' || activeTab !== 'inventory' || filteredItems.length === 0) return;
      if (e.key === 'ArrowRight') {
        setCarouselIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowLeft') {
        setCarouselIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, activeTab, filteredItems.length]);

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
      alert("No se pudo acceder a la cámara.");
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
      alert("Error al procesar la imagen con IA.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualAdd = async (food: { name: string, shelfLife: number }) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + food.shelfLife);
    
    await addItem({
      name: food.name,
      category: selectedCategory?.name || 'Otros',
      expiry_date: expiryDate.toISOString(),
      status: food.shelfLife > 3 ? 'fresh' : 'warning',
    });

    setManualAddStep('congrats');
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
                    <Refrigerator size={24} className="text-white" />
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
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
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
                          <div className="relative w-64 h-64 mb-8">
                            <img 
                              src="https://ais-dev-xioxq5m6s3qdhcuvkvyzvk-32607018528.us-west2.run.app/input_file_0.png" 
                              alt="Empty Fridge"
                              className="w-full h-full object-contain opacity-40 grayscale"
                              referrerPolicy="no-referrer"
                            />
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
                                <div className="relative w-full aspect-square max-h-[320px] flex items-center justify-center mb-8">
                                  <AnimatePresence mode="wait">
                                    <motion.div
                                      key={currentItem.id}
                                      initial={{ opacity: 0, scale: 0.8, x: 100 }}
                                      animate={{ opacity: 1, scale: 1.1, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.8, x: -100 }}
                                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                      drag="x"
                                      dragConstraints={{ left: 0, right: 0 }}
                                      onDragEnd={(_, info) => {
                                        if (info.offset.x < -50) {
                                          setCarouselIndex(prev => (prev + 1) % filteredItems.length);
                                        } else if (info.offset.x > 50) {
                                          setCarouselIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                                        }
                                      }}
                                      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                                    >
                                      <div className="relative w-full h-full flex items-center justify-center">
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
                                              <Refrigerator size={120} className="text-slate-200" />
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
                                          title="Marcar como usado"
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
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 gradient-attention rounded-2xl text-white shadow-lg shadow-amber-500/20">
                        <ChefHat size={28} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Recetas Inteligentes</h2>
                        <p className="text-sm text-slate-500">Basadas en lo que vence pronto</p>
                      </div>
                    </div>

                    {!recipe && !isRecipeLoading ? (
                      <div className="glass-card p-10 rounded-[40px] text-center">
                        <ChefHat size={48} className="mx-auto mb-6 text-amber-400 opacity-50" />
                        <h3 className="font-bold text-lg mb-2">¿Qué cocinamos hoy?</h3>
                        <p className="text-sm text-slate-500 mb-8">La IA analizará tus ingredientes en "Zona Roja" para sugerirte algo delicioso.</p>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleGetRecipe}
                          className="px-8 py-4 rounded-2xl gradient-fresh text-white font-bold shadow-lg shadow-emerald-500/20"
                        >
                          Generar Receta
                        </motion.button>
                      </div>
                    ) : isRecipeLoading ? (
                      <div className="glass-card p-16 rounded-[40px] flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mb-6 text-emerald-500" size={40} />
                        <p className="font-bold">Creando tu receta personalizada...</p>
                        <p className="text-sm mt-1">Analizando ingredientes críticos</p>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 rounded-[40px] shadow-2xl"
                      >
                        <div className="prose dark:prose-invert max-w-none prose-headings:tracking-tight prose-headings:font-bold">
                          <Markdown>{recipe!}</Markdown>
                        </div>
                        <button 
                          onClick={handleGetRecipe}
                          className="mt-8 w-full py-4 rounded-2xl border-2 border-emerald-500/20 text-emerald-500 font-bold hover:bg-emerald-500/5 transition-colors"
                        >
                          Probar otra receta
                        </button>
                      </motion.div>
                    )}
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
                        {isScanning ? "ANALIZANDO..." : "CONFIRMAR"}
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
              <div className="relative w-full max-w-sm h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-between px-10 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800">
                
                {/* Inventory Tab */}
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="relative flex flex-col items-center justify-center py-2"
                >
                  <span className={cn(
                    "font-bold text-[15px] transition-colors",
                    activeTab === 'inventory' ? "text-[#00C88C]" : "text-[#94A3B8]"
                  )}>
                    Fridge
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
                <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsAddSheetOpen(true)}
                    className="w-20 h-20 bg-[#00C88C] rounded-full flex items-center justify-center text-white shadow-[0_8px_25px_rgba(0,200,140,0.3)] border-4 border-white dark:border-slate-900"
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
                    className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-[40px] p-8 pb-12 shadow-2xl"
                  >
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8" />
                    <h3 className="text-2xl font-bold tracking-tight mb-8 text-center">¿Cómo quieres añadirlo?</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={startCamera}
                        className="flex items-center gap-6 p-6 rounded-3xl glass-card bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 hover:scale-[1.02] transition-transform"
                      >
                        <div className="w-14 h-14 rounded-2xl gradient-fresh flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                          <Camera size={28} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">Escaneo Inteligente</p>
                          <p className="text-sm text-slate-500">Usa la IA para identificar tu comida</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => { setIsAddSheetOpen(false); setManualAddStep('categories'); }}
                        className="flex items-center gap-6 p-6 rounded-3xl glass-card bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:scale-[1.02] transition-transform"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                          <Plus size={28} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">Registro Manual</p>
                          <p className="text-sm text-slate-500">Selecciona de nuestra lista</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Manual Add Flow Modals */}
            <AnimatePresence>
              {manualAddStep === 'categories' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[80] bg-white dark:bg-slate-950 flex flex-col p-8"
                >
                  <div className="flex justify-between items-center mb-12">
                    <button onClick={() => setManualAddStep(null)} className="p-3 rounded-2xl glass-card"><X size={24} /></button>
                    <h2 className="text-xl font-bold tracking-tight">Categorías</h2>
                    <div className="w-12" />
                  </div>
                  <p className="text-slate-500 mb-8 text-center">Selecciona el grupo de alimentos</p>
                  <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-8">
                    {FOOD_CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat); setManualAddStep('items'); }}
                        className="flex items-center justify-between p-6 rounded-3xl glass-card bg-white dark:bg-slate-900 hover:scale-[1.02] transition-transform"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            {categoryIcons[cat.id] ? (
                              <img src={categoryIcons[cat.id]} alt={cat.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">{cat.icon}</span>
                            )}
                          </div>
                          <span className="font-bold text-lg">{cat.name}</span>
                        </div>
                        <ChevronRight className="text-slate-300" />
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
                    <button onClick={() => setManualAddStep('categories')} className="p-3 rounded-2xl glass-card"><ChevronRight className="rotate-180" size={24} /></button>
                    <h2 className="text-xl font-bold tracking-tight">{selectedCategory.name}</h2>
                    <div className="w-12" />
                  </div>
                  <p className="text-slate-500 mb-8 text-center">¿Qué alimento quieres agregar?</p>
                  <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-8">
                    {selectedCategory.items.map(food => (
                      <button 
                        key={food.name}
                        onClick={() => handleManualAdd(food)}
                        className="flex flex-col items-center justify-center p-6 rounded-3xl glass-card bg-white dark:bg-slate-900 hover:scale-[1.05] transition-transform text-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl mb-3 overflow-hidden">
                          {categoryIcons[selectedCategory.id] ? (
                            <img src={categoryIcons[selectedCategory.id]} alt={selectedCategory.name} className="w-full h-full object-cover" />
                          ) : (
                            selectedCategory.icon
                          )}
                        </div>
                        <span className="font-bold text-sm">{food.name}</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-mono uppercase">Vence en {food.shelfLife}d</span>
                      </button>
                    ))}
                  </div>
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
                  <h2 className="text-4xl font-bold tracking-tight mb-4">¡Excelente!</h2>
                  <p className="text-emerald-50 text-lg mb-12">Tu alimento ha sido registrado con éxito.</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setManualAddStep(null); setActiveTab('inventory'); }}
                    className="px-12 py-5 bg-white text-emerald-600 font-bold rounded-[24px] shadow-xl"
                  >
                    Ver Inventario
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



