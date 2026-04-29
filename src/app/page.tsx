"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  imageUrl: string;
  isVisible?: boolean;
  isTrending?: boolean;
}

interface Category {
  id: string;
  title: string;
  imageUrl: string;
  gradient: string;
  products: Product[];
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashOpacity, setSplashOpacity] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [trendingProduct, setTrendingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Splash screen animation
    const fadeOutTimer = setTimeout(() => {
      setSplashOpacity(0);
      const hideTimer = setTimeout(() => {
        setShowSplash(false);
      }, 600);
      return () => clearTimeout(hideTimer);
    }, 1500);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  useEffect(() => {
    // Fetch data from Firestore
    async function fetchData() {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const prodSnap = await getDocs(collection(db, "products"));

        const fetchedProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const sortedProds = fetchedProds.map((p, i) => ({ ...p, order: typeof p.order === 'number' ? p.order : i })).sort((a, b) => a.order - b.order) as Product[];

        const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const sortedCats = fetchedCats.map((c, i) => {
          return {
            id: c.id,
            title: c.title || "Unnamed Category",
            imageUrl: c.imageUrl || "",
            gradient: c.gradient || "linear-gradient(90deg, rgba(115, 20, 35, 0.9) 0%, rgba(115, 20, 35, 0.65) 50%, rgba(0,0,0,0.3) 100%)",
            order: typeof c.order === 'number' ? c.order : i,
            isVisible: c.isVisible !== false,
            products: sortedProds.filter(p => (p as any).categoryId === c.id && p.isVisible !== false)
          };
        }).filter(c => c.isVisible).sort((a, b) => a.order - b.order);
        
        setCategories(sortedCats as Category[]);

        const trend = sortedProds.find(p => p.isTrending && p.isVisible !== false);
        setTrendingProduct(trend || null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching menu data", error);
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const toggleCategory = (id: string) => {
    if (openCategoryId === id) {
      setOpenCategoryId(null);
    } else {
      setOpenCategoryId(id);
    }
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    products: cat.products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(cat => cat.products.length > 0);

  return (
    <>
      {/* Splash Screen */}
      {showSplash && (
        <div id="splash-screen" style={{ opacity: splashOpacity }}>
          <img src="/logo.png" alt="Maroon's Logo" id="splash-logo" />
        </div>
      )}

      {/* Header */}
      <header>
        <img 
          src="/logo.png" 
          alt="Maroon's Logo" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        />
      </header>

      <main>
        {trendingProduct && (
          <div style={{ marginBottom: '40px', padding: '0 20px' }}>
            <h1 className="section-title" style={{ marginTop: '10px', marginBottom: '20px' }}>
              En Çok Satan
            </h1>
            <div style={{ background: '#1a1a1a', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
              {trendingProduct.imageUrl ? (
                <img src={trendingProduct.imageUrl} alt={trendingProduct.name} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '250px', backgroundColor: '#333' }}></div>
              )}
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#fff' }}>{trendingProduct.name}</h3>
                <p style={{ color: '#aaa', margin: '0 0 15px 0', fontSize: '14px' }}>{trendingProduct.desc}</p>
                <div style={{ display: 'inline-block', background: '#731423', color: '#fff', padding: '10px 25px', borderRadius: '25px', fontSize: '18px', fontWeight: 'bold' }}>
                  {trendingProduct.price} ₺
                </div>
              </div>
            </div>
          </div>
        )}

        <h1 className="section-title">Menümüz</h1>
        
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <input 
            type="text" 
            placeholder="Tatlı veya içerik arayın..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Auto-open first category when searching
              if (e.target.value.length > 0 && filteredCategories.length > 0) {
                setOpenCategoryId(filteredCategories[0].id);
              }
            }}
            style={{ 
              width: '100%', 
              padding: '15px 20px', 
              borderRadius: '25px', 
              border: '1px solid #444', 
              background: '#1a1a1a', 
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
            }}
          />
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(115, 20, 35, 0.3)', 
              borderTopColor: '#731423', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        <div id="menu-container">
          {!isLoading && filteredCategories.length === 0 && searchQuery && (
            <div style={{ textAlign: 'center', color: '#aaa', marginTop: '20px' }}>
              Aramanıza uygun sonuç bulunamadı.
            </div>
          )}
          
          {filteredCategories.map((category) => (
            <div key={category.id} className="category-wrapper">
              <div className="category-banner" onClick={() => toggleCategory(category.id)}>
                {category.imageUrl ? (
                  <img src={category.imageUrl} className="category-bg" alt={category.title} />
                ) : (
                  <div className="category-bg" style={{ backgroundColor: '#2a2a2a' }}></div>
                )}
                <div className="category-overlay" style={{ background: category.gradient }}></div>
                <div className="category-banner-title">{category.title}</div>
              </div>

              {openCategoryId === category.id && (
                <div className="products-container" style={{ display: 'block' }}>
                  {category.products.map(product => {
                    const isExpanded = expandedProductId === product.id;
                    return (
                      <div 
                        key={product.id} 
                        className={`product-item ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} className="product-item-img" loading="lazy" alt={product.name} />
                        ) : (
                          <div className="product-item-img" style={{ backgroundColor: '#333' }}></div>
                        )}
                        <div className="product-item-info">
                          <div className="product-item-title">{product.name}</div>
                          <div className="product-item-desc">{product.desc}</div>
                          <div className="product-item-more">Daha fazlası için tıklayınız</div>
                        </div>
                        <div className="product-item-price">{product.price} ₺</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Button */}
      <div id="fab" onClick={() => setShowPopup(!showPopup)}>
        <img src="/minilogo.png" alt="Mini Logo" />
      </div>

      {/* Quick Menu Popup */}
      <div 
        id="quick-menu-overlay" 
        className={showPopup ? "active" : ""} 
        onClick={() => setShowPopup(false)}
      ></div>
      <div id="quick-menu" className={showPopup ? "active" : ""}>
        <div className="quick-menu-header">
          <h2>Bizi Takip Edin</h2>
          <button className="close-btn" onClick={() => setShowPopup(false)}>✕</button>
        </div>
        
        <a href="https://www.instagram.com/maroonsizmir/" target="_blank" rel="noreferrer" className="instagram-btn">
          <svg style={{ width: 24, height: 24, marginRight: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          @maroonsizmir
        </a>
      </div>
    </>
  );
}
