'use client';

import React, { useState, useEffect } from 'react';
import { getPortfolioItems } from '../api/api';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await getPortfolioItems();
        const portfolioData = Array.isArray(response.data)
          ? response.data
          : (response.data?.results || []);
        setPortfolio(portfolioData);
        const uniqueCategories = [...new Set(portfolioData.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        setPortfolio([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const filteredPortfolio = filter === 'all' ? portfolio : portfolio.filter(item => item.category === filter);

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Our Portfolio</h1>
          <p>Explore our collection of stunning websites and digital projects</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {categories.length > 0 && (
            <div className="flex gap-[15px] justify-center mb-10 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`py-[10px] px-[25px] border-2 rounded-[25px] font-medium transition-all duration-300 ${filter === 'all' ? 'bg-brand border-brand text-white' : 'border-[#e2e8f0] bg-white text-[#4a5568] hover:border-brand hover:text-brand'}`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`py-[10px] px-[25px] border-2 rounded-[25px] font-medium transition-all duration-300 ${filter === category ? 'bg-brand border-brand text-white' : 'border-[#e2e8f0] bg-white text-[#4a5568] hover:border-brand hover:text-brand'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading portfolio...</div>
          ) : filteredPortfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px] mt-[30px]">
              {filteredPortfolio.map((item) => (
                <div key={item.id} className="card overflow-hidden p-0 group">
                  <div className="w-full h-[250px] md:h-[200px] overflow-hidden relative bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8]">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#666] text-[1.1rem]">No Image</div>
                    )}
                    {item.featured && (
                      <span className="absolute top-[15px] right-[15px] bg-brand text-white py-[5px] px-[15px] rounded-[20px] text-[0.85rem] font-semibold">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="p-[25px]">
                    <h3 className="text-[1.3rem] mb-[10px] text-black">{item.title}</h3>
                    {item.category && (
                      <span className="inline-block bg-[#edf2f7] py-[5px] px-3 rounded-[15px] text-[0.85rem] text-[#4a5568] mb-[15px]">
                        {item.category}
                      </span>
                    )}
                    <p className="text-[#333] mb-5 leading-relaxed">{item.description}</p>
                    {item.website_url && (
                      <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">Portfolio items coming soon. Please check back later.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
