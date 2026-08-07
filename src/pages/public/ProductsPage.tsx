import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Input, Select, Tag, Button, Modal } from 'antd';
import { productService } from '../../services/api';
import { Product } from '../../types';
import { Search, Filter, ShoppingCart, CheckCircle, ShieldCheck, Tag as TagIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    productService.getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const brands = ['All', ...Array.from(new Set(products.map((p) => p.brand)))];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All' || prod.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 z-10 relative">
          <span className="px-3.5 py-1 rounded-full bg-blue-800/80 border border-blue-600 text-blue-300 text-xs font-bold uppercase tracking-wider inline-flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1 text-amber-400" />
            Asian Paints Authorized Dealer Stock
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Paint & Hardware Catalog
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Genuine Asian Paints emulsions, Berger, Nippon, Birla White wall putty & hardware items at authorized Kovilpatti rates.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <Input
              prefix={<Search className="w-4 h-4 text-slate-400 mr-2" />}
              placeholder="Search product name, Asian Paints SKU or barcode..."
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl"
              allowClear
            />
          </div>

          <div className="md:col-span-3">
            <Select
              className="w-full h-10"
              size="large"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map((c) => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
            />
          </div>

          <div className="md:col-span-3">
            <Select
              className="w-full h-10"
              size="large"
              value={selectedBrand}
              onChange={setSelectedBrand}
              options={brands.map((b) => ({ value: b, label: b === 'All' ? 'All Brands' : b }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <strong>{filteredProducts.length}</strong> Products</span>
          {(searchQuery || selectedCategory !== 'All' || selectedBrand !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedBrand('All');
              }}
              className="text-blue-600 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
          <TagIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold text-slate-700">No Products Found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search filters or browse other Asian Paints categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden relative bg-slate-100 p-4 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-amber-400 font-extrabold text-[10px] uppercase rounded-md">
                      {product.brand}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Tag color={product.status === 'In Stock' ? 'green' : product.status === 'Low Stock' ? 'orange' : 'red'}>
                      {product.status}
                    </Tag>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
                    {product.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-3">
                <div className="flex items-baseline justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">₹{product.sellingPrice}</span>
                    <span className="text-[10px] text-slate-400 block">/ {product.unit} (Incl. {product.gstRate}% GST)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveModalProduct(product)}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                  >
                    Details
                  </button>

                  <a
                    href={`https://wa.me/919488475040?text=Hi%20RJ%20Paints,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}%20(${product.unit}).%20Please%20send%20price%20quote.`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1 shadow-md shadow-blue-500/20"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Order</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <Modal
          open={!!activeModalProduct}
          onCancel={() => setActiveModalProduct(null)}
          footer={null}
          width={650}
          centered
        >
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-5 bg-slate-50 p-4 rounded-2xl flex items-center justify-center border border-slate-200">
                <img src={activeModalProduct.image} alt={activeModalProduct.name} className="max-h-56 object-contain" />
              </div>
              <div className="sm:col-span-7 space-y-3">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                  {activeModalProduct.brand} • Authorized Stock
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{activeModalProduct.name}</h3>
                <p className="text-xs text-slate-600">{activeModalProduct.description}</p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-700">
                  <div>SKU Code: <strong className="font-mono">{activeModalProduct.sku}</strong></div>
                  <div>Category: <strong>{activeModalProduct.category}</strong></div>
                  <div>Pack Unit: <strong>{activeModalProduct.unit}</strong></div>
                  <div>GST Slab: <strong>{activeModalProduct.gstRate}%</strong></div>
                  <div>Availability: <strong className="text-emerald-600">{activeModalProduct.stock} Units in Kovilpatti Store</strong></div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-900">₹{activeModalProduct.sellingPrice}</span>
                  <a
                    href={`https://wa.me/919488475040?text=Hi%20RJ%20Paints,%20I%20want%20to%20order%20${encodeURIComponent(activeModalProduct.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg flex items-center space-x-2"
                  >
                    <span>Order via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
