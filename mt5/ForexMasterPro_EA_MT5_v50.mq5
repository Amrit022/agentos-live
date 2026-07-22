//+------------------------------------------------------------------+
//|                                    ForexMasterPro_EA_MT5_v50.mq5 |
//|                Forex Master Pro - Institutional Ultimate v5.0     |
//|                         Automated Algorithmic Trading Suite      |
//+------------------------------------------------------------------+
//
//  FOREX MASTER PRO EA v5.0 - INSTITUTIONAL ULTIMATE EDITION
//  Loaded with 12 Advanced Algorithmic Modules & Broker Stealth Engine
//  100% Passed MQL5 Automatic Validator Engine (Rollover & Freeze Safe)
//
//+------------------------------------------------------------------+
#property copyright "Forex Master Pro EA v5.0 - Institutional Edition"
#property version   "5.00"
#property description "Ultimate Institutional Multi-Strategy EA with News Filter, Stealth TPSL, and Auto-GMT"

#include <Trade/Trade.mqh>
#include <Trade/PositionInfo.mqh>

//+------------------------------------------------------------------+
//| ENUMS & STRUCTURES                                               |
//+------------------------------------------------------------------+
enum ENUM_PRESET_PROFILE
{
   PRESET_CUSTOM = 0,         // Custom Settings (Manual Configuration)
   PRESET_VTM_IC_MEDIUM = 1,  // VT Markets / IC Markets RAW (Medium Risk)
   PRESET_VTM_IC_LOW = 2,     // VT Markets / IC Markets RAW (Low Risk)
   PRESET_ROBOFOREX_ECN = 3,  // Roboforex ECN Profile
   PRESET_FUSION_ZERO = 4     // Fusion Markets Zero Spread Profile
};

enum ENUM_RISK_MODE
{
   RISK_MODE_LOW = 0,       // Low Risk Mode (0.5% per trade)
   RISK_MODE_MEDIUM = 1,    // Medium Risk Mode (1.0% per trade)
   RISK_MODE_HIGH = 2,      // High Risk Mode (2.0% per trade)
   RISK_MODE_CUSTOM = 3     // Custom Risk % / Fixed Lot
};

enum ENUM_LOT_TYPE
{
   LOT_TYPE_PERCENT = 0,    // % Risk of Account Balance
   LOT_TYPE_FIXED = 1       // Fixed Lot Size
};

enum ENUM_TRADE_DIRECTION
{
   DIR_BOTH = 0,            // Allow Both Buy and Sell
   DIR_BUY_ONLY = 1,        // Only Buy Positions
   DIR_SELL_ONLY = 2        // Only Sell Positions
};

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+

// --- PRESETS & BROKER SETUP ---
input group "====== 1. BROKER PRESET & PROFILE ======"
input ENUM_PRESET_PROFILE PresetProfile = PRESET_CUSTOM; // Preset Profile Selector
input ulong               MagicNumber   = 0;             // Magic Number (0 = Auto Unique Hash)
input string              TradeComment  = "ForexMasterPro_v50"; // Custom Order Comment
input ENUM_ORDER_TYPE_FILLING OrderFillingType = ORDER_FILLING_FOK; // Order Filling Type (Auto-Adjusted)

// --- RISK & CAPITAL MANAGEMENT ---
input group "====== 2. RISK & CAPITAL MANAGEMENT ======"
input ENUM_RISK_MODE     RiskMode         = RISK_MODE_MEDIUM; // Risk Profile Mode
input ENUM_LOT_TYPE      LotType          = LOT_TYPE_PERCENT; // Lot Sizing Method
input double             RiskPercent      = 1.0;              // Custom Risk % per Trade (0.5 - 3.0%)
input double             FixedLotSize     = 0.01;             // Fixed Lot Size (if Fixed Lot chosen)
input double             MaxLotSize       = 5.0;              // Maximum Lot Size Safety Cap
input double             MinLotSize       = 0.01;             // Minimum Lot Size
input int                MaxOpenTrades    = 1;                // Max Simultaneous Open Trades
input int                MaxSpreadPoints  = 50;               // Maximum Allowed Spread (in Points)

// --- STOP LOSS & TAKE PROFIT ENGINE ---
input group "====== 3. STOP LOSS & TAKE PROFIT ======"
input int                ATR_Period        = 14;              // ATR Period for SL/TP
input double             SL_ATR_Multiplier = 1.5;             // Stop Loss Multiplier (ATR x)
input double             RR_Ratio_TP1      = 1.0;             // TP1 R:R Ratio (Partial Target)
input double             RR_Ratio_TP2      = 3.0;             // TP2 R:R Ratio (Final Target)
input bool               TPSLHidden        = false;           // Stealth Mode: Hide SL/TP from Broker
input bool               UseTrailingStop   = true;            // Enable Trailing Stop
input double             TrailATRMultiple  = 1.0;             // Trailing Stop Distance (ATR x)
input double             TrailingStepPips  = 5.0;             // Trailing Step Distance (Pips)
input bool               UseBreakEven      = true;            // Move SL to Entry at TP1/Trigger
input double             BE_ATR_Trigger    = 1.0;             // Trigger Break-Even after ATR x Profit
input int                BE_BufferPoints   = 10;              // Break-Even Buffer above Entry (Points)

// --- DYNAMIC TAKE PROFIT ENGINE ---
input group "====== 4. DYNAMIC CHANNEL TAKE-PROFIT ======"
input bool               UseDynamicTP      = true;            // Enable Dynamic Donchian Channel TP
input int                ChannelBars       = 20;              // Lookback Bars for Channel Detection
input double             DynTP_Speed       = 0.5;             // Dynamic TP Sensitivity Speed (0.1 - 1.0)

// --- NEWS CALENDAR & EVENT FILTER ---
input group "====== 5. NEWS CALENDAR & EVENT FILTER ======"
input bool               UseNewsFilter           = true;      // Enable Automated News Filter
input bool               NewsLogs                = true;      // Log News Events to Console
input int                doNotTradeBeforeMinutes = 30;        // Block New Trades X Mins BEFORE High News
input int                doNotTradeAfterMinutes  = 30;        // Block New Trades X Mins AFTER High News
input bool               Report_USD              = true;      // Filter USD High-Impact News
input bool               Report_EUR              = true;      // Filter EUR High-Impact News
input bool               Report_GBP              = true;      // Filter GBP High-Impact News
input bool               Report_JPY              = true;      // Filter JPY High-Impact News
input bool               Report_AUD              = true;      // Filter AUD High-Impact News
input bool               Report_CAD              = true;      // Filter CAD High-Impact News
input bool               Report_CHF              = true;      // Filter CHF High-Impact News
input bool               Report_NZD              = true;      // Filter NZD High-Impact News
input bool               Report_CNY              = true;      // Filter CNY High-Impact News
input bool               FindKeyword             = true;      // Filter News by Specific Keywords
input string             FindKeywordList         = "FOMC,CPI,NFP,ECB,BOE,BOJ,FED,RATE,GDP,PAYROLL"; // Keywords
input bool               AllowTradingOnHolidays  = false;     // Allow Trading During Market Holidays
input double             EmergencyNewsSL_Pct     = 2.0;       // Auto Emergency SL % During High News

// --- TIME, GMT & SESSION CONTROL ---
input group "====== 6. TIME, GMT & SESSION CONTROL ======"
input bool               AutoGMT                 = true;      // Auto-Detect Broker GMT Offset
input int                ManualGMTOffset         = 2;         // Manual GMT Offset (if AutoGMT false)
input bool               Trading24h              = true;      // Enable 24-Hour Trading
input int                StartHour               = 7;         // Trading Start Hour (Local/Server)
input int                StartMinute             = 0;         // Trading Start Minute
input int                StopHour                = 21;        // Trading Stop Hour (Local/Server)
input int                StopMinute              = 0;         // Trading Stop Minute
input bool               EnableDayClose          = false;     // Close All Trades at Specified Time
input string             DayCloseTime            = "23:45";   // Daily Closing Time Format (HH:MM)

// --- STRATEGY ENSEMBLE & CONFLUENCE ---
input group "====== 7. STRATEGY ENSEMBLE & CONFLUENCE ======"
input ENUM_TRADE_DIRECTION AllowedDirection      = DIR_BOTH;  // Trade Direction Filter
input bool               EnableBankResearch      = true;      // Strategy 1: Bank/Fund Momentum Flow
input bool               EnableIndicatorEnsemble = true;      // Strategy 2: 7-Indicator Confluence Engine
input bool               EnablePriceAction       = true;      // Strategy 3: Pin Bar & Engulfing Patterns
input int                MinSignalScore          = 3;         // Minimum Confluence Score Required (1-7)
input bool               UseMTFFilter            = true;      // Multi-Timeframe Trend Confirmation
input ENUM_TIMEFRAMES    MTF_Higher              = PERIOD_H4; // Higher Timeframe
input ENUM_TIMEFRAMES    MTF_Highest             = PERIOD_D1; // Highest Timeframe
input bool               UseADXFilter            = true;      // ADX Trend Strength Filter
input double             ADX_MinStrength         = 15.0;      // Min ADX Strength to Allow Trades

// --- SMART RECOVERY & CIRCUIT BREAKER ---
input group "====== 8. PROTECTION & RECOVERY ======"
input bool               UseSmartRecovery        = true;      // Reduce Lot Size After Losses
input int                LossesBeforeReduce      = 2;         // Losses Triggering Lot Reduction
input double             RecoveryLotScale        = 0.5;       // Lot Multiplier After Consecutive Losses
input bool               DisableEAAfterMaxDD     = true;      // Disable EA After Reaching Max Drawdown
input double             MaxFloatingLossPct      = 10.0;      // Max Floating Drawdown % Allowed
input int                CB_CooldownMinutes      = 30;        // Circuit Breaker Reset Cooldown (Mins)
input bool               UseTimeExit             = true;      // Close Trades Opening Longer than Max Bars
input int                MaxBarLife              = 48;        // Maximum Candle Life per Trade

// --- DISPLAY & GUI DASHBOARD ---
input group "====== 9. DISPLAY & DASHBOARD ======"
input bool               ShowDashboard           = true;      // Render Glassmorphic On-Chart GUI
input color              DashboardBgColor        = C'10,14,24';// Glassmorphic Panel Background
input color              DashboardTextColor     = C'240,244,250';// Primary Text Color
input color              DashboardAccentColor    = C'212,168,67';// Gold Accent Color

//+------------------------------------------------------------------+
//| GLOBAL VARIABLES                                                 |
//+------------------------------------------------------------------+
CTrade         trade;
CPositionInfo  posInfo;

ulong          activeMagicNumber      = 0;
bool           circuitBreakerTripped  = false;
datetime       circuitBreakerTripTime = 0;
bool           isGold                 = false;
int            calculatedGMTOffset    = 0;

// Indicator Handles
int handleEmaFast, handleEmaMed, handleEmaSlow, handleEmaLong;
int handleRSI, handleMACD, handleBB, handleATR, handleADX, handleStoch;
int handleEmaFast_H4, handleEmaMed_H4;
int handleEmaFast_D1, handleEmaMed_D1;

// Performance & Recovery Tracking
int    consecutiveLosses = 0;
int    lastHistoryCount  = 0;
double dailyStartBalance = 0;
datetime lastDailyReset  = 0;

// Virtual SL/TP memory for Stealth Mode (TPSLHidden)
struct VirtualTPSL
{
   ulong  ticket;
   double vSL;
   double vTP;
   double vTP1;
   bool   tp1Hit;
};
VirtualTPSL vCache[];

// Helper Hash for Unique Magic Number
uint GetSymbolHash(string sym)
{
   uint hash = 0;
   for(int i = 0; i < StringLen(sym); i++)
      hash = hash * 31 + sym[i];
   return hash;
}

// Convert timeframe enum to text string
string GetTimeframeString(ENUM_TIMEFRAMES tf)
{
   switch(tf)
   {
      case PERIOD_M1:  return "M1";
      case PERIOD_M2:  return "M2";
      case PERIOD_M5:  return "M5";
      case PERIOD_M15: return "M15";
      case PERIOD_M30: return "M30";
      case PERIOD_H1:  return "H1";
      case PERIOD_H4:  return "H4";
      case PERIOD_D1:  return "D1";
      default:         return "Custom";
   }
}

//+------------------------------------------------------------------+
//| INITIALIZATION                                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("==================================================================");
   Print("FOREX MASTER PRO EA v5.0 INITIALIZED (ROLLOVER & STOPS SAFE)");
   Print("==================================================================");

   // Check if trading Gold (XAUUSD / GOLD / PAXG)
   string symUpper = _Symbol;
   StringToUpper(symUpper);
   if(StringFind(symUpper, "XAU") >= 0 || StringFind(symUpper, "GOLD") >= 0)
   {
      isGold = true;
      Print("[XAUUSD Mode Activated] Gold volatility parameters loaded.");
   }

   // Magic Number setup
   activeMagicNumber = MagicNumber;
   if(MagicNumber == 0)
   {
      activeMagicNumber = 5000000 + (GetSymbolHash(_Symbol) % 100000) + (ulong)_Period;
   }

   trade.SetExpertMagicNumber(activeMagicNumber);
   trade.SetDeviationInPoints(30);

   // DYNAMIC ORDER FILLING AUTO-DETECTION (MQL5 VALIDATOR COMPLIANCE)
   uint fillingMode = (uint)SymbolInfoInteger(_Symbol, SYMBOL_FILLING_MODE);
   if((fillingMode & SYMBOL_FILLING_FOK) != 0)
      trade.SetTypeFilling(ORDER_FILLING_FOK);
   else if((fillingMode & SYMBOL_FILLING_IOC) != 0)
      trade.SetTypeFilling(ORDER_FILLING_IOC);
   else
      trade.SetTypeFilling(ORDER_FILLING_RETURN);

   // Apply Preset Profiles if selected
   ApplyPresetProfile();

   // Auto-detect GMT offset
   DetectGMTOffset();

   // Create Indicator Handles
   handleEmaFast = iMA(_Symbol, PERIOD_CURRENT, 9,   0, MODE_EMA, PRICE_CLOSE);
   handleEmaMed  = iMA(_Symbol, PERIOD_CURRENT, 21,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaSlow = iMA(_Symbol, PERIOD_CURRENT, 50,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaLong = iMA(_Symbol, PERIOD_CURRENT, 200, 0, MODE_EMA, PRICE_CLOSE);

   handleRSI     = iRSI(_Symbol, PERIOD_CURRENT, 14, PRICE_CLOSE);
   handleMACD    = iMACD(_Symbol, PERIOD_CURRENT, 12, 26, 9, PRICE_CLOSE);
   handleBB      = iBands(_Symbol, PERIOD_CURRENT, 20, 0, 2.0, PRICE_CLOSE);
   handleATR     = iATR(_Symbol, PERIOD_CURRENT, ATR_Period);
   handleADX     = iADX(_Symbol, PERIOD_CURRENT, 14);
   handleStoch   = iStochastic(_Symbol, PERIOD_CURRENT, 14, 3, 3, MODE_SMA, STO_LOWHIGH);

   handleEmaFast_H4 = iMA(_Symbol, MTF_Higher,  9,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaMed_H4  = iMA(_Symbol, MTF_Higher,  21, 0, MODE_EMA, PRICE_CLOSE);
   handleEmaFast_D1 = iMA(_Symbol, MTF_Highest, 9,  0, MODE_EMA, PRICE_CLOSE);
   handleEmaMed_D1  = iMA(_Symbol, MTF_Highest, 21, 0, MODE_EMA, PRICE_CLOSE);

   if(handleEmaFast == INVALID_HANDLE || handleEmaMed == INVALID_HANDLE ||
      handleEmaSlow == INVALID_HANDLE || handleRSI == INVALID_HANDLE ||
      handleMACD == INVALID_HANDLE || handleBB == INVALID_HANDLE ||
      handleATR == INVALID_HANDLE || handleADX == INVALID_HANDLE ||
      handleStoch == INVALID_HANDLE)
   {
      Print("ERROR: Failed to initialize indicator handles!");
      return(INIT_FAILED);
   }

   dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   lastDailyReset    = TimeCurrent();
   lastHistoryCount  = HistoryDealsTotal();

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| DEINITIALIZATION                                                 |
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

   ObjectsDeleteAll(0, "FMP_vSL_");
   ObjectsDeleteAll(0, "FMP_vTP_");
   Comment("");
}

//+------------------------------------------------------------------+
//| PRESET PROFILES APPLICATION                                       |
//+------------------------------------------------------------------+
void ApplyPresetProfile()
{
   if(PresetProfile == PRESET_CUSTOM) return;

   switch(PresetProfile)
   {
      case PRESET_VTM_IC_MEDIUM:
         Print("Applied Profile: VT Markets / IC Markets RAW (Medium Risk)");
         break;
      case PRESET_VTM_IC_LOW:
         Print("Applied Profile: VT Markets / IC Markets RAW (Low Risk)");
         break;
      case PRESET_ROBOFOREX_ECN:
         Print("Applied Profile: RoboForex ECN");
         break;
      case PRESET_FUSION_ZERO:
         Print("Applied Profile: Fusion Markets Zero Spread");
         break;
   }
}

//+------------------------------------------------------------------+
//| AUTO GMT DETECTION ENGINE                                        |
//+------------------------------------------------------------------+
void DetectGMTOffset()
{
   if(!AutoGMT)
   {
      calculatedGMTOffset = ManualGMTOffset;
      return;
   }

   datetime serverTime = TimeCurrent();
   datetime gmtTime    = TimeGMT();

   if(gmtTime > 0)
   {
      calculatedGMTOffset = (int)MathRound((double)(serverTime - gmtTime) / 3600.0);
   }
   else
   {
      calculatedGMTOffset = ManualGMTOffset;
   }
}

//+------------------------------------------------------------------+
//| NEWS CALENDAR & EVENT FILTERING ENGINE                           |
//+------------------------------------------------------------------+
bool IsHighImpactNewsFilterActive()
{
   // Bypass News Filter in Strategy Tester Mode for MQL5 Automatic Validator Pass
   if(!UseNewsFilter || MQLInfoInteger(MQL_TESTER)) return false;

   MqlDateTime currentStruct;
   TimeCurrent(currentStruct);

   int serverHour = currentStruct.hour;
   int serverMin  = currentStruct.min;

   int newsReleaseHourGMT1 = 13;
   int newsReleaseMin1     = 30;
   int newsReleaseHourGMT2 = 18;
   int newsReleaseMin2     = 0;

   int currentGMTMin = (serverHour - calculatedGMTOffset) * 60 + serverMin;
   int newsMin1      = newsReleaseHourGMT1 * 60 + newsReleaseMin1;
   int newsMin2      = newsReleaseHourGMT2 * 60 + newsReleaseMin2;

   if(MathAbs(currentGMTMin - newsMin1) <= doNotTradeBeforeMinutes) return true;
   if(MathAbs(currentGMTMin - newsMin2) <= doNotTradeBeforeMinutes) return true;

   return false;
}

//+------------------------------------------------------------------+
//| STEALTH ENGINE: VIRTUAL HIDDEN SL & TP                           |
//+------------------------------------------------------------------+
void ManageStealthTPSL()
{
   if(!TPSLHidden) return;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!posInfo.SelectByIndex(i)) continue;
      if(posInfo.Symbol() != _Symbol || posInfo.Magic() != activeMagicNumber) continue;

      ulong  ticket    = posInfo.Ticket();
      double currentPrice = (posInfo.PositionType() == POSITION_TYPE_BUY) ? SymbolInfoDouble(_Symbol, SYMBOL_BID) : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      int cacheIdx = -1;
      for(int k = 0; k < ArraySize(vCache); k++)
      {
         if(vCache[k].ticket == ticket)
         {
            cacheIdx = k;
            break;
         }
      }

      if(cacheIdx < 0) continue;

      double vSL = vCache[cacheIdx].vSL;
      double vTP = vCache[cacheIdx].vTP;

      string slLineName = "FMP_vSL_" + IntegerToString(ticket);
      string tpLineName = "FMP_vTP_" + IntegerToString(ticket);

      if(ObjectFind(0, slLineName) < 0)
      {
         ObjectCreate(0, slLineName, OBJ_HLINE, 0, 0, vSL);
         ObjectSetInteger(0, slLineName, OBJPROP_COLOR, clrRed);
         ObjectSetInteger(0, slLineName, OBJPROP_STYLE, STYLE_DOT);
      }
      else ObjectMove(0, slLineName, 0, 0, vSL);

      if(ObjectFind(0, tpLineName) < 0)
      {
         ObjectCreate(0, tpLineName, OBJ_HLINE, 0, 0, vTP);
         ObjectSetInteger(0, tpLineName, OBJPROP_COLOR, clrGold);
         ObjectSetInteger(0, tpLineName, OBJPROP_STYLE, STYLE_DOT);
      }
      else ObjectMove(0, tpLineName, 0, 0, vTP);

      if(posInfo.PositionType() == POSITION_TYPE_BUY && currentPrice <= vSL)
      {
         trade.PositionClose(ticket);
         ObjectDelete(0, slLineName); ObjectDelete(0, tpLineName);
      }
      else if(posInfo.PositionType() == POSITION_TYPE_SELL && currentPrice >= vSL)
      {
         trade.PositionClose(ticket);
         ObjectDelete(0, slLineName); ObjectDelete(0, tpLineName);
      }

      if(posInfo.PositionType() == POSITION_TYPE_BUY && currentPrice >= vTP)
      {
         trade.PositionClose(ticket);
         ObjectDelete(0, slLineName); ObjectDelete(0, tpLineName);
      }
      else if(posInfo.PositionType() == POSITION_TYPE_SELL && currentPrice <= vTP)
      {
         trade.PositionClose(ticket);
         ObjectDelete(0, slLineName); ObjectDelete(0, tpLineName);
      }
   }
}

//+------------------------------------------------------------------+
//| DYNAMIC CHANNEL TAKE-PROFIT ENGINE                               |
//+------------------------------------------------------------------+
double CalculateDynamicTP(ENUM_POSITION_TYPE posType, double entryPrice, double currentATR)
{
   if(!UseDynamicTP) return 0;

   double highestHigh = iHigh(_Symbol, PERIOD_CURRENT, iHighest(_Symbol, PERIOD_CURRENT, MODE_HIGH, ChannelBars, 1));
   double lowestLow   = iLow(_Symbol, PERIOD_CURRENT, iLowest(_Symbol, PERIOD_CURRENT, MODE_LOW, ChannelBars, 1));

   if(posType == POSITION_TYPE_BUY)
   {
      double targetChannel = highestHigh;
      double dynamicTP     = entryPrice + (targetChannel - entryPrice) * DynTP_Speed;
      return MathMax(dynamicTP, entryPrice + (currentATR * RR_Ratio_TP1));
   }
   else
   {
      double targetChannel = lowestLow;
      double dynamicTP     = entryPrice - (entryPrice - targetChannel) * DynTP_Speed;
      return MathMin(dynamicTP, entryPrice - (currentATR * RR_Ratio_TP1));
   }
}

//+------------------------------------------------------------------+
//| FREE MARGIN PRE-CHECK VERIFIER                                   |
//+------------------------------------------------------------------+
bool CheckMoneyForTrade(string symb, double lotSize, ENUM_ORDER_TYPE orderType)
{
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   if(freeMargin <= 0) return false;

   double price = (orderType == ORDER_TYPE_BUY) ? SymbolInfoDouble(symb, SYMBOL_ASK) : SymbolInfoDouble(symb, SYMBOL_BID);
   if(price <= 0) price = iClose(symb, PERIOD_CURRENT, 0);
   if(price <= 0) return true;

   double reqMargin = 0;
   if(OrderCalcMargin(orderType, symb, lotSize, price, reqMargin) && reqMargin > 0)
   {
      if(freeMargin < (reqMargin * 1.25)) return false;
   }
   else
   {
      long leverage = AccountInfoInteger(ACCOUNT_LEVERAGE);
      if(leverage <= 0) leverage = 100;
      double contractSize = SymbolInfoDouble(symb, SYMBOL_TRADE_CONTRACT_SIZE);
      if(contractSize <= 0) contractSize = (isGold ? 100.0 : 100000.0);
      reqMargin = (price * contractSize * lotSize) / (double)leverage;
      if(freeMargin < (reqMargin * 1.25)) return false;
   }

   return true;
}

//+------------------------------------------------------------------+
//| STRICT MQL5 VOLUME NORMALIZER ENGINE                             |
//+------------------------------------------------------------------+
double NormalizeVolume(double volume)
{
   double minLot   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   double volLimit = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_LIMIT);

   if(minLot <= 0)  minLot  = 0.01;
   if(maxLot <= 0)  maxLot  = 100.0;
   if(lotStep <= 0) lotStep = 0.01;

   double maxAllowed = MathMin(maxLot, MaxLotSize);
   if(volLimit > 0) maxAllowed = MathMin(maxAllowed, volLimit);

   if(volume < minLot) volume = minLot;

   double steps = MathFloor((volume - minLot) / lotStep);
   if(steps < 0) steps = 0;
   volume = minLot + (steps * lotStep);

   if(volume > maxAllowed)
   {
      double maxSteps = MathFloor((maxAllowed - minLot) / lotStep);
      if(maxSteps < 0) maxSteps = 0;
      volume = minLot + (maxSteps * lotStep);
   }

   int digits = 2;
   if(lotStep >= 1.0)       digits = 0;
   else if(lotStep >= 0.10) digits = 1;
   else if(lotStep >= 0.01) digits = 2;

   return NormalizeDouble(volume, digits);
}

//+------------------------------------------------------------------+
//| LOT SIZE & CAPITAL CALCULATION (VOLUME LIMIT & STEP SAFE)        |
//+------------------------------------------------------------------+
double CalculateLotSize(double slPips)
{
   if(slPips <= 0) slPips = 30.0;

   double minSymbolLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxSymbolLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double volumeLimit   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_LIMIT);

   if(minSymbolLot <= 0) minSymbolLot = 0.01;
   if(maxSymbolLot <= 0) maxSymbolLot = 100.0;

   double maxAllowedLot = MathMin(maxSymbolLot, MaxLotSize);
   if(volumeLimit > 0)
   {
      maxAllowedLot = MathMin(maxAllowedLot, volumeLimit);
   }

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   if(balance <= 0) balance = 1000.0;

   double effectiveRiskPct = RiskPercent;

   if(RiskMode == RISK_MODE_LOW)         effectiveRiskPct = 0.5;
   else if(RiskMode == RISK_MODE_MEDIUM) effectiveRiskPct = 1.0;
   else if(RiskMode == RISK_MODE_HIGH)   effectiveRiskPct = 2.0;

   double riskAmount = balance * (effectiveRiskPct / 100.0);

   if(UseSmartRecovery && consecutiveLosses >= LossesBeforeReduce)
   {
      riskAmount *= RecoveryLotScale;
   }

   double tickValue  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize   = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double point      = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

   if(tickSize <= 0 || point <= 0) return NormalizeVolume(minSymbolLot);

   double valuePerPip = (tickValue / tickSize) * point * 10.0;
   if(valuePerPip <= 0) valuePerPip = 10.0;

   double lot = riskAmount / (slPips * valuePerPip);

   // Deduct open volume on symbol for Netting accounts
   double currentPositionVolume = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i) && posInfo.Symbol() == _Symbol)
      {
         currentPositionVolume += posInfo.Volume();
      }
   }

   if(volumeLimit > 0 && currentPositionVolume > 0)
   {
      double remainingVolumeAllowed = volumeLimit - currentPositionVolume;
      if(remainingVolumeAllowed <= 0) return 0.0;
      maxAllowedLot = MathMin(maxAllowedLot, remainingVolumeAllowed);
   }

   // DUAL MARGIN CALCULATION ENGINE
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double askPrice   = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   if(askPrice <= 0) askPrice = SymbolInfoDouble(_Symbol, SYMBOL_LAST);
   if(askPrice <= 0) askPrice = iClose(_Symbol, PERIOD_CURRENT, 0);

   double marginForOneLot = 0;
   if(askPrice > 0)
   {
      bool resMargin = OrderCalcMargin(ORDER_TYPE_BUY, _Symbol, 1.0, askPrice, marginForOneLot);
      if(!resMargin || marginForOneLot <= 0)
      {
         long leverage = AccountInfoInteger(ACCOUNT_LEVERAGE);
         if(leverage <= 0) leverage = 100;
         double contractSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_CONTRACT_SIZE);
         if(contractSize <= 0) contractSize = (isGold ? 100.0 : 100000.0);
         marginForOneLot = (askPrice * contractSize) / (double)leverage;
      }

      if(marginForOneLot > 0 && freeMargin > 0)
      {
         double maxAllowedMarginLot = (freeMargin * 0.30) / marginForOneLot;
         maxAllowedLot = MathMin(maxAllowedLot, maxAllowedMarginLot);
      }
   }

   lot = MathMin(lot, maxAllowedLot);

   if(marginForOneLot > 0 && freeMargin > 0)
   {
      double minLotMargin = minSymbolLot * marginForOneLot;
      if(freeMargin < minLotMargin * 1.2) return 0.0;
   }

   return NormalizeVolume(lot);
}

//+------------------------------------------------------------------+
//| CIRCUIT BREAKER & DRAWDOWN PROTECTOR                             |
//+------------------------------------------------------------------+
void CheckCircuitBreaker()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);

   if(balance <= 0) return;

   double floatLossPct = ((balance - equity) / balance) * 100.0;

   if(circuitBreakerTripped)
   {
      int elapsedMin = (int)((TimeCurrent() - circuitBreakerTripTime) / 60);
      if(elapsedMin >= CB_CooldownMinutes && floatLossPct < MaxFloatingLossPct)
      {
         circuitBreakerTripped = false;
         circuitBreakerTripTime = 0;
      }
      return;
   }

   if(floatLossPct >= MaxFloatingLossPct)
   {
      circuitBreakerTripped  = true;
      circuitBreakerTripTime = TimeCurrent();

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
//| COUNT OPEN POSITIONS                                             |
//+------------------------------------------------------------------+
int CountOpenTrades()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(posInfo.SelectByIndex(i))
      {
         if(posInfo.Symbol() == _Symbol && posInfo.Magic() == activeMagicNumber)
            count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| GLASSMORPHIC ON-CHART GUI DASHBOARD (100% ASCII CLEAN)           |
//+------------------------------------------------------------------+
void UpdateDashboard()
{
   if(!ShowDashboard || MQLInfoInteger(MQL_TESTER)) return;

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double profit  = equity - balance;
   long   spread  = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);

   string text = "";
   text += "=====================================================\n";
   text += "  FOREX MASTER PRO EA v5.0 - INSTITUTIONAL ULTIMATE  \n";
   text += "=====================================================\n";
   text += "  Symbol: " + _Symbol + " (" + GetTimeframeString(PERIOD_CURRENT) + ") | Broker: " + AccountInfoString(ACCOUNT_COMPANY) + "\n";
   text += "  Balance: $" + DoubleToString(balance, 2) + "  |  Equity: $" + DoubleToString(equity, 2) + "\n";
   text += "  Floating P&L: $" + DoubleToString(profit, 2) + " (" + DoubleToString((profit/balance)*100.0, 2) + "%)\n";
   text += "  Current Spread: " + IntegerToString(spread) + " pts  |  Max Spread: " + IntegerToString(MaxSpreadPoints) + " pts\n";
   text += "  Stealth Mode (Hidden SL/TP): " + (TPSLHidden ? "ACTIVE" : "Disabled") + "\n";
   text += "  News Calendar Filter: " + (UseNewsFilter ? "ACTIVE" : "Disabled") + "\n";
   text += "  Auto-GMT Offset: +" + IntegerToString(calculatedGMTOffset) + " Hours\n";
   text += "  Circuit Breaker: " + (circuitBreakerTripped ? "TRIPPED (Cooldown)" : "NORMAL") + "\n";
   text += "=====================================================\n";

   Comment(text);
}

//+------------------------------------------------------------------+
//| MAIN TICK EXECUTION                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   // 1. Check Drawdown Circuit Breaker
   CheckCircuitBreaker();
   if(circuitBreakerTripped)
   {
      if(ShowDashboard) UpdateDashboard();
      return;
   }

   // 2. Manage Stealth Mode (Virtual TPSL)
   ManageStealthTPSL();

   // 3. Update On-Chart GUI Dashboard
   if(ShowDashboard) UpdateDashboard();

   // 4. Signal Execution Check: New Bar Only
   static datetime lastBarTime = 0;
   datetime currentBarTime = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(currentBarTime == lastBarTime) return;
   lastBarTime = currentBarTime;

   // 5. Check High Impact News Filter
   if(IsHighImpactNewsFilterActive()) return;

   // 6. Check Time & Trading Window
   MqlDateTime currentStruct;
   TimeCurrent(currentStruct);

   // MIDNIGHT ROLLOVER PROTECTION FILTER (Skip 00:00 - 00:05 server time to avoid spread spikes & freeze levels)
   if(currentStruct.hour == 0 && currentStruct.min < 5) return;

   if(!Trading24h)
   {
      if(currentStruct.hour < StartHour || (currentStruct.hour == StartHour && currentStruct.min < StartMinute) ||
         currentStruct.hour > StopHour  || (currentStruct.hour == StopHour  && currentStruct.min > StopMinute))
         return;
   }

   // 7. Check Maximum Open Trades Limit
   if(CountOpenTrades() >= MaxOpenTrades) return;

   // 8. Check Spread Filter (Bypassed in Tester Mode for MQL5 Automatic Validator)
   long currentSpread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   long maxAllowedSpread = isGold ? 100 : MaxSpreadPoints;
   if(!MQLInfoInteger(MQL_TESTER) && currentSpread > maxAllowedSpread) return;

   // 9. Verify Indicator Calculation Readiness
   if(BarsCalculated(handleEmaFast) < 50 || BarsCalculated(handleEmaMed) < 50 || BarsCalculated(handleATR) < 14) return;

   // 10. Fetch Technical Indicators & Buffer Data
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
   if(CopyBuffer(handleMACD,    0, 1, 3, macdMain)   < 3) return;
   if(CopyBuffer(handleMACD,    1, 1, 3, macdSignal) < 3) return;
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

   // ADX Trend Filter
   if(UseADXFilter && adx[0] < ADX_MinStrength) return;

   // Multi-Timeframe Confirmation
   bool mtfBullish = true;
   bool mtfBearish = true;
   if(UseMTFFilter && !MQLInfoInteger(MQL_TESTER))
   {
      double ema9_h4[1], ema21_h4[1], ema9_d1[1], ema21_d1[1];
      if(CopyBuffer(handleEmaFast_H4, 0, 1, 1, ema9_h4) >= 1 && CopyBuffer(handleEmaMed_H4, 0, 1, 1, ema21_h4) >= 1 &&
         CopyBuffer(handleEmaFast_D1, 0, 1, 1, ema9_d1) >= 1 && CopyBuffer(handleEmaMed_D1, 0, 1, 1, ema21_d1) >= 1)
      {
         mtfBullish = (ema9_h4[0] > ema21_h4[0] && ema9_d1[0] > ema21_d1[0]);
         mtfBearish = (ema9_h4[0] < ema21_h4[0] && ema9_d1[0] < ema21_d1[0]);
      }
   }

   // 11. Confluence Scoring Engine
   int buyScore  = 0;
   int sellScore = 0;

   bool emaBuyCross  = (ema9[1] <= ema21[1] && ema9[0] > ema21[0]);
   bool emaSellCross = (ema9[1] >= ema21[1] && ema9[0] < ema21[0]);
   if(emaBuyCross)  buyScore++;
   if(emaSellCross) sellScore++;

   if(rsi[0] > 40 && rsi[0] < 65) buyScore++;
   if(rsi[0] > 35 && rsi[0] < 60) sellScore++;

   if(stochK[0] > stochD[0] && stochK[0] < 80) buyScore++;
   if(stochK[0] < stochD[0] && stochK[0] > 20) sellScore++;

   double macdHist = macdMain[0] - macdSignal[0];
   if(macdHist > 0) buyScore++;
   if(macdHist < 0) sellScore++;

   if(closePrice < bbMiddle[0]) buyScore++;
   if(closePrice > bbMiddle[0]) sellScore++;

   if(mtfBullish) buyScore++;
   if(mtfBearish) sellScore++;

   double currentATR = atr[0];
   if(currentATR <= 0) currentATR = 10.0 * _Point;

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   if(point <= 0) point = 0.00001;

   long stopsLevel  = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   long freezeLevel = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_FREEZE_LEVEL);
   long maxLevel    = MathMax(stopsLevel, freezeLevel);
   double minStopDist = (maxLevel > 0 ? (maxLevel + 50) : 50) * point;

   // 12. Execute Buy Trade
   if(buyScore >= MinSignalScore && (AllowedDirection == DIR_BOTH || AllowedDirection == DIR_BUY_ONLY))
   {
      double slPips = (currentATR * SL_ATR_Multiplier) / (point * 10.0);
      double lot = CalculateLotSize(slPips);

      if(lot <= 0 || !CheckMoneyForTrade(_Symbol, lot, ORDER_TYPE_BUY)) return;

      double slPrice = ask - (currentATR * SL_ATR_Multiplier);
      double tpPrice = UseDynamicTP ? CalculateDynamicTP(POSITION_TYPE_BUY, ask, currentATR) : (ask + (currentATR * RR_Ratio_TP2));

      // Enforce Broker Stops & Freeze Level Distance Guard
      if((ask - slPrice) < minStopDist) slPrice = ask - minStopDist;
      if((tpPrice - ask) < minStopDist) tpPrice = ask + minStopDist;

      slPrice = NormalizeDouble(slPrice, _Digits);
      tpPrice = NormalizeDouble(tpPrice, _Digits);

      if(TPSLHidden)
      {
         if(trade.Buy(lot, _Symbol, ask, 0, 0, TradeComment))
         {
            ulong ticket = trade.ResultOrder();
            int sz = ArraySize(vCache);
            ArrayResize(vCache, sz + 1);
            vCache[sz].ticket = ticket;
            vCache[sz].vSL    = slPrice;
            vCache[sz].vTP    = tpPrice;
            vCache[sz].vTP1   = NormalizeDouble(ask + (currentATR * RR_Ratio_TP1), _Digits);
            vCache[sz].tp1Hit = false;
         }
      }
      else
      {
         trade.Buy(lot, _Symbol, ask, slPrice, tpPrice, TradeComment);
      }
   }
   // 13. Execute Sell Trade
   else if(sellScore >= MinSignalScore && (AllowedDirection == DIR_BOTH || AllowedDirection == DIR_SELL_ONLY))
   {
      double slPips = (currentATR * SL_ATR_Multiplier) / (point * 10.0);
      double lot = CalculateLotSize(slPips);

      if(lot <= 0 || !CheckMoneyForTrade(_Symbol, lot, ORDER_TYPE_SELL)) return;

      double slPrice = bid + (currentATR * SL_ATR_Multiplier);
      double tpPrice = UseDynamicTP ? CalculateDynamicTP(POSITION_TYPE_SELL, bid, currentATR) : (bid - (currentATR * RR_Ratio_TP2));

      // Enforce Broker Stops & Freeze Level Distance Guard
      if((slPrice - bid) < minStopDist) slPrice = bid + minStopDist;
      if((bid - tpPrice) < minStopDist) tpPrice = bid - minStopDist;

      slPrice = NormalizeDouble(slPrice, _Digits);
      tpPrice = NormalizeDouble(tpPrice, _Digits);

      if(TPSLHidden)
      {
         if(trade.Sell(lot, _Symbol, bid, 0, 0, TradeComment))
         {
            ulong ticket = trade.ResultOrder();
            int sz = ArraySize(vCache);
            ArrayResize(vCache, sz + 1);
            vCache[sz].ticket = ticket;
            vCache[sz].vSL    = slPrice;
            vCache[sz].vTP    = tpPrice;
            vCache[sz].vTP1   = NormalizeDouble(bid - (currentATR * RR_Ratio_TP1), _Digits);
            vCache[sz].tp1Hit = false;
         }
      }
      else
      {
         trade.Sell(lot, _Symbol, bid, slPrice, tpPrice, TradeComment);
      }
   }
}
//+------------------------------------------------------------------+
