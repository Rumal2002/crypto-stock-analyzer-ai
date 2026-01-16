import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import Chart from 'react-apexcharts'
import { 
  Search, TrendingUp, TrendingDown, Activity, 
  Calendar, DollarSign, BarChart3, Zap, ArrowRight,
  Layers, Download, Clock, Sparkles, Globe, ChevronRight,
  Eye, Shield, Cpu, Newspaper, ExternalLink, RefreshCw,
  Bitcoin, Landmark, CircleDollarSign, ArrowUpRight, ArrowDownRight,
  Flame, Star, TrendingUp as TrendUp, Radio, Wifi, WifiOff
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) { return twMerge(clsx(inputs)) }

const API_BASE = 'http://127.0.0.1:8000'

const POPULAR_ASSETS = [
  { name: 'Bitcoin', symbol: 'BTC-USD', short: 'BTC', color: 'from-orange-500 to-yellow-500', icon: '₿' },
  { name: 'Ethereum', symbol: 'ETH-USD', short: 'ETH', color: 'from-blue-500 to-purple-500', icon: 'Ξ' },
  { name: 'Gold', symbol: 'GC=F', short: 'GOLD', color: 'from-yellow-500 to-amber-600', icon: '◈' },
  { name: 'Apple', symbol: 'AAPL', short: 'AAPL', color: 'from-gray-400 to-gray-600', icon: '' },
  { name: 'Tesla', symbol: 'TSLA', short: 'TSLA', color: 'from-red-500 to-rose-600', icon: '⚡' },
  { name: 'S&P 500', symbol: '^GSPC', short: 'SPX', color: 'from-green-500 to-emerald-600', icon: '📈' },
]

const NEWS_CATEGORIES = [
  { id: 'all', name: 'All News', icon: Globe, color: 'from-blue-500 to-purple-500' },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, color: 'from-orange-500 to-yellow-500' },
  { id: 'stocks', name: 'Stocks', icon: Landmark, color: 'from-green-500 to-emerald-500' },
  { id: 'gold', name: 'Gold', icon: CircleDollarSign, color: 'from-yellow-500 to-amber-500' },
]

// ============ LIVE CLOCK COMPONENT ============
function LiveClock() {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Time Display */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
        <div className="relative">
          <Clock size={20} className="text-blue-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-mono font-bold tracking-wider bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            {formatTime(time)}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Live Time</span>
        </div>
      </div>

      {/* Date Display */}
      <div className="hidden md:flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl">
        <Calendar size={18} className="text-purple-400" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{formatDate(time)}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Trading Day</span>
        </div>
      </div>
    </div>
  )
}

// ============ BACKGROUND ORBS ============
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
    </div>
  )
}

// ============ CONNECTION STATUS ============
function ConnectionStatus({ isConnected }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
      isConnected 
        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
        : "bg-red-500/10 border border-red-500/30 text-red-400"
    )}>
      {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      {isConnected ? 'Live' : 'Offline'}
    </div>
  )
}

// ============ NEWS CARD COMPONENT ============
function NewsCard({ news, index }) {
  const getCategoryColor = (category) => {
    switch(category) {
      case 'crypto': return 'from-orange-500 to-yellow-500'
      case 'stocks': return 'from-green-500 to-emerald-500'
      case 'gold': return 'from-yellow-500 to-amber-500'
      default: return 'from-blue-500 to-purple-500'
    }
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'crypto': return Bitcoin
      case 'stocks': return Landmark
      case 'gold': return CircleDollarSign
      default: return Globe
    }
  }

  const Icon = getCategoryIcon(news.category)

  return (
    <motion.a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group block bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {news.image ? (
          <img 
            src={news.image} 
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper size={48} className="text-slate-700" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div className={cn(
          "absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r text-white",
          getCategoryColor(news.category)
        )}>
          <Icon size={12} />
          {news.category.toUpperCase()}
        </div>

        {/* Source */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <Radio size={12} className="text-white" />
          </div>
          <span className="text-xs text-white/80 font-medium">{news.source}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
          {news.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {news.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{news.published}</span>
          <span className="flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300">
            Read more <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </motion.a>
  )
}

// ============ NEWS SECTION COMPONENT ============
function NewsSection() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchNews = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE}/news`, { category })
      if (response.data.success) {
        setNews(response.data.news)
        setLastUpdated(response.data.last_updated)
      } else {
        setError(response.data.error || 'Failed to fetch news')
      }
    } catch (err) {
      setError('Failed to connect to news server')
    }
    setLoading(false)
    setIsRefreshing(false)
  }, [category])

  useEffect(() => {
    fetchNews()
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchNews(true), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchNews])

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Newspaper size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Live Market News
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
            </h2>
            <p className="text-sm text-slate-500">
              {lastUpdated ? `Last updated: ${lastUpdated}` : 'Real-time updates from trusted sources'}
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <motion.button
          onClick={() => fetchNews(true)}
          disabled={isRefreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={cn("text-blue-400", isRefreshing && "animate-spin")} />
          <span className="text-sm font-medium">Refresh</span>
        </motion.button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {NEWS_CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap",
              category === cat.id
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
            )}
          >
            <cat.icon size={16} />
            {cat.name}
          </motion.button>
        ))}
      </div>

      {/* Loading State */}
      {loading && !isRefreshing && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Newspaper className="absolute inset-0 m-auto w-6 h-6 text-blue-400" />
            </div>
            <p className="text-slate-400">Loading news...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <button 
            onClick={() => fetchNews()}
            className="mt-3 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* News Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {news.map((item, index) => (
            <NewsCard key={index} news={item} index={index} />
          ))}
        </div>
      )}

      {/* No News */}
      {!loading && !error && news.length === 0 && (
        <div className="text-center py-20">
          <Newspaper size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500">No news available for this category</p>
        </div>
      )}
    </div>
  )
}

// ============ TRENDING COINS COMPONENT ============
function TrendingCoins() {
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axios.get(`${API_BASE}/trending`)
        if (response.data.success) {
          setTrending(response.data.trending)
        }
      } catch (err) {
        console.error('Trending fetch error:', err)
      }
      setLoading(false)
    }
    fetchTrending()
    const interval = setInterval(fetchTrending, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  if (loading || trending.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={20} className="text-orange-500" />
        <h3 className="font-bold text-white">Trending Coins</h3>
        <span className="text-xs text-slate-500">(24h)</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {trending.map((coin, index) => (
          <motion.div
            key={coin.symbol}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 min-w-[180px]"
          >
            <img src={coin.thumb} alt={coin.name} className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-white text-sm">{coin.symbol}</p>
              <p className="text-xs text-slate-500">#{coin.market_cap_rank}</p>
            </div>
            <Star size={14} className="text-yellow-500 ml-auto" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============ MARKET OVERVIEW COMPONENT ============
function MarketOverview() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/market-overview`)
        if (response.data.success) {
          setData(response.data)
        }
      } catch (err) {
        console.error('Market overview error:', err)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return null

  const formatNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    return `$${num.toLocaleString()}`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-xs text-slate-500 mb-1">Total Market Cap</p>
        <p className="text-lg font-bold text-white">{formatNumber(data.total_market_cap)}</p>
        <p className={cn(
          "text-xs flex items-center gap-1",
          data.market_cap_change_24h >= 0 ? "text-green-400" : "text-red-400"
        )}>
          {data.market_cap_change_24h >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(data.market_cap_change_24h).toFixed(2)}%
        </p>
      </div>
      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-xs text-slate-500 mb-1">24h Volume</p>
        <p className="text-lg font-bold text-white">{formatNumber(data.total_volume)}</p>
      </div>
      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
        <p className="text-xs text-orange-400 mb-1">BTC Dominance</p>
        <p className="text-lg font-bold text-white">{data.btc_dominance.toFixed(1)}%</p>
      </div>
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-400 mb-1">ETH Dominance</p>
        <p className="text-lg font-bold text-white">{data.eth_dominance.toFixed(1)}%</p>
      </div>
    </div>
  )
}

// ============ MAIN APP COMPONENT ============
function App() {
  const [symbol, setSymbol] = useState('BTC-USD')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [isConnected, setIsConnected] = useState(true)
  const [activeTab, setActiveTab] = useState('analysis') // 'analysis' or 'news'

  const handlePredict = async (selectedSymbol = symbol) => {
    setLoading(true)
    setError('')
    setResult(null)
    setSelectedAsset(POPULAR_ASSETS.find(a => a.symbol === selectedSymbol) || null)

    try {
      const response = await axios.post(`${API_BASE}/predict`, { symbol: selectedSymbol })
      if (response.data.error) setError(response.data.error)
      else setResult(response.data)
      setIsConnected(true)
    } catch (err) { 
      setError("Backend Offline") 
      setIsConnected(false)
    }
    setLoading(false)
  }

  const exportData = () => {
    if (!result) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Price\n" 
      + result.forecast_7_days.map(e => `${e.date},${e.price}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${result.symbol}_prediction.csv`);
    document.body.appendChild(link);
    link.click();
  }

  const chartOptions = {
    chart: { 
      type: 'candlestick', 
      toolbar: { show: false }, 
      background: 'transparent', 
      fontFamily: 'inherit',
      animations: { enabled: true, easing: 'easeinout', speed: 800 }
    },
    theme: { mode: 'dark' },
    stroke: { width: [1, 2, 2], curve: 'smooth' },
    grid: { borderColor: 'rgba(255,255,255,0.03)', strokeDashArray: 4 },
    xaxis: { 
      type: 'datetime', 
      labels: { style: { colors: '#475569', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { 
      labels: { style: { colors: '#475569' }, formatter: (val) => '$' + val.toFixed(0) },
      opposite: true
    },
    plotOptions: { 
      candlestick: { 
        colors: { upward: '#10b981', downward: '#ef4444' },
        wick: { useFillColor: true }
      } 
    },
    legend: { show: true, position: 'top', horizontalAlign: 'left', labels: { colors: '#94a3b8' } },
    colors: ['#2E93fA', '#ff9800', '#00e396'],
    tooltip: { theme: 'dark', style: { fontSize: '12px' } }
  }

  const getSeries = () => {
    if (!result) return []
    return [
      { name: 'Price', type: 'candlestick', data: result.chart_data.candles },
      { name: 'SMA 50', type: 'line', data: result.chart_data.sma },
      { name: 'EMA 20', type: 'line', data: result.chart_data.ema }
    ]
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans relative overflow-hidden">
      <BackgroundOrbs />
      
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4"
          >
            <LiveClock />
            <div className="flex items-center gap-3">
              <ConnectionStatus isConnected={isConnected} />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs">
                <Cpu size={12} className="text-purple-400" />
                <span className="text-slate-400">AI Powered</span>
              </div>
            </div>
          </motion.div>

          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">Trade</span>
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Mind</span>
                  <span className="text-slate-600 font-light ml-2 text-2xl">PRO</span>
                </h1>
                <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  AI-Powered Analytics with Live News
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter symbol (e.g., BTC-USD)"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500/50 transition-all text-lg font-medium"
                />
              </div>
              <motion.button 
                onClick={() => handlePredict(symbol)} 
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Analyze <ChevronRight size={20} /></>}
              </motion.button>
            </div>
          </motion.header>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('analysis')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                activeTab === 'analysis' 
                  ? "bg-blue-600 text-white" 
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <BarChart3 size={18} />
              AI Analysis
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                activeTab === 'news' 
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" 
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Newspaper size={18} />
              Live News
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
          </div>

          {/* Quick Assets */}
          {activeTab === 'analysis' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {POPULAR_ASSETS.map((asset, index) => (
                <motion.button 
                  key={asset.symbol} 
                  onClick={() => { setSymbol(asset.symbol); handlePredict(asset.symbol); }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all min-w-[160px]",
                    selectedAsset?.symbol === asset.symbol ? "bg-white/10 border-white/20" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08]"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg font-bold", asset.color)}>
                    {asset.icon || asset.short[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">{asset.short}</p>
                    <p className="text-xs text-slate-500">{asset.name}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Content Based on Tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'analysis' ? (
              <motion.div key="analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                
                {/* Error */}
                {error && (
                  <div className="mb-6 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-4">
                    <Zap size={24} className="text-red-400" />
                    <div>
                      <p className="font-bold text-red-400">{error}</p>
                      <p className="text-sm text-slate-500">Please check your connection</p>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                      <Cpu className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                    <p className="text-xl font-bold">Analyzing {symbol}</p>
                  </div>
                )}

                {/* Results */}
                {result && !loading && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Signal Card */}
                    <div className={cn(
                      "lg:col-span-4 p-8 rounded-3xl border relative overflow-hidden min-h-[300px] flex flex-col justify-between",
                      result.signal_color === 'green' ? "bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border-emerald-500/30" :
                      result.signal_color === 'red' ? "bg-gradient-to-br from-rose-500/20 to-rose-900/20 border-rose-500/30" : 
                      "bg-gradient-to-br from-slate-500/20 to-slate-900/20 border-slate-500/30"
                    )}>
                      <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-30", result.signal_color === 'green' ? "bg-emerald-500" : result.signal_color === 'red' ? "bg-rose-500" : "bg-slate-500")} />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          {result.signal_color === 'green' ? <TrendingUp size={24} className="text-emerald-400" /> : <TrendingDown size={24} className="text-rose-400" />}
                          <span className="text-sm text-slate-400 uppercase">AI Signal</span>
                        </div>
                        <h2 className="text-6xl font-black">{result.signal.split(" ")[0]}</h2>
                        <p className={cn("text-2xl font-bold mt-3", result.signal_color === 'green' ? "text-emerald-400" : "text-rose-400")}>
                          {result.signal.split(" ").slice(1).join(" ")}
                        </p>
                      </div>
                    </div>

                    {/* Vitals */}
                    <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Current Price", val: `$${result.current_price.toLocaleString()}`, icon: DollarSign, bg: "bg-white/5" },
                        { label: "24h Volume", val: (result.volume / 1000000).toFixed(2) + "M", icon: Layers, bg: "bg-blue-500/5" },
                        { label: "Volatility", val: result.volatility + "%", icon: Zap, bg: result.volatility > 2 ? "bg-red-500/5" : "bg-green-500/5" },
                        { label: "Day Range", val: `$${result.day_low} - $${result.day_high}`, icon: Activity, bg: "bg-purple-500/5" },
                      ].map((item, i) => (
                        <div key={i} className={cn("p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[140px]", item.bg)}>
                          <item.icon size={20} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase">{item.label}</p>
                            <p className="text-xl font-bold font-mono mt-1">{item.val}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart */}
                    <div className="lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-3xl p-6 min-h-[480px]">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <BarChart3 size={20} className="text-blue-400" />
                          <h3 className="font-bold">Technical Analysis</h3>
                        </div>
                      </div>
                      <Chart options={chartOptions} series={getSeries()} type="candlestick" height={380} />
                    </div>

                    {/* Forecast */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex-1">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="font-bold flex items-center gap-2"><Calendar size={18} className="text-cyan-400" /> 7-Day Forecast</h3>
                          <button onClick={exportData} className="p-2 hover:bg-white/10 rounded-xl"><Download size={16} /></button>
                        </div>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                          {result.forecast_7_days.map((day, i) => (
                            <div key={i} className="flex justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                              <span className="text-slate-400">{day.date}</span>
                              <span className="font-mono font-bold">${day.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles size={18} className="text-blue-400" />
                          <span className="text-xs font-bold text-blue-300 uppercase">AI Insight</span>
                        </div>
                        <p className="text-sm text-slate-300">
                          {result.symbol} shows {result.signal_color === 'green' ? 'bullish' : 'bearish'} momentum with RSI at {result.rsi}. 
                          Volatility is {result.volatility > 2 ? 'elevated' : 'stable'}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!result && !loading && !error && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-white/10">
                      <BarChart3 size={40} className="text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Ready to Analyze</h2>
                    <p className="text-slate-500">Select an asset or enter a symbol to get started</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="news" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <MarketOverview />
                <TrendingCoins />
                <NewsSection />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  )
}

export default App