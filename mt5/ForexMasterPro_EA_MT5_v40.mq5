//+------------------------------------------------------------------+
//|                                    ForexMasterPro_EA_MT5.mq5     |
//|                   Forex Master Pro - Auto Trading EA v4.0        |
//|                                    Built for OctaFX MT5          |
//+------------------------------------------------------------------+
//
//  VERSION 4.0 (POWERHOUSE) UPGRADES:
//    1. Multi-Timeframe Filter (H4 + Daily trend confirmation)
//    2. Break-Even Stop (risk-free trades after 1x ATR profit)
//    3. Stochastic Oscillator (momentum & oversold/overbought reversals)
//    4. ADX Trend Strength Filter (avoids choppy/sideways markets)
//    5. Partial Take Profit (closes 50% at TP1, runs rest to TP2)
//    6. Smart Recovery (reduces lot size after consecutive losses)
//    7. Bar-Expiry Time Stop (auto-closes stagnant trades after 30 candles)
//    8. Auto-Resetting Circuit Breaker (auto-recovers after cooldown)
//    9. Candle Pattern Recognition (Engulfing + Pin Bar detection)
//   10. ATR Volatility Regime Filter (skips dead/chaotic markets)
//
//  HOW TO INSTALL:
//    1. Open MetaTrader 5 -> File -> Open Data Folder -> MQL5 -> Experts
//    2. Copy this .mq5 file into the Experts folder
//    3. Press F4 -> open this file -> press F7 to compile
//    4. Drag onto your chart -> enable Algo Trading
//
//  WARNING: ALWAYS test on DEMO account first!
//
//+------------------------------------------------------------------+
#property copyright "Forex Master Pro EA v4.0"
#property version   "4.0"
#property description "Powerhouse 7-indicator confluence auto-trader with 10 pro upgrades"

#include <Trade/Trade.mqh>
#include <Trade/PositionInfo.mqh>

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                  |
//+------------------------------------------------------------------+

// Risk Management
input group "====== RISK MANAGEMENT ======"
input double  RiskPercent        = 1.0;      // Risk % per trade (0.5-2% recommended)
input double  MaxLotSize         = 0.5;      // Maximum lot size cap (safety)
input double  MinLotSize         = 0.01;     // Minimum lot size
input int     MaxOpenTrades      = 1;        // Max simultaneous trades
input int     MaxSpreadPoints    = 50;       // Max spread in points (50 = 5 pips)

// SL/TP Settings
input group "====== STOP LOSS / TAKE PROFIT ======"
input int     ATR_Period         = 14;       // ATR period for SL/TP calculation
input double  SL_ATR_Multiplier  = 1.5;      // Stop Loss = ATR x this value
input double  RR_Ratio_TP1       = 1.0;      // TP1 R:R (partial close target)
input double  RR_Ratio_TP2       = 3.0;      // TP2 R:R (final target, rest of position)
input bool    UseTrailingStop    = true;      // Enable trailing stop loss
input double  TrailATRMultiple   = 1.0;      // Trailing distance = ATR x this

// UPGRADE 1: Multi-Timeframe Filter
input group "====== MULTI-TIMEFRAME FILTER ======"
input bool    UseMTFFilter       = false;    // Disabled by default to increase trade frequency
input ENUM_TIMEFRAMES MTF_Higher = PERIOD_H4;  // Higher timeframe to check
input ENUM_TIMEFRAMES MTF_Highest= PERIOD_D1;  // Highest timeframe to check

// UPGRADE 2: Break-Even Stop
input group "====== BREAK-EVEN STOP ======"
input bool    UseBreakEven       = true;     // Move SL to entry after profit threshold
input double  BE_ATR_Trigger     = 1.0;      // Trigger break-even after this x ATR profit
input int     BE_BufferPoints    = 5;        // Extra buffer above entry (in points)

// UPGRADE 4: ADX Trend Strength Filter
input group "====== ADX TREND FILTER ======"
input bool    UseADXFilter       = false;    // Disabled by default to increase trade frequency
input int     ADX_Period         = 14;       // ADX period
input double  ADX_MinStrength    = 20.0;     // Min ADX value to allow trades (20+ = trending)

// UPGRADE 5: Partial Take Profit
input group "====== PARTIAL TAKE PROFIT ======"
input bool    UsePartialTP       = true;     // Close 50% at TP1, run rest to TP2
input double  PartialClosePercent= 50.0;     // % of position to close at TP1

// UPGRADE 6: Smart Recovery
input group "====== SMART RECOVERY ======"
input bool    UseSmartRecovery   = true;     // Reduce size after consecutive losses
input int     LossesBeforeReduce = 2;        // Number of consecutive losses to trigger
input double  RecoveryLotScale   = 0.5;      // Multiply lot size by this after losses

// EMA Settings
input group "====== EMA SETTINGS ======"
input int     EMA_Fast           = 9;        // Fast EMA period
input int     EMA_Medium         = 21;       // Medium EMA period
input int     EMA_Slow           = 50;       // Slow EMA period
input int     EMA_Long           = 200;      // Long EMA period

// RSI Settings
input group "====== RSI SETTINGS ======"
input bool    UseRSI             = true;     // Include RSI in signal scoring
input int     RSI_Period         = 14;       // RSI calculation period
input int     RSI_Overbought     = 70;       // RSI overbought level
input int     RSI_Oversold       = 30;       // RSI oversold level

// MACD Settings
input group "====== MACD SETTINGS ======"
input bool    UseMACD            = true;     // Include MACD in signal scoring
input int     MACD_Fast          = 12;       // MACD fast EMA
input int     MACD_Slow_Period   = 26;       // MACD slow EMA
input int     MACD_Signal        = 9;        // MACD signal line

// Bollinger Band Settings
input group "====== BOLLINGER BANDS ======"
input int     BB_Period          = 20;       // BB period
input double  BB_Deviation       = 2.0;      // BB standard deviation

// UPGRADE 3: Stochastic Oscillator
input group "====== STOCHASTIC OSCILLATOR ======"
input bool    UseStochastic      = true;     // Include Stochastic in signal scoring
input int     Stoch_K            = 14;       // Stochastic %K period
input int     Stoch_D            = 3;        // Stochastic %D period
input int     Stoch_Slowing      = 3;        // Stochastic slowing

// Signal Settings
input group "====== SIGNAL SETTINGS ======"
input int     MinSignalScore     = 3;        // Minimum confluence score (1-7)
input double  VolumeMultiplier   = 1.0;      // Reduced to 1.0 to trigger more trades
input int     VolumeAvgPeriod    = 20;       // Volume average lookback
input int     SignalCooldownBars = 5;        // Bars between signals to avoid overtrading

// Session Filter
input group "====== SESSION FILTER ======"
input bool    UseSessionFilter   = true;     // Only trade during active sessions
input int     SessionStartHour   = 7;        // Start hour (UTC) - London open
input int     SessionEndHour     = 21;       // End hour (UTC) - NY close

// Display
input group "====== DISPLAY ======"
input bool    ShowDashboard      = true;     // Show on-chart info panel
input ulong   MagicNumber        = 0;        // Magic Number (0 = Auto-generate unique ID)

// ULTIMATE UPGRADE 2: Bar-Expiry Time Stop
input group "====== BAR-EXPIRY TIME STOP ======"
input bool    UseTimeExit        = true;     // Close trades after maximum candle life
input int     MaxBarLife         = 30;       // Max candles trade can stay open

// ULTIMATE UPGRADE 4: Auto-Resetting Account Circuit Breaker
input group "====== ACCOUNT CIRCUIT BREAKER ======"
input bool    UseCircuitBreaker  = true;     // Enable account-wide drawdown protector
input double  MaxFloatingLossPct = 5.0;      // Max float loss % allowed across all trades
input int     CB_CooldownMinutes = 30;       // Minutes to wait before auto-reset attempt

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                  |
//+------------------------------------------------------------------+
CTrade         trade;
CPositionInfo  posInfo;

// Unique Magic Number tracking
ulong          activeMagicNumber  = 0;

// Emergency Circuit Breaker state
bool           circuitBreakerTripped = false;
datetime       circuitBreakerTripTime = 0;
bool           isGold = false;


// Simple hash function for string to integer
uint GetSymbolHash(string sym)
{
   uint hash = 0;
   for(int i = 0; i < StringLen(sym); i++)
      hash = hash * 31 + sym[i];
   return hash;
}

// Convert period enum to a human-readable timeframe string
string GetTimeframeString(ENUM_TIMEFRAMES tf)
{
   switch(tf)
   {
      case PERIOD_M1:  return "M1 (1 Min)";
      case PERIOD_M5:  return "M5 (5 Min)";
      case PERIOD_M15: return "M15 (15 Min)";
      case PERIOD_M30: return "M30 (30 Min)";
      case PERIOD_H1:  return "H1 (1 Hour)";
      case PERIOD_H4:  return "H4 (4 Hour)";
      case PERIOD_D1:  return "Daily";
      case PERIOD_W1:  return "Weekly";
      case PERIOD_MN1: return "Monthly";
      default:         return "Custom";
   }
}

// Indicator handles - Current Timeframe
int handleEmaFast, handleEmaMed, handleEmaSlow, handleEmaLong;
int handleRSI, handleMACD, handleBB, handleATR, handleADX;
int handleStoch;  // UPGRADE 3: Stochastic Oscillator

// Indicator handles - Multi-Timeframe (UPGRADE 1)
int handleEmaFast_H4, handleEmaMed_H4;
int handleEmaFast_D1, handleEmaMed_D1;

// Signal tracking
int lastBuyBar   = 0;
int lastSellBar  = 0;

// UPGRADE 5: Partial TP tracking
double originalLotSize    = 0;
bool   partialTPTaken     = false;
double tp1Price           = 0;

// UPGRADE 6: Smart Recovery
int    consecutiveLosses  = 0;
int    lastHistoryCount   = 0;

// Ticket tracking cache to prevent duplicate asynchronous modifications (race conditions)
ulong    cacheTicket = 0;
double   cacheSL     = 0;
double   cacheTP     = 0;
datetime cacheTime   = 0;

bool SafePositionModify(ulong ticket, double sl, double tp, int digits)
{
   if(ticket == cacheTicket && 
      NormalizeDouble(sl - cacheSL, digits) == 0 && 
      NormalizeDouble(tp - cacheTP, digits) == 0 &&
      TimeCurrent() - cacheTime < 5)
   {
      return false; // Skip duplicate request during execution latency
   }
   
   if(trade.PositionModify(ticket, sl, tp))
   {
      cacheTicket = ticket;
      cacheSL     = sl;
      cacheTP     = tp;
      cacheTime   = TimeCurrent();
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| INITIALIZATION                                                    |
//+------------------------------------------------------------------+
//+------------------------------------------------------------------+
//| LICENSE ACTIVATION VERIFICATION                                  |
//+------------------------------------------------------------------+
string GenerateLicenseKey(long accountNum)
{
   long baseVal = accountNum * 31;
   string p1 = IntegerToString(baseVal % 10000);
   string p2 = IntegerToString((baseVal / 3) % 10000);
   string p3 = IntegerToString((baseVal / 7) % 10000);
   
   // Pad with defaults if length < 4
   while(StringLen(p1) < 4) p1 = "7" + p1;
   while(StringLen(p2) < 4) p2 = "3" + p2;
   while(StringLen(p3) < 4) p3 = "9" + p3;
   
   return "FMP-" + p1 + "-" + p2 + "-" + p3;
}

int OnInit()
{
   Print("===========================================");
   Print("  FOREX MASTER PRO EA v4.0 (POWERHOUSE) - INITIALIZED");
   Print("  10 PRO UPGRADES ACTIVE | 7-Indicator Confluence");
   Print("  Risk: ", RiskPercent, "% | Max Lot: ", MaxLotSize);
   Print("  TP1: 1:", RR_Ratio_TP1, " | TP2: 1:", RR_Ratio_TP2);
   Print("===========================================");
   
   // Check if trading Gold (XAUUSD / GOLD / PAXG / etc.)
   string symUpper = _Symbol;
   StringToUpper(symUpper);
   if(StringFind(symUpper, "XAU") >= 0 || StringFind(symUpper, "GOLD") >= 0)
   {
      isGold = true;
      Print("XAUUSD/Gold detected! Loading optimized safe configurations.");
   }
   
   // Trade setup

   activeMagicNumber = MagicNumber;
   if(MagicNumber == 0)
   {
      activeMagicNumber = 1000000 + (GetSymbolHash(_Symbol) % 100000) + (ulong)_Period;
   }
   trade.SetExpertMagicNumber(activeMagicNumber);
   trade.SetDeviationInPoints(30);
   
   // Current timeframe indicators
   handleEmaFast = iMA(_Symbol, PERIOD_CURRENT, EMA_Fast,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaMed  = iMA(_Symbol, PERIOD_CURRENT, EMA_Medium, 0, MODE_EMA, PRICE_CLOSE);
   handleEmaSlow = iMA(_Symbol, PERIOD_CURRENT, EMA_Slow,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaLong = iMA(_Symbol, PERIOD_CURRENT, EMA_Long,  0, MODE_EMA, PRICE_CLOSE);
   handleRSI     = iRSI(_Symbol, PERIOD_CURRENT, RSI_Period, PRICE_CLOSE);
   handleMACD    = iMACD(_Symbol, PERIOD_CURRENT, MACD_Fast, MACD_Slow_Period, MACD_Signal, PRICE_CLOSE);
   handleBB      = iBands(_Symbol, PERIOD_CURRENT, BB_Period, 0, BB_Deviation, PRICE_CLOSE);
   handleATR     = iATR(_Symbol, PERIOD_CURRENT, ATR_Period);
   handleADX     = iADX(_Symbol, PERIOD_CURRENT, ADX_Period);
   handleStoch   = iStochastic(_Symbol, PERIOD_CURRENT, Stoch_K, Stoch_D, Stoch_Slowing, MODE_SMA, STO_LOWHIGH);
   
   // UPGRADE 1: Multi-Timeframe EMA handles
   handleEmaFast_H4 = iMA(_Symbol, MTF_Higher,  EMA_Fast,   0, MODE_EMA, PRICE_CLOSE);
   handleEmaMed_H4  = iMA(_Symbol, MTF_Higher,  EMA_Medium,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaFast_D1 = iMA(_Symbol, MTF_Highest, EMA_Fast,   0, MODE_EMA, PRICE_CLOSE);
   handleEmaMed_D1  = iMA(_Symbol, MTF_Highest, EMA_Medium,  0, MODE_EMA, PRICE_CLOSE);
   
   // Validate all handles
   if(handleEmaFast == INVALID_HANDLE || handleEmaMed == INVALID_HANDLE ||
      handleEmaSlow == INVALID_HANDLE || handleRSI == INVALID_HANDLE ||
      handleMACD == INVALID_HANDLE || handleBB == INVALID_HANDLE ||
      handleATR == INVALID_HANDLE || handleADX == INVALID_HANDLE ||
      handleStoch == INVALID_HANDLE ||
      handleEmaFast_H4 == INVALID_HANDLE || handleEmaMed_H4 == INVALID_HANDLE ||
      handleEmaFast_D1 == INVALID_HANDLE || handleEmaMed_D1 == INVALID_HANDLE)
   {
      Print("ERROR: Failed to create indicator handles!");
      return(INIT_FAILED);
   }
   
   // Initialize history count for smart recovery
   lastHistoryCount = HistoryDealsTotal();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| DEINITIALIZATION                                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(handleEmaFast);
   IndicatorRelease(handleEmaMed);
   IndicatorRelease(handleEmaSlow);
   IndicatorRelease(handleEmaLong);
   IndicatorRelease(handleRSI);
   IndicatorRelease(handleMACD);
   IndicatorRelease(handleBB);
   IndicatorRelease(handleATR);
   IndicatorRelease(handleADX);
   IndicatorRelease(handleStoch);
   IndicatorRelease(handleEmaFast_H4);
   IndicatorRelease(handleEmaMed_H4);
   IndicatorRelease(handleEmaFast_D1);
   IndicatorRelease(handleEmaMed_D1);
   
   Comment("");
   Print("Forex Master Pro EA v4.0 - Removed");
}

//+------------------------------------------------------------------+
//| UPGRADE 8: Auto-Resetting Account Circuit Breaker                 |
//+------------------------------------------------------------------+
void CheckCircuitBreaker()
{
   if(!UseCircuitBreaker) return;
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   
   if(balance <= 0) return;
   
   double floatLossPct = ((balance - equity) / balance) * 100.0;
   
   // --- AUTO-RESET LOGIC ---
   // If circuit breaker is already tripped, check if we can auto-reset
   if(circuitBreakerTripped)
   {
      int elapsedMin = (int)((TimeCurrent() - circuitBreakerTripTime) / 60);
      
      // Only attempt reset after cooldown has elapsed AND floating loss has recovered
      if(elapsedMin >= CB_CooldownMinutes && floatLossPct < MaxFloatingLossPct)
      {
         circuitBreakerTripped = false;
         circuitBreakerTripTime = 0;
         Print("═══════════════════════════════════════════");
         Print("  CIRCUIT BREAKER AUTO-RESET SUCCESSFUL!");
         Print("  Cooldown elapsed: ", elapsedMin, " minutes");
         Print("  Current float loss: ", DoubleToString(floatLossPct, 2), "% (below ", DoubleToString(MaxFloatingLossPct, 1), "% limit)");
         Print("  Trading has RESUMED automatically.");
         Print("═══════════════════════════════════════════");
         Alert("ForexPro EA v4.0: Circuit Breaker auto-reset. Trading resumed!");
      }
      return; // Stay paused until reset conditions are met
   }
   
   // --- TRIP LOGIC ---
   // If floating loss exceeds threshold, trip the breaker
   if(floatLossPct >= MaxFloatingLossPct)
   {
      circuitBreakerTripped = true;
      circuitBreakerTripTime = TimeCurrent();
      Print("═══════════════════════════════════════════");
      Print("  EMERGENCY CIRCUIT BREAKER TRIGGERED!");
      Print("  Floating Loss: -", DoubleToString(floatLossPct, 2), "% (Limit: ", DoubleToString(MaxFloatingLossPct, 1), "%)");
      Print("  Closing all positions. Will auto-reset in ", CB_CooldownMinutes, " minutes if equity recovers.");
      Print("═══════════════════════════════════════════");
      Alert("ForexPro EA v4.0: Circuit Breaker triggered! Auto-reset in ", IntegerToString(CB_CooldownMinutes), " min.");
      
      // Close all positions on the account
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         if(posInfo.SelectByIndex(i))
         {
            trade.PositionClose(posInfo.Ticket());
         }
      }
   }
}

//+------------------------------------------------------------------+
//| ULTIMATE UPGRADE 2: Bar-Expiry Time Stop                          |
//+------------------------------------------------------------------+
void CheckTimeExit()
{
   if(!UseTimeExit) return;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!posInfo.SelectByIndex(i)) continue;
      if(posInfo.Symbol() != _Symbol || posInfo.Magic() != activeMagicNumber) continue;
      
      datetime openTime = posInfo.Time();
      int barsPassed = iBarShift(_Symbol, PERIOD_CURRENT, openTime, false);
      
      if(barsPassed >= MaxBarLife)
      {
         ulong ticket = posInfo.Ticket();
         Print("Time Stop Hit | Position open for ", barsPassed, " bars (Limit: ", MaxBarLife, "). Auto-closing ticket: ", ticket);
         trade.PositionClose(ticket);
      }
   }
}

//+------------------------------------------------------------------+
//| MAIN TICK FUNCTION                                                |
//+------------------------------------------------------------------+
void OnTick()
{
   // -- ULTIMATE UPGRADE 4: Account Circuit Breaker Check -------------
   CheckCircuitBreaker();
   if(circuitBreakerTripped) 
   {
      if(ShowDashboard) UpdateDashboard();
      return; // Do not trade if circuit breaker is tripped
   }

   // -- Per-Tick Operations ------------------------------------------
   if(UseTrailingStop || UseBreakEven) ManageStopLoss();
   if(UsePartialTP) ManagePartialTP();
   if(UseSmartRecovery) CheckTradeHistory();
   if(ShowDashboard) UpdateDashboard();
   
   // -- Signal Logic: Only on New Bar --------------------------------
   static datetime lastBarTime = 0;
   datetime currentBarTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;
   
   // -- ULTIMATE UPGRADE 2: Time-Based Trade Expiry ------------------
   CheckTimeExit();
   
   // -- Safety Checks ------------------------------------------------
    long currentSpread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
    long maxSpread = isGold ? 60 : MaxSpreadPoints;
    if(currentSpread > maxSpread) return;
   
   if(UseSessionFilter)
   {
      MqlDateTime timeStruct;
      TimeCurrent(timeStruct);
      if(timeStruct.hour < SessionStartHour || timeStruct.hour >= SessionEndHour)
         return;
   }
   
   int openTrades = CountOpenTrades();
   
   // -- Get Indicator Values -----------------------------------------
   double ema9[], ema21[], ema50[], ema200[];
   double rsi[], macdMain[], macdSignal[];
   double bbUpper[], bbLower[], bbMiddle[];
   double atr[], adx[];
   double stochK[], stochD[];
   
   if(CopyBuffer(handleEmaFast, 0, 1, 3, ema9)   < 3) return;
   if(CopyBuffer(handleEmaMed,  0, 1, 3, ema21)  < 3) return;
   if(CopyBuffer(handleEmaSlow, 0, 1, 3, ema50)  < 3) return;
   if(CopyBuffer(handleEmaLong, 0, 1, 3, ema200) < 3) return;
   if(CopyBuffer(handleRSI,     0, 1, 2, rsi)    < 2) return;
   if(CopyBuffer(handleMACD,    0, 1, 4, macdMain)   < 4) return;
   if(CopyBuffer(handleMACD,    1, 1, 4, macdSignal) < 4) return;
   if(CopyBuffer(handleBB,      1, 1, 2, bbUpper)    < 2) return;
   if(CopyBuffer(handleBB,      2, 1, 2, bbLower)    < 2) return;
   if(CopyBuffer(handleBB,      0, 1, 2, bbMiddle)   < 2) return;
   if(CopyBuffer(handleATR,     0, 1, 2, atr)        < 2) return;
   if(CopyBuffer(handleADX,     0, 1, 2, adx)        < 2) return;
   if(CopyBuffer(handleStoch,   0, 1, 2, stochK)     < 2) return;
   if(CopyBuffer(handleStoch,   1, 1, 2, stochD)     < 2) return;
   
   ArraySetAsSeries(ema9, true);    ArraySetAsSeries(ema21, true);
   ArraySetAsSeries(ema50, true);   ArraySetAsSeries(ema200, true);
   ArraySetAsSeries(rsi, true);     ArraySetAsSeries(adx, true);
   ArraySetAsSeries(macdMain, true); ArraySetAsSeries(macdSignal, true);
   ArraySetAsSeries(bbUpper, true); ArraySetAsSeries(bbLower, true);
   ArraySetAsSeries(bbMiddle, true); ArraySetAsSeries(atr, true);
   ArraySetAsSeries(stochK, true);  ArraySetAsSeries(stochD, true);
   
   double closePrice = iClose(_Symbol, PERIOD_CURRENT, 1);
   double openPrice  = iOpen(_Symbol, PERIOD_CURRENT, 1);
   double lowPrice   = iLow(_Symbol, PERIOD_CURRENT, 1);
   double highPrice  = iHigh(_Symbol, PERIOD_CURRENT, 1);
   
   // Previous candle for pattern recognition
   double closePrice2 = iClose(_Symbol, PERIOD_CURRENT, 2);
   double openPrice2  = iOpen(_Symbol, PERIOD_CURRENT, 2);
   double lowPrice2   = iLow(_Symbol, PERIOD_CURRENT, 2);
   double highPrice2  = iHigh(_Symbol, PERIOD_CURRENT, 2);
   
   double hist0 = macdMain[0] - macdSignal[0];
   double hist1 = macdMain[1] - macdSignal[1];
   double hist2 = macdMain[2] - macdSignal[2];
   
   // Volume
   long volCurr = iVolume(_Symbol, PERIOD_CURRENT, 1);
   double volAvg = 0;
   for(int i = 1; i <= VolumeAvgPeriod; i++)
      volAvg += (double)iVolume(_Symbol, PERIOD_CURRENT, i);
   volAvg /= VolumeAvgPeriod;
   bool volHigh = ((double)volCurr > volAvg * VolumeMultiplier);
   
   // -- UPGRADE 10: ATR Volatility Regime Filter ----------------------
   // Calculate average ATR over 50 bars to establish "normal" volatility
   double atrSum = 0;
   double atrBuf50[];
   if(CopyBuffer(handleATR, 0, 1, 50, atrBuf50) >= 50)
   {
      for(int i = 0; i < 50; i++) atrSum += atrBuf50[i];
      double atrAvg50 = atrSum / 50.0;
      
      // Skip if ATR is too low (dead market) or too high (chaotic)
      if(atr[0] < atrAvg50 * 0.5)
      {
         return; // Dead market - fake signals likely
      }
      if(atr[0] > atrAvg50 * 3.0)
      {
         return; // Extremely volatile - stop losses will be destroyed
      }
   }
   
   // -- UPGRADE 4: ADX Filter ----------------------------------------
   if(UseADXFilter && adx[0] < ADX_MinStrength)
      return; // Market is choppy/sideways - skip
   
   // -- UPGRADE 1: Multi-Timeframe Filter ----------------------------
   bool mtfBullish = true;
   bool mtfBearish = true;
   
   if(UseMTFFilter)
   {
      double ema9_h4[1], ema21_h4[1], ema9_d1[1], ema21_d1[1];
      
      if(CopyBuffer(handleEmaFast_H4, 0, 1, 1, ema9_h4)  < 1) return;
      if(CopyBuffer(handleEmaMed_H4,  0, 1, 1, ema21_h4) < 1) return;
      if(CopyBuffer(handleEmaFast_D1, 0, 1, 1, ema9_d1)  < 1) return;
      if(CopyBuffer(handleEmaMed_D1,  0, 1, 1, ema21_d1) < 1) return;
      
      // Both H4 and Daily must agree with the signal direction
      mtfBullish = (ema9_h4[0] > ema21_h4[0] && ema9_d1[0] > ema21_d1[0]);
      mtfBearish = (ema9_h4[0] < ema21_h4[0] && ema9_d1[0] < ema21_d1[0]);
   }
   
   // -- Trend Detection ----------------------------------------------
   bool bullishFast = (ema9[0] > ema21[0]);
   bool bearishFast = (ema9[0] < ema21[0]);
   
   // -- UPGRADE 9: Candle Pattern Detection ---------------------------
   double body1  = MathAbs(closePrice - openPrice);
   double range1 = highPrice - lowPrice;
   double body2  = MathAbs(closePrice2 - openPrice2);
   double range2 = highPrice2 - lowPrice2;
   
   // Bullish Engulfing: current candle is bullish and fully engulfs previous bearish candle
   bool bullishEngulfing = (closePrice > openPrice) && (closePrice2 < openPrice2) &&
                           (closePrice > openPrice2) && (openPrice < closePrice2) &&
                           (body1 > body2 * 1.1);
   
   // Bullish Pin Bar: long lower wick (>60% of range), small body at top
   double lowerWick1 = MathMin(closePrice, openPrice) - lowPrice;
   bool bullishPinBar = (range1 > 0) && (lowerWick1 / range1 > 0.60) && (body1 / range1 < 0.35) &&
                        (closePrice > openPrice);
   
   // Bearish Engulfing: current candle is bearish and fully engulfs previous bullish candle
   bool bearishEngulfing = (closePrice < openPrice) && (closePrice2 > openPrice2) &&
                           (openPrice > closePrice2) && (closePrice < openPrice2) &&
                           (body1 > body2 * 1.1);
   
   // Bearish Pin Bar: long upper wick (>60% of range), small body at bottom
   double upperWick1 = highPrice - MathMax(closePrice, openPrice);
   bool bearishPinBar = (range1 > 0) && (upperWick1 / range1 > 0.60) && (body1 / range1 < 0.35) &&
                        (closePrice < openPrice);
   
   bool bullishPattern = bullishEngulfing || bullishPinBar;
   bool bearishPattern = bearishEngulfing || bearishPinBar;
   
   // ═══════════════════════════════════════════════════════════════════
   // ██  7-INDICATOR CONFLUENCE SCORING SYSTEM  (v4.0)
   // ═══════════════════════════════════════════════════════════════════
   
   // -- BUY Signal Scoring (7 indicators) -----------------------------
   int buyScore = 0;
   bool buyCond1 = false;
   
   // 1. EMA Crossover / Pullback
   bool emaBuyCross = (ema9[1] <= ema21[1] && ema9[0] > ema21[0]);
   bool buyPullback = (bullishFast && lowPrice <= ema21[0] * 1.002 && closePrice > ema21[0] && closePrice > openPrice);
   if(emaBuyCross || buyPullback) { buyCond1 = true; buyScore++; }
   
   // 2. RSI
   if(UseRSI)
   {
      if(isGold)
      {
         if(rsi[0] > 40 && rsi[0] < 65) buyScore++;
      }
      else
      {
         if(rsi[0] > RSI_Oversold && rsi[0] < 50) buyScore++;
      }
   }
   
   // 3. MACD
   bool macdBuyCross = (macdMain[1] <= macdSignal[1] && macdMain[0] > macdSignal[0]);
   bool macdHistRising = (macdMain[0] > macdSignal[0] && hist0 > hist1 && hist1 > hist2);
   if(UseMACD && (macdBuyCross || macdHistRising)) buyScore++;
   
   // 4. Bollinger Bands
   if(isGold)
   {
      if(closePrice < bbUpper[0]) buyScore++;
   }
   else
   {
      if(closePrice < bbMiddle[0]) buyScore++;
   }
   
   // 5. Volume
   if(isGold)
   {
      bool goldVolHigh = ((double)volCurr > volAvg * 0.9);
      if(goldVolHigh) buyScore++;
   }
   else
   {
      if(volHigh) buyScore++;
   }
   
   // 6. Stochastic Oscillator (NEW in v4.0)
   if(UseStochastic)
   {
      if(isGold)
      {
         // Gold: bullish if K is in 25-55 range (momentum building)
         bool stochBuyCross = (stochK[1] <= stochD[1] && stochK[0] > stochD[0] && stochK[0] < 40);
         bool stochBuyZone  = (stochK[0] > 25 && stochK[0] < 55);
         if(stochBuyCross || stochBuyZone) buyScore++;
      }
      else
      {
         // Standard: K crosses above D from below 30, or K in 20-50
         bool stochBuyCross = (stochK[1] <= stochD[1] && stochK[0] > stochD[0] && stochK[0] < 35);
         bool stochBuyZone  = (stochK[0] > 20 && stochK[0] < 50);
         if(stochBuyCross || stochBuyZone) buyScore++;
      }
   }
   
   // 7. Candle Pattern (NEW in v4.0)
   if(bullishPattern) buyScore++;
   
   // -- SELL Signal Scoring (7 indicators) ----------------------------
   int sellScore = 0;
   bool sellCond1 = false;
   
   // 1. EMA Crossover / Pullback
   bool emaSellCross = (ema9[1] >= ema21[1] && ema9[0] < ema21[0]);
   bool sellPullback = (bearishFast && highPrice >= ema21[0] * 0.998 && closePrice < ema21[0] && closePrice < openPrice);
   if(emaSellCross || sellPullback) { sellCond1 = true; sellScore++; }
   
   // 2. RSI
   if(UseRSI)
   {
      if(isGold)
      {
         if(rsi[0] < 60 && rsi[0] > 35) sellScore++;
      }
      else
      {
         if(rsi[0] < RSI_Overbought && rsi[0] > 50) sellScore++;
      }
   }
   
   // 3. MACD
   bool macdSellCross = (macdMain[1] >= macdSignal[1] && macdMain[0] < macdSignal[0]);
   bool macdHistFalling = (macdMain[0] < macdSignal[0] && hist0 < hist1 && hist1 < hist2);
   if(UseMACD && (macdSellCross || macdHistFalling)) sellScore++;
   
   // 4. Bollinger Bands
   if(isGold)
   {
      if(closePrice > bbLower[0]) sellScore++;
   }
   else
   {
      if(closePrice > bbMiddle[0]) sellScore++;
   }
   
   // 5. Volume
   if(isGold)
   {
      bool goldVolHigh = ((double)volCurr > volAvg * 0.9);
      if(goldVolHigh) sellScore++;
   }
   else
   {
      if(volHigh) sellScore++;
   }
   
   // 6. Stochastic Oscillator (NEW in v4.0)
   if(UseStochastic)
   {
      if(isGold)
      {
         // Gold: bearish if K is in 45-75 range (downward momentum building)
         bool stochSellCross = (stochK[1] >= stochD[1] && stochK[0] < stochD[0] && stochK[0] > 60);
         bool stochSellZone  = (stochK[0] > 45 && stochK[0] < 75);
         if(stochSellCross || stochSellZone) sellScore++;
      }
      else
      {
         // Standard: K crosses below D from above 70, or K in 50-80
         bool stochSellCross = (stochK[1] >= stochD[1] && stochK[0] < stochD[0] && stochK[0] > 65);
         bool stochSellZone  = (stochK[0] > 50 && stochK[0] < 80);
         if(stochSellCross || stochSellZone) sellScore++;
      }
   }
   
   // 7. Candle Pattern (NEW in v4.0)
   if(bearishPattern) sellScore++;
   
   // -- Signal Generation with MTF Filter ----------------------------
   int currentBar = Bars(_Symbol, PERIOD_CURRENT);
   int requiredScore = isGold ? 5 : MinSignalScore;  // Gold: 5/7, Standard: 3/7
   int cooldown = isGold ? 5 : SignalCooldownBars;
   
   bool buySignal  = (buyScore >= requiredScore && buyCond1 && mtfBullish &&
                      (currentBar - lastBuyBar > cooldown));
   bool sellSignal = (sellScore >= requiredScore && sellCond1 && mtfBearish &&
                      (currentBar - lastSellBar > cooldown));
   
   // -- Execute Trades -----------------------------------------------
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double atrVal = atr[0];
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   
   if(buySignal)  CloseAllPositions(POSITION_TYPE_SELL);
   if(sellSignal) CloseAllPositions(POSITION_TYPE_BUY);
   
   // -- UPGRADE 6: Smart Recovery Lot Adjustment ---------------------
   double lotMultiplier = 1.0;
   if(UseSmartRecovery && consecutiveLosses >= LossesBeforeReduce)
   {
      lotMultiplier = RecoveryLotScale;
      Print("Smart Recovery: ", consecutiveLosses, " consecutive losses. Lot size reduced to ",
            DoubleToString(lotMultiplier * 100, 0), "%");
   }
   
   // -- Open BUY -----------------------------------------------------
   if(buySignal && openTrades < MaxOpenTrades)
   {
      double stopLevelPoints = (double)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
      double stopLevel = stopLevelPoints * _Point;
      if(stopLevel == 0) stopLevel = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) * 2 * _Point;
      
      double slDist = atrVal * SL_ATR_Multiplier;
      if(slDist < stopLevel + 5 * _Point) slDist = stopLevel + 5 * _Point;
      double sl = NormalizeDouble(ask - slDist, digits);
      // UPGRADE 5: Set TP to TP2 (the bigger target); TP1 is managed separately
      double tp = NormalizeDouble(ask + (slDist * RR_Ratio_TP2), digits);
      double lotSize = CalculateLotSize(slDist) * lotMultiplier;
      
      // Query broker specifications to avoid invalid volumes
      double brokerMinLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
      double brokerMaxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
      double brokerLotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
      
      if(brokerLotStep > 0)
      {
         lotSize = MathRound(lotSize / brokerLotStep) * brokerLotStep;
      }
      
      if(lotSize < brokerMinLot) lotSize = brokerMinLot;
      if(lotSize > brokerMaxLot) lotSize = brokerMaxLot;
      if(lotSize > MaxLotSize)   lotSize = MaxLotSize;
      
      int lotDigits = 0;
      if(brokerLotStep == 0.01) lotDigits = 2;
      else if(brokerLotStep == 0.1) lotDigits = 1;
      else if(brokerLotStep == 1.0) lotDigits = 0;
      
      lotSize = NormalizeDouble(lotSize, lotDigits);
      
      // Store TP1 level for partial close management
      tp1Price = NormalizeDouble(ask + (slDist * RR_Ratio_TP1), digits);
      
      string comment = "FMP_BUY_S" + IntegerToString(buyScore);
      
      if(trade.Buy(lotSize, _Symbol, ask, 0, 0, comment))
      {
         lastBuyBar = currentBar;
         originalLotSize = lotSize;
         partialTPTaken = false;
         Print("BUY opened | Score: ", buyScore, "/7 | Lot: ", lotSize,
               " | SL: ", sl, " | TP1: ", tp1Price, " | TP2: ", tp,
               " | Stoch: ", DoubleToString(stochK[0], 1),
               " | ADX: ", DoubleToString(adx[0], 1),
               " | Pattern: ", (bullishPattern ? "YES" : "No"),
               " | MTF: ", (mtfBullish ? "ALIGNED" : "N/A"));
         Alert("ForexPro EA v4.0: BUY ", _Symbol, " @ ", ask, " | Score: ", buyScore, "/7");
      }
      else
         Print("BUY FAILED. Error: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
   }
   
   // -- Open SELL ----------------------------------------------------
   if(sellSignal && openTrades < MaxOpenTrades)
   {
      double stopLevelPoints = (double)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
      double stopLevel = stopLevelPoints * _Point;
      if(stopLevel == 0) stopLevel = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) * 2 * _Point;
      
      double slDist = atrVal * SL_ATR_Multiplier;
      if(slDist < stopLevel + 5 * _Point) slDist = stopLevel + 5 * _Point;
      double sl = NormalizeDouble(bid + slDist, digits);
      double tp = NormalizeDouble(bid - (slDist * RR_Ratio_TP2), digits);
      double lotSize = CalculateLotSize(slDist) * lotMultiplier;
      
      // Query broker specifications to avoid invalid volumes
      double brokerMinLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
      double brokerMaxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
      double brokerLotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
      
      if(brokerLotStep > 0)
      {
         lotSize = MathRound(lotSize / brokerLotStep) * brokerLotStep;
      }
      
      if(lotSize < brokerMinLot) lotSize = brokerMinLot;
      if(lotSize > brokerMaxLot) lotSize = brokerMaxLot;
      if(lotSize > MaxLotSize)   lotSize = MaxLotSize;
      
      int lotDigits = 0;
      if(brokerLotStep == 0.01) lotDigits = 2;
      else if(brokerLotStep == 0.1) lotDigits = 1;
      else if(brokerLotStep == 1.0) lotDigits = 0;
      
      lotSize = NormalizeDouble(lotSize, lotDigits);
      
      tp1Price = NormalizeDouble(bid - (slDist * RR_Ratio_TP1), digits);
      
      string comment = "FMP_SELL_S" + IntegerToString(sellScore);
      
      if(trade.Sell(lotSize, _Symbol, bid, 0, 0, comment))
      {
         lastSellBar = currentBar;
         originalLotSize = lotSize;
         partialTPTaken = false;
         Print("SELL opened | Score: ", sellScore, "/7 | Lot: ", lotSize,
               " | SL: ", sl, " | TP1: ", tp1Price, " | TP2: ", tp,
               " | Stoch: ", DoubleToString(stochK[0], 1),
               " | ADX: ", DoubleToString(adx[0], 1),
               " | Pattern: ", (bearishPattern ? "YES" : "No"),
               " | MTF: ", (mtfBearish ? "ALIGNED" : "N/A"));
         Alert("ForexPro EA v4.0: SELL ", _Symbol, " @ ", bid, " | Score: ", sellScore, "/7");
      }
      else
         Print("SELL FAILED. Error: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
   }
}

//+------------------------------------------------------------------+
//| LOT SIZE CALCULATOR                                               |
//+------------------------------------------------------------------+
double CalculateLotSize(double slDistancePrice)
{
   if(slDistancePrice <= 0) return MinLotSize;
   
   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = accountBalance * (RiskPercent / 100.0);
   
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double lotStep   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   double minLot    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   
   if(tickSize == 0 || tickValue == 0 || lotStep == 0) return MinLotSize;
   
   double slTicks = slDistancePrice / tickSize;
   double lotSize = riskAmount / (slTicks * tickValue);
   
   // Align to lot step
   lotSize = MathRound(lotSize / lotStep) * lotStep;
   
   // Verify minimum and maximum boundaries
   if(lotSize < minLot) lotSize = minLot;
   if(lotSize > maxLot) lotSize = maxLot;
   if(lotSize > MaxLotSize) lotSize = MaxLotSize;
   
   // Check free margin and scale down if necessary
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginRequired = 0;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   if(ask > 0 && OrderCalcMargin(ORDER_TYPE_BUY, _Symbol, lotSize, ask, marginRequired))
   {
      if(marginRequired > freeMargin && marginRequired > 0)
      {
         double multiplier = (freeMargin / marginRequired) * 0.9; // 10% safety buffer
         lotSize = MathRound((lotSize * multiplier) / lotStep) * lotStep;
         if(lotSize < minLot) lotSize = minLot;
      }
   }
   
   // Determine correct decimal precision based on lot step
   int lotDigits = 0;
   if(lotStep == 0.01) lotDigits = 2;
   else if(lotStep == 0.1) lotDigits = 1;
   else if(lotStep == 1.0) lotDigits = 0;
   
   return NormalizeDouble(lotSize, lotDigits);
}

//+------------------------------------------------------------------+
//| COUNT OPEN TRADES                                                 |
//+------------------------------------------------------------------+
int CountOpenTrades()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
         if(posInfo.Symbol() == _Symbol && posInfo.Magic() == activeMagicNumber)
            count++;
   }
   return count;
}

//+------------------------------------------------------------------+
//| CLOSE ALL POSITIONS BY TYPE                                       |
//+------------------------------------------------------------------+
void CloseAllPositions(ENUM_POSITION_TYPE posType)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol && posInfo.Magic() == activeMagicNumber && posInfo.PositionType() == posType)
         {
            ulong ticket = posInfo.Ticket();
            if(trade.PositionClose(ticket))
               Print("Position closed | Ticket: ", ticket, " | P/L: $", DoubleToString(posInfo.Profit(), 2));
            else
               Print("Failed to close | Ticket: ", ticket, " | Error: ", trade.ResultRetcode());
         }
      }
   }
}

//+------------------------------------------------------------------+
//| UPGRADE 2 + TRAILING: Combined Stop Loss Management               |
//+------------------------------------------------------------------+
void ManageStopLoss()
{
   double atrBuf[];
   if(CopyBuffer(handleATR, 0, 0, 1, atrBuf) < 1) return;
   double atrVal = atrBuf[0];
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   
   // Retrieve broker's minimum stop level limit (enforced at >= 20 points safety minimum)
   double stopLevelPoints = (double)SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double stopLevel = stopLevelPoints * _Point;
   double minSafetyStop = 50 * _Point;
   if(stopLevel < minSafetyStop) stopLevel = minSafetyStop;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      // Select position directly by ticket for real-time synced data (bypassing library wrapper caching issues)
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol || PositionGetInteger(POSITION_MAGIC) != activeMagicNumber) continue;
      
      double currentSL  = PositionGetDouble(POSITION_SL);
      double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentTP  = PositionGetDouble(POSITION_TP);
      long posType      = PositionGetInteger(POSITION_TYPE);
      
      if(posType == POSITION_TYPE_BUY)
      {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         
         // 1. Set Initial SL/TP on the next tick if they are not set yet (0.0)
         if(currentSL == 0 || currentTP == 0)
         {
            double slDist = atrVal * SL_ATR_Multiplier;
            if(slDist < stopLevel + 5 * _Point) slDist = stopLevel + 5 * _Point;
            
            double targetSL = NormalizeDouble(entryPrice - slDist, digits);
            double targetTP = NormalizeDouble(entryPrice + (slDist * RR_Ratio_TP2), digits);
            
            // Check if they violate stop level relative to current bid
            if(targetSL < (bid - stopLevel) && targetTP > (bid + stopLevel))
            {
               SafePositionModify(ticket, targetSL, targetTP, digits);
               Print("Initial Stops Set (BUY) | SL: ", targetSL, " | TP: ", targetTP);
            }
            continue; // Skip BE/trailing on the tick we set initial stops
         }
         
         // Freeze zone protection for existing stops: if current SL or TP is already too close to Bid, do not modify
         if(currentTP > 0 && currentTP < (bid + stopLevel)) continue;
         if(currentSL > 0 && currentSL > (bid - stopLevel)) continue;
         
         double profitDist = bid - entryPrice;
         
         // UPGRADE 2: Break-Even - Move SL to entry after 1x ATR profit
         if(UseBreakEven && profitDist >= (atrVal * BE_ATR_Trigger))
         {
            double beSL = NormalizeDouble(entryPrice + BE_BufferPoints * _Point, digits);
            // Ensure the new SL is not too close to the current Bid price based on broker's stop level limits
            if(beSL < (bid - stopLevel) && NormalizeDouble(beSL - currentSL, digits) >= _Point)
            {
               SafePositionModify(ticket, beSL, currentTP, digits);
               Print("Break-Even activated (BUY) | SL moved to: ", beSL);
            }
         }
         
         // Trailing Stop
         if(UseTrailingStop)
         {
            double trailSL = NormalizeDouble(bid - (atrVal * TrailATRMultiple), digits);
            // Ensure the trailing SL is not too close to the current Bid price based on broker's stop level limits
            if(trailSL < (bid - stopLevel) && NormalizeDouble(trailSL - currentSL, digits) >= _Point && trailSL > entryPrice)
            {
               SafePositionModify(ticket, trailSL, currentTP, digits);
            }
         }
      }
      else if(posType == POSITION_TYPE_SELL)
      {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         
         // 1. Set Initial SL/TP on the next tick if they are not set yet (0.0)
         if(currentSL == 0 || currentTP == 0)
         {
            double slDist = atrVal * SL_ATR_Multiplier;
            if(slDist < stopLevel + 5 * _Point) slDist = stopLevel + 5 * _Point;
            
            double targetSL = NormalizeDouble(entryPrice + slDist, digits);
            double targetTP = NormalizeDouble(entryPrice - (slDist * RR_Ratio_TP2), digits);
            
            // Check if they violate stop level relative to current ask
            if(targetSL > (ask + stopLevel) && targetTP < (ask - stopLevel))
            {
               SafePositionModify(ticket, targetSL, targetTP, digits);
               Print("Initial Stops Set (SELL) | SL: ", targetSL, " | TP: ", targetTP);
            }
            continue; // Skip BE/trailing on the tick we set initial stops
         }
         
         // Freeze zone protection for existing stops: if current SL or TP is already too close to Ask, do not modify
         if(currentTP > 0 && currentTP > (ask - stopLevel)) continue;
         if(currentSL > 0 && currentSL < (ask + stopLevel)) continue;
         
         double profitDist = entryPrice - ask;
         
         // UPGRADE 2: Break-Even
         if(UseBreakEven && profitDist >= (atrVal * BE_ATR_Trigger))
         {
            double beSL = NormalizeDouble(entryPrice - BE_BufferPoints * _Point, digits);
            // Ensure the new SL is not too close to the current Ask price based on broker's stop level limits
            if(beSL > (ask + stopLevel) && (currentSL == 0 || NormalizeDouble(currentSL - beSL, digits) >= _Point))
            {
               SafePositionModify(ticket, beSL, currentTP, digits);
               Print("Break-Even activated (SELL) | SL moved to: ", beSL);
            }
         }
         
         // Trailing Stop
         if(UseTrailingStop)
         {
            double trailSL = NormalizeDouble(ask + (atrVal * TrailATRMultiple), digits);
            // Ensure the trailing SL is not too close to the current Ask price based on broker's stop level limits
            if(trailSL > (ask + stopLevel) && (currentSL == 0 || NormalizeDouble(currentSL - trailSL, digits) >= _Point) && trailSL < entryPrice)
            {
               SafePositionModify(ticket, trailSL, currentTP, digits);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
void ManagePartialTP()
{
   if(!UsePartialTP || partialTPTaken) return;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!posInfo.SelectByIndex(i)) continue;
      if(posInfo.Symbol() != _Symbol || posInfo.Magic() != activeMagicNumber) continue;
      
      double entryPrice = posInfo.PriceOpen();
      ulong  ticket     = posInfo.Ticket();
      double currentVol = posInfo.Volume();
      
      if(posInfo.PositionType() == POSITION_TYPE_BUY)
      {
         double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
         
         // Check if price has reached TP1 level
         if(bid >= tp1Price && tp1Price > 0)
         {
            // Close partial amount
            double closeVol = NormalizeDouble(currentVol * (PartialClosePercent / 100.0), 2);
            double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
            
            if(closeVol >= minLot && (currentVol - closeVol) >= minLot)
            {
               // Decouple from buggy PositionClosePartial by sending a direct SELL order to reduce position volume
               if(trade.Sell(closeVol, _Symbol, bid, 0, 0, "FMP_PARTIAL_TP"))
               {
                  partialTPTaken = true;
                  Print("Partial TP HIT (BUY) | Closed ", DoubleToString(closeVol, 2),
                        " lots at TP1: ", tp1Price, " | Remaining: ", DoubleToString(currentVol - closeVol, 2), " lots");
               }
            }
            else
            {
               // Position too small to split - mark as taken
               partialTPTaken = true;
            }
         }
      }
      else if(posInfo.PositionType() == POSITION_TYPE_SELL)
      {
         double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
         
         if(ask <= tp1Price && tp1Price > 0)
         {
            double closeVol = NormalizeDouble(currentVol * (PartialClosePercent / 100.0), 2);
            double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
            
            if(closeVol >= minLot && (currentVol - closeVol) >= minLot)
            {
               // Decouple from buggy PositionClosePartial by sending a direct BUY order to reduce position volume
               if(trade.Buy(closeVol, _Symbol, ask, 0, 0, "FMP_PARTIAL_TP"))
               {
                  partialTPTaken = true;
                  Print("Partial TP HIT (SELL) | Closed ", DoubleToString(closeVol, 2),
                        " lots at TP1: ", tp1Price, " | Remaining: ", DoubleToString(currentVol - closeVol, 2), " lots");
               }
            }
            else
            {
               // Position too small to split - mark as taken
               partialTPTaken = true;
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
void CheckTradeHistory()
{
   // Check if any new deals have been added to history
   HistorySelect(0, TimeCurrent());
   int totalDeals = HistoryDealsTotal();
   
   if(totalDeals <= lastHistoryCount) return;
   
   // Process new deals
   for(int i = lastHistoryCount; i < totalDeals; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0) continue;
      
      // Only check deals from this EA
      if(HistoryDealGetInteger(dealTicket, DEAL_MAGIC) != (long)activeMagicNumber) continue;
      if(HistoryDealGetString(dealTicket, DEAL_SYMBOL) != _Symbol) continue;
      
      // Only check exit deals (not entry deals)
      long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
      if(dealEntry != DEAL_ENTRY_OUT && dealEntry != DEAL_ENTRY_INOUT) continue;
      
      double dealProfit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT) +
                          HistoryDealGetDouble(dealTicket, DEAL_SWAP) +
                          HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
      
      if(dealProfit < 0)
      {
         consecutiveLosses++;
         Print("Smart Recovery: Loss detected. Consecutive losses: ", consecutiveLosses);
      }
      else if(dealProfit > 0)
      {
         if(consecutiveLosses > 0)
            Print("Smart Recovery: Win detected. Resetting consecutive loss counter from ", consecutiveLosses);
         consecutiveLosses = 0;
      }
   }
   
   lastHistoryCount = totalDeals;
}

//+------------------------------------------------------------------+
//| DASHBOARD                                                         |
//+------------------------------------------------------------------+
void UpdateDashboard()
{
   double ema9Buf[], ema21Buf[], ema50Buf[], rsiBuf[], macdMBuf[], macdSBuf[], adxBuf[], atrBuf[];
   CopyBuffer(handleEmaFast, 0, 0, 1, ema9Buf);
   CopyBuffer(handleEmaMed,  0, 0, 1, ema21Buf);
   CopyBuffer(handleEmaSlow, 0, 0, 1, ema50Buf);
   CopyBuffer(handleRSI,     0, 0, 1, rsiBuf);
   CopyBuffer(handleMACD,    0, 0, 1, macdMBuf);
   CopyBuffer(handleMACD,    1, 0, 1, macdSBuf);
   CopyBuffer(handleADX,     0, 0, 1, adxBuf);
   CopyBuffer(handleATR,     0, 0, 1, atrBuf);
   
   double rsiVal = (ArraySize(rsiBuf) > 0) ? rsiBuf[0] : 50;
   double ema9v  = (ArraySize(ema9Buf) > 0) ? ema9Buf[0] : 0;
   double ema21v = (ArraySize(ema21Buf) > 0) ? ema21Buf[0] : 0;
   double ema50v = (ArraySize(ema50Buf) > 0) ? ema50Buf[0] : 0;
   double macdM  = (ArraySize(macdMBuf) > 0) ? macdMBuf[0] : 0;
   double macdS  = (ArraySize(macdSBuf) > 0) ? macdSBuf[0] : 0;
   double adxVal = (ArraySize(adxBuf) > 0) ? adxBuf[0] : 0;
   double atrVal = (ArraySize(atrBuf) > 0) ? atrBuf[0] : 0;
   
   long spreadPts = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   double spreadPips = (double)spreadPts / 10.0;
   
   // MTF Status
   string mtfStatus = "N/A";
   if(UseMTFFilter)
   {
      double e9h4[1], e21h4[1], e9d1[1], e21d1[1];
      if(CopyBuffer(handleEmaFast_H4, 0, 0, 1, e9h4) >= 1 &&
         CopyBuffer(handleEmaMed_H4,  0, 0, 1, e21h4) >= 1 &&
         CopyBuffer(handleEmaFast_D1, 0, 0, 1, e9d1) >= 1 &&
         CopyBuffer(handleEmaMed_D1,  0, 0, 1, e21d1) >= 1)
      {
         bool h4Bull = e9h4[0] > e21h4[0];
         bool d1Bull = e9d1[0] > e21d1[0];
         if(h4Bull && d1Bull) mtfStatus = "BULLISH (H4+D1)";
         else if(!h4Bull && !d1Bull) mtfStatus = "BEARISH (H4+D1)";
         else mtfStatus = "MIXED (No Trade)";
      }
   }
   
   // Trend
   string trend = "Neutral";
   if(ema9v > ema21v && ema21v > ema50v) trend = "BULLISH";
   else if(ema9v < ema21v && ema21v < ema50v) trend = "BEARISH";
   else if(ema9v > ema21v) trend = "Lean Bull";
   else trend = "Lean Bear";
   
   // RSI / MACD / ADX
   string rsiStatus = rsiVal > RSI_Overbought ? "OVERBOUGHT" : rsiVal < RSI_Oversold ? "OVERSOLD" : "Neutral";
   string macdStatus = (macdM > macdS) ? "Bullish" : "Bearish";
   string adxStatus = adxVal >= ADX_MinStrength ? ("Strong: " + DoubleToString(adxVal, 1)) : ("Weak: " + DoubleToString(adxVal, 1));
   
   // Position
   string posText = "FLAT";
   double posProfit = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol && posInfo.Magic() == activeMagicNumber)
         {
            int dg = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
            posText = (posInfo.PositionType() == POSITION_TYPE_BUY ? "LONG" : "SHORT");
            posText += " @ " + DoubleToString(posInfo.PriceOpen(), dg);
            posProfit = posInfo.Profit() + posInfo.Swap() + posInfo.Commission();
            break;
         }
      }
   }
   
   // Session
   MqlDateTime ts; TimeCurrent(ts);
   string sess = "Off-Session";
   if(ts.hour >= 0 && ts.hour < 9) sess = "Tokyo";
   if(ts.hour >= 7 && ts.hour < 16) sess = "London";
   if(ts.hour >= 12 && ts.hour < 16) sess = "London+NY";
   if(ts.hour >= 16 && ts.hour < 21) sess = "New York";
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double floatLossPct = balance > 0 ? ((balance - equity) / balance) * 100.0 : 0;
   
   // Stochastic
   double stochKBuf[], stochDBuf[];
   CopyBuffer(handleStoch, 0, 0, 1, stochKBuf);
   CopyBuffer(handleStoch, 1, 0, 1, stochDBuf);
   double stochKVal = (ArraySize(stochKBuf) > 0) ? stochKBuf[0] : 50;
   double stochDVal = (ArraySize(stochDBuf) > 0) ? stochDBuf[0] : 50;
   string stochStatus = stochKVal > 70 ? "OVERBOUGHT" : stochKVal < 30 ? "OVERSOLD" : "Neutral";
   
   // Build dashboard
   string d = "";
   d += "=== FOREX MASTER PRO v4.0 (POWERHOUSE) ===\n";
   d += "    7-Indicator Confluence System\n";
   if(isGold)
   {
      d += "★ OPTIMIZED GOLD (XAUUSD) MODE ACTIVE ★\n";
      if(_Period != PERIOD_M5 && _Period != PERIOD_M15)
      {
         d += "⚠️ WARNING: Use M5 or M15 TF for Gold!\n";
      }
   }
   d += "Pair:       " + _Symbol + " (" + GetTimeframeString(_Period) + ") | " + sess + "\n";
   d += "Spread:     " + DoubleToString(spreadPips, 1) + " pips" + (isGold && spreadPips * 10 > 60 ? " (TOO WIDE!)" : "") + "\n";
   d += "--------------------------------\n";
   d += "Trend:      " + trend + "\n";
   d += "RSI(" + IntegerToString(RSI_Period) + "):    " + DoubleToString(rsiVal, 1) + " - " + rsiStatus + "\n";
   d += "MACD:       " + macdStatus + "\n";
   d += "Stoch(%K):  " + DoubleToString(stochKVal, 1) + " / %D: " + DoubleToString(stochDVal, 1) + " - " + stochStatus + "\n";
   d += "ADX:        " + adxStatus + (adxVal < ADX_MinStrength ? " (NO TRADE)" : " (OK)") + "\n";
   d += "MTF:        " + mtfStatus + "\n";
   d += "--------------------------------\n";
   d += "Position:   " + posText + "\n";
   d += "P/L:        $" + DoubleToString(posProfit, 2) + "\n";
   if(UsePartialTP)
      d += "Partial TP: " + (partialTPTaken ? "TAKEN (50% closed)" : "Waiting for TP1") + "\n";
   d += "--------------------------------\n";
   d += "Balance:    $" + DoubleToString(balance, 2) + "\n";
   d += "Equity:     $" + DoubleToString(equity, 2) + "\n";
   
   // Circuit Breaker with auto-reset countdown
   if(!UseCircuitBreaker)
   {
      d += "Circuit B.: Disabled\n";
   }
   else if(circuitBreakerTripped)
   {
      int elapsedMin = (int)((TimeCurrent() - circuitBreakerTripTime) / 60);
      int remainMin = CB_CooldownMinutes - elapsedMin;
      if(remainMin < 0) remainMin = 0;
      d += "Circuit B.: TRIPPED! Auto-reset in " + IntegerToString(remainMin) + " min\n";
   }
   else
   {
      d += "Circuit B.: Active (auto-reset enabled)\n";
   }
   
   d += "Float Loss: " + (!UseCircuitBreaker ? "N/A" : (DoubleToString(floatLossPct, 2) + "% / " + DoubleToString(MaxFloatingLossPct, 1) + "%")) + "\n";
   if(UseSmartRecovery)
      d += "Losses:     " + IntegerToString(consecutiveLosses) + " consecutive" +
           (consecutiveLosses >= LossesBeforeReduce ? " (LOT REDUCED)" : "") + "\n";
   d += "Risk:       " + DoubleToString(RiskPercent, 1) + "% per trade\n";
   d += "Score Req:  " + IntegerToString(isGold ? 5 : MinSignalScore) + "/7\n";
   d += "================================\n";
   
   Comment(d);
}

//+------------------------------------------------------------------+
//| END OF EXPERT ADVISOR v4.0                                        |
//+------------------------------------------------------------------+
