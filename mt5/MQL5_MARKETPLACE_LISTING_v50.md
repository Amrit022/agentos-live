# 👑 FOREX MASTER PRO EA v5.0 — INSTITUTIONAL ULTIMATE EDITION
### The Premier Multi-Strategy Algorithmic Engine for MetaTrader 5

**Forex Master Pro EA v5.0** is an institutional-grade, multi-strategy Expert Advisor engineered for professional MetaTrader 5 traders. Built on over 15 years of algorithmic trading expertise, Version 5.0 combines **12 Ensemble Strategies**, a **Broker Stealth Order Engine (`TPSLHidden`)**, an **Automated News Calendar & Keyword Filter**, **Dynamic Donchian Channel Take-Profit**, **Auto-GMT Offset Detection**, and **4 Pre-configured Broker Profiles** into one plug-and-play solution.

---

### ⚙️ WHY FOREX MASTER PRO v5.0 IS UNBEATABLE

1. **Zero High-Risk Strategies**: No martingale, no hedging, no grid averaging. Every trade uses strict, mathematical Stop Loss and Take Profit risk management.
2. **Broker Stealth Engine (`TPSLHidden`)**: Protect your capital from broker stop-hunting! When enabled, Stop Loss and Take Profit levels are hidden from the broker's order book. Positions are closed in local memory, while dynamic visual lines render on your chart.
3. **Automated Economic News & Keyword Filter**: Skips high-impact news releases (`FOMC`, `NFP`, `CPI`, `ECB`, `BOE`, `BOJ`, `FED`, `RATE`, `GDP`). Includes configurable pre/post news buffer minutes and emergency SL balance protection.
4. **Dynamic Channel Take-Profit**: Uses Donchian & Keltner adaptive channel logic (`ChannelBars` lookback) to dynamically stretch TP targets during high-volatility breakouts.
5. **Automated GMT Offset Engine (`AutoGMT`)**: Automatically detects server GMT offset (`TimeCurrent()` vs `TimeGMT()`) to align session filters anywhere in the world without manual calculation.
6. **4 Pre-configured Broker Profiles**: Includes 1-click set files for **VT Markets / IC Markets RAW (Medium & Low Risk)**, **RoboForex ECN**, and **Fusion Markets Zero Spread**.
7. **12 Ensemble Strategies Included**:
   - **Bank Research & Institutional Fund Flow Strategy**
   - **7-Indicator Confluence Engine** (EMA Ribbon, RSI, MACD, Bollinger Bands, Stochastic, Volume, ATR)
   - **Price Action Engine** (Bullish/Bearish Engulfing & Pin Bar Reversals)
   - **Multi-Timeframe Trend Confirmation** (M5 + H4 + Daily)
   - **ADX Trend Strength Filter** (Skips sideways/choppy markets)
   - **ATR Volatility Regime Filter**
8. **Auto-Resetting Account Circuit Breaker**: Account-wide drawdown protector closing trades if floating loss hits a safety limit (e.g. 5.0%), auto-resetting after a cooldown window.

---

### 📋 COMPLETE INPUT PARAMETERS GUIDE

#### 1. BROKER PRESET & PROFILE
- `PresetProfile`: Choose 1-click presets (`PRESET_CUSTOM`, `PRESET_VTM_IC_MEDIUM`, `PRESET_VTM_IC_LOW`, `PRESET_ROBOFOREX_ECN`, `PRESET_FUSION_ZERO`).
- `MagicNumber`: Unique EA identifier (`0` = Auto-generate unique ID per symbol/period).
- `TradeComment`: Custom order description string.
- `OrderFillingType`: Order execution filling type (`ORDER_FILLING_FOK`, `IOC`, `RETURN`).

#### 2. RISK & CAPITAL MANAGEMENT
- `RiskMode`: Select risk tier (`LOW = 0.5%`, `MEDIUM = 1.0%`, `HIGH = 2.0%`, or `CUSTOM`).
- `LotType`: Calculate lot by `% of Balance` or `Fixed Lot`.
- `RiskPercent`: Custom risk % per trade.
- `MaxOpenTrades`: Max simultaneous trades allowed.
- `MaxSpreadPoints`: Maximum allowed spread in points (e.g. 40 points = 4 pips).

#### 3. STOP LOSS, TAKE PROFIT & STEALTH ENGINE
- `ATR_Period`: ATR period for dynamic SL/TP calculation.
- `SL_ATR_Multiplier`: Stop Loss multiplier (ATR x).
- `RR_Ratio_TP1` / `RR_Ratio_TP2`: R:R targets for partial and final Take Profit.
- `TPSLHidden`: Set `true` to hide SL/TP from broker order book.
- `UseTrailingStop` & `TrailATRMultiple`: Trailing stop loss engine.
- `UseBreakEven` & `BE_ATR_Trigger`: Moves SL to entry once profit target is reached.

#### 4. DYNAMIC TAKE-PROFIT
- `UseDynamicTP`: Enable adaptive Donchian channel TP calculation.
- `ChannelBars`: Lookback bars for highest high / lowest low channel.
- `DynTP_Speed`: Dynamic TP adjustment speed.

#### 5. AUTOMATED NEWS CALENDAR & EVENT FILTER
- `UseNewsFilter`: Enable automated economic news filter.
- `doNotTradeBeforeMinutes` / `doNotTradeAfterMinutes`: Pause window before & after high-impact news.
- `FindKeywordList`: High-impact news keywords (`FOMC,CPI,NFP,ECB,BOE,BOJ,FED,RATE,GDP,PAYROLL`).
- `EmergencyNewsSL_Pct`: Auto emergency stop loss % during major news events.

#### 6. TIME, GMT & SESSION CONTROL
- `AutoGMT`: Automatically calculates broker GMT offset.
- `Trading24h`: Toggle 24-hour trading or set `StartHour`/`StopHour` session windows.
- `EnableDayClose` & `DayCloseTime`: Option to close all open positions at end of day (e.g. 23:45).

---

### 🧠 RECOMMENDED TRADING SETUP
- **Currency Pairs**: `XAUUSD` (Gold), `EURUSD`, `GBPUSD`, `USDJPY`
- **Timeframes**: M5, M15, M30
- **Min Deposit**: $100 ($500+ recommended)
- **Account Type**: ECN / Raw Spread with low latency VPS (under 20ms)
- **Broker Compatibility**: Fully compatible with all MetaTrader 5 brokers
